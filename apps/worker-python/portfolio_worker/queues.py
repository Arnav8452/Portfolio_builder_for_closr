from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from .db import get_client


def claim_scraping_jobs(worker_id: str, batch_size: int) -> list[dict[str, Any]]:
    result = get_client().rpc(
        "claim_scraping_jobs",
        {"p_worker_id": worker_id, "p_batch_size": batch_size},
    ).execute()
    return result.data or []


def claim_analysis_jobs(worker_id: str, batch_size: int) -> list[dict[str, Any]]:
    result = get_client().rpc(
        "claim_analysis_jobs",
        {"p_worker_id": worker_id, "p_batch_size": batch_size},
    ).execute()
    return result.data or []


def emit_event(creator_id: str, event_type: str, message: str, payload: dict | None = None) -> None:
    get_client().table("creator_processing_events").insert(
        {
            "creator_id": creator_id,
            "event_type": event_type,
            "message": message,
            "payload": payload or {},
        }
    ).execute()


def complete_scraping_job(job: dict[str, Any], raw_output: dict[str, Any]) -> None:
    client = get_client()
    job_id = job["id"]
    creator_id = job["creator_id"]
    raw_text = raw_output.get("raw_text") or ""

    client.table("scraping_queue").update(
        {
            "status": "completed",
            "raw_output": raw_output,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", job_id).execute()

    if raw_text.strip():
        client.table("analysis_queue").insert(
            {
                "creator_id": creator_id,
                "scraping_job_id": job_id,
                "raw_text": raw_text,
                "payload": raw_output,
            }
        ).execute()

    emit_event(
        creator_id,
        "scraping_completed",
        f"Fetched {job['platform']} data.",
        {"job_id": job_id, "platform": job["platform"]},
    )


def fail_job(table: str, job: dict[str, Any], error: Exception | str) -> None:
    attempts = int(job.get("attempts") or 0)
    max_attempts = int(job.get("max_attempts") or 3)
    status = "failed" if attempts >= max_attempts else "pending"
    existing = job.get("error_log") or []
    if isinstance(existing, str):
        try:
            existing = json.loads(existing)
        except json.JSONDecodeError:
            existing = [existing]
    existing.append({"attempt": attempts, "error": str(error)})

    get_client().table(table).update(
        {
            "status": status,
            "locked_at": None,
            "locked_by": None,
            "error_log": existing,
        }
    ).eq("id", job["id"]).execute()

    emit_event(
        job["creator_id"],
        f"{table}_failed",
        f"{table} job failed: {error}",
        {"job_id": job["id"], "status": status},
    )
