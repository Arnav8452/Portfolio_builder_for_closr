from __future__ import annotations

import logging
import time

from .config import get_settings
from .db import get_client
from .identity import score_identity
from .platforms import fetch_platform
from .queues import claim_scraping_jobs, complete_scraping_job, emit_event, fail_job
from .rss import fetch_rss_feed

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("portfolio_worker.ingestion")


def _fetch(job: dict) -> dict:
    platform = job["platform"]
    if platform in {"medium", "substack"} and job["url"].endswith((".xml", "/feed", "/rss")):
        return fetch_rss_feed(job["url"])
    return fetch_platform(job)


def process_job(job: dict) -> None:
    creator_id = job["creator_id"]
    emit_event(creator_id, "scraping_started", f"Fetching {job['platform']} evidence.", {"job_id": job["id"]})

    raw_output = _fetch(job)
    client = get_client()
    creator_result = client.table("creators").select("display_name,root_handle").eq("id", creator_id).single().execute()
    creator = creator_result.data or {}
    root_links_result = (
        client.table("creator_links")
        .select("normalized_url")
        .eq("creator_id", creator_id)
        .eq("verification_level", 3)
        .execute()
    )
    root_urls = [row["normalized_url"] for row in root_links_result.data or [] if row.get("normalized_url")]
    root_identity = {
        "handle": creator.get("root_handle"),
        "display_name": creator.get("display_name"),
        "known_urls": root_urls,
    }
    verdict = score_identity(root_identity, raw_output)
    raw_output["verification"] = {
        "level": verdict.level,
        "score": verdict.score,
        "method": verdict.method,
        "chain": verdict.chain,
    }

    if job.get("link_id"):
        client.table("creator_links").update(
            {
                "verification_level": verdict.level,
                "verification_status": "verified" if verdict.level >= 2 else "challenge_required",
                "verification_chain": verdict.chain,
                "raw_identity": raw_output,
                "last_verified_at": "now()",
            }
        ).eq("id", job["link_id"]).execute()

    client.table("platform_data").upsert(
        {
            "creator_id": creator_id,
            "link_id": job.get("link_id"),
            "platform": job["platform"],
            "handle": raw_output.get("handle"),
            "identity_key": raw_output.get("handle") or raw_output.get("external_id") or job["url"],
            "metrics": raw_output.get("metrics") or {},
            "recent_items": raw_output.get("recent_items") or [],
            "raw_payload": raw_output.get("raw_payload") or {},
            "verified_via": verdict.method,
        },
        on_conflict="creator_id,platform,identity_key",
    ).execute()

    complete_scraping_job(job, raw_output)


def main() -> None:
    settings = get_settings()
    logger.info("Starting ingestion worker %s", settings.worker_id)
    while True:
        jobs = claim_scraping_jobs(settings.worker_id, settings.scraping_batch_size)
        if not jobs:
            time.sleep(settings.worker_poll_seconds)
            continue
        for job in jobs:
            try:
                process_job(job)
            except Exception as exc:
                logger.exception("Scraping job failed: %s", job.get("id"))
                fail_job("scraping_queue", job, exc)


if __name__ == "__main__":
    main()
