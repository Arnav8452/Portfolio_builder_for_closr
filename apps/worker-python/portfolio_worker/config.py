from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_service_role_key: str
    worker_id: str
    scraping_batch_size: int
    analysis_batch_size: int
    worker_poll_seconds: int
    ollama_base_url: str
    ollama_model: str
    github_token: str
    youtube_api_key: str
    twitch_client_id: str
    twitch_client_secret: str


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def get_settings() -> Settings:
    return Settings(
        supabase_url=os.getenv("SUPABASE_URL", ""),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        worker_id=os.getenv("WORKER_ID", "portfolio-worker-local"),
        scraping_batch_size=_int_env("SCRAPING_BATCH_SIZE", 5),
        analysis_batch_size=_int_env("ANALYSIS_BATCH_SIZE", 1),
        worker_poll_seconds=_int_env("WORKER_POLL_SECONDS", 5),
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        ollama_model=os.getenv("OLLAMA_MODEL", "qwen2.5:3b"),
        github_token=os.getenv("GITHUB_TOKEN", ""),
        youtube_api_key=os.getenv("YOUTUBE_API_KEY", ""),
        twitch_client_id=os.getenv("TWITCH_CLIENT_ID", ""),
        twitch_client_secret=os.getenv("TWITCH_CLIENT_SECRET", ""),
    )

