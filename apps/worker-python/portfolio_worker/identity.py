from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from rapidfuzz import fuzz


@dataclass(frozen=True)
class VerificationVerdict:
    level: int
    score: float
    method: str
    chain: dict[str, Any]


def score_identity(root: dict[str, Any], candidate: dict[str, Any]) -> VerificationVerdict:
    root_handle = str(root.get("handle") or "").lower().lstrip("@")
    candidate_handle = str(candidate.get("handle") or "").lower().lstrip("@")
    root_name = str(root.get("display_name") or "").lower()
    candidate_name = str(candidate.get("display_name") or "").lower()

    handle_score = fuzz.ratio(root_handle, candidate_handle) / 100 if root_handle and candidate_handle else 0
    name_score = fuzz.token_sort_ratio(root_name, candidate_name) / 100 if root_name and candidate_name else 0

    cross_links = candidate.get("cross_links") or []
    root_urls = {str(url).lower().rstrip("/") for url in root.get("known_urls") or []}
    candidate_links = {str(url).lower().rstrip("/") for url in cross_links}
    cross_link_score = 1.0 if root_urls.intersection(candidate_links) else 0.0

    canonical_root = str(root.get("canonical_url") or "").lower().rstrip("/")
    canonical_candidate = str(candidate.get("canonical_url") or "").lower().rstrip("/")
    canonical_score = 1.0 if canonical_root and canonical_root == canonical_candidate else 0.0

    phash_distance = candidate.get("phash_distance")
    phash_score = 0.0
    if isinstance(phash_distance, (int, float)):
        phash_score = max(0.0, min(1.0, 1 - (float(phash_distance) / 18)))

    score = (
        handle_score * 0.25
        + name_score * 0.20
        + cross_link_score * 0.30
        + canonical_score * 0.15
        + phash_score * 0.10
    )

    if candidate.get("oauth_verified"):
        return VerificationVerdict(
            level=3,
            score=1.0,
            method="oauth",
            chain={"oauth_verified": True},
        )

    level = 2 if score >= 0.72 else 1
    method = "topological" if level == 2 else "challenge_required"
    return VerificationVerdict(
        level=level,
        score=round(score, 3),
        method=method,
        chain={
            "handle_score": round(handle_score, 3),
            "name_score": round(name_score, 3),
            "cross_link_score": cross_link_score,
            "canonical_score": canonical_score,
            "phash_score": round(phash_score, 3),
        },
    )

