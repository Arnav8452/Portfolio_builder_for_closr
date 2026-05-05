from __future__ import annotations

from typing import Any

import feedparser


def fetch_rss_feed(url: str) -> dict[str, Any]:
    parsed = feedparser.parse(url)
    entries = parsed.entries[:20]
    raw_text = "\n\n".join(
        "\n".join(
            part
            for part in [
                entry.get("title", ""),
                entry.get("summary", ""),
                entry.get("link", ""),
            ]
            if part
        )
        for entry in entries
    )
    return {
        "handle": None,
        "display_name": parsed.feed.get("title", url),
        "metrics": {"entry_count": len(entries)},
        "recent_items": [
            {
                "title": entry.get("title"),
                "summary": entry.get("summary"),
                "url": entry.get("link"),
                "published": entry.get("published"),
            }
            for entry in entries[:10]
        ],
        "raw_text": raw_text,
        "raw_payload": {"feed": dict(parsed.feed), "entries": [dict(entry) for entry in entries[:10]]},
    }

