from __future__ import annotations

import re
from urllib.parse import urlparse, urlunparse

PLATFORM_HOSTS = {
    "youtube": ("youtube.com", "youtu.be"),
    "github": ("github.com",),
    "twitch": ("twitch.tv",),
    "substack": ("substack.com",),
    "medium": ("medium.com",),
    "twitter": ("twitter.com", "x.com"),
    "pinterest": ("pinterest.com",),
}


def normalize_url(raw_url: str) -> str:
    url = raw_url.strip()
    if not url:
        return ""
    if not re.match(r"^https?://", url, re.I):
        url = f"https://{url}"
    parsed = urlparse(url)
    netloc = parsed.netloc.lower().removeprefix("www.")
    path = re.sub(r"/+$", "", parsed.path)
    return urlunparse(("https", netloc, path, "", "", ""))


def detect_platform(raw_url: str) -> str:
    url = normalize_url(raw_url)
    host = urlparse(url).netloc.lower().removeprefix("www.")
    for platform, hosts in PLATFORM_HOSTS.items():
        if any(host == h or host.endswith(f".{h}") for h in hosts):
            if platform == "twitter" and host == "x.com":
                return "x"
            return platform
    return "website"


def extract_handle(raw_url: str) -> str | None:
    url = normalize_url(raw_url)
    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    if not parts:
        return None
    if parts[0] in {"channel", "c", "user"} and len(parts) > 1:
        return parts[1].lstrip("@")
    return parts[0].lstrip("@")

