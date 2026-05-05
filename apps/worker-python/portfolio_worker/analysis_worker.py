from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from .config import get_settings
from .db import get_client
from .llm import classify_creator
from .queues import claim_analysis_jobs, emit_event, fail_job

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("portfolio_worker.analysis")


def process_job(job: dict) -> None:
    client = get_client()
    creator_id = job["creator_id"]
    emit_event(creator_id, "analysis_started", "Classifying creator profile.", {"job_id": job["id"]})

    classification = classify_creator(job["raw_text"], job.get("payload") or {})

    client.table("creator_identities").upsert(
        {
            "creator_id": creator_id,
            "primary_niche": classification["primary_niche"],
            "technical_skills": classification["technical_skills"],
            "brand_tone": classification["brand_tone"],
            "content_format": classification["content_format"],
            "audience_size_tier": classification["audience_size_tier"],
            "past_topics": classification["past_topics"],
            "bio_summary": classification["bio_summary"],
            "confidence": classification["confidence"],
            "raw_model_output": classification["raw_model_output"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="creator_id",
    ).execute()

    client.table("analysis_queue").update(
        {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", job["id"]).execute()

    client.table("creators").update({"onboarding_status": "analysis_completed"}).eq("id", creator_id).execute()
    emit_event(creator_id, "analysis_completed", "Verified portfolio is ready.", {"job_id": job["id"]})


def main() -> None:
    settings = get_settings()
    logger.info("Starting analysis worker %s", settings.worker_id)
    while True:
        jobs = claim_analysis_jobs(settings.worker_id, settings.analysis_batch_size)
        if not jobs:
            time.sleep(settings.worker_poll_seconds)
            continue
        for job in jobs:
            try:
                process_job(job)
            except Exception as exc:
                logger.exception("Analysis job failed: %s", job.get("id"))
                fail_job("analysis_queue", job, exc)


if __name__ == "__main__":
    main()
