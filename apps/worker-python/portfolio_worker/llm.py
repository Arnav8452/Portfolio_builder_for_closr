from __future__ import annotations

import json
from typing import Any

import httpx

from .config import get_settings

ALLOWED_NICHES = {
    "ai_ml",
    "devtools",
    "software_engineering",
    "gaming",
    "creator_economy",
    "business_marketing",
    "finance",
    "education",
    "fitness_wellness",
    "beauty",
    "fashion",
    "food",
    "travel",
    "music",
    "photography_video",
    "lifestyle",
    "other",
}

ALLOWED_AUDIENCE_TIERS = {"micro", "emerging", "mid_market", "large", "enterprise"}

SYSTEM_PROMPT = """You are Closr's creator profile classifier.
Return only strict JSON. No markdown, no prose.

Schema:
{
  "primary_niche": "one enum",
  "technical_skills": ["short strings"],
  "brand_tone": ["short strings"],
  "content_format": ["short strings"],
  "audience_size_tier": "one enum",
  "past_topics": ["short strings"],
  "bio_summary": "one concise sentence",
  "confidence": 0.0
}

primary_niche enum:
ai_ml, devtools, software_engineering, gaming, creator_economy,
business_marketing, finance, education, fitness_wellness, beauty, fashion,
food, travel, music, photography_video, lifestyle, other

audience_size_tier enum:
micro, emerging, mid_market, large, enterprise
"""


def classify_creator(raw_text: str, payload: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    body = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Raw creator evidence:\n{raw_text[:8000]}\n\nPayload:\n{json.dumps(payload)[:4000]}",
            },
        ],
        "format": "json",
        "stream": False,
        "options": {"temperature": 0.0, "num_ctx": 4096, "num_predict": 800},
    }
    with httpx.Client(timeout=120) as client:
        response = client.post(f"{settings.ollama_base_url}/api/chat", json=body)
        response.raise_for_status()
    content = response.json().get("message", {}).get("content", "{}")
    parsed = json.loads(content)
    return sanitize_classification(parsed)


def sanitize_classification(parsed: dict[str, Any]) -> dict[str, Any]:
    niche = parsed.get("primary_niche")
    if niche not in ALLOWED_NICHES:
        niche = "other"
    tier = parsed.get("audience_size_tier")
    if tier not in ALLOWED_AUDIENCE_TIERS:
        tier = "micro"

    def list_of_strings(key: str, limit: int = 12) -> list[str]:
        values = parsed.get(key)
        if not isinstance(values, list):
            return []
        return [str(v).strip()[:80] for v in values if str(v).strip()][:limit]

    confidence = parsed.get("confidence", 0)
    try:
        confidence_float = max(0.0, min(1.0, float(confidence)))
    except (TypeError, ValueError):
        confidence_float = 0.0

    return {
        "primary_niche": niche,
        "technical_skills": list_of_strings("technical_skills"),
        "brand_tone": list_of_strings("brand_tone"),
        "content_format": list_of_strings("content_format"),
        "audience_size_tier": tier,
        "past_topics": list_of_strings("past_topics", limit=20),
        "bio_summary": str(parsed.get("bio_summary") or "")[:500],
        "confidence": confidence_float,
        "raw_model_output": parsed,
    }

