from __future__ import annotations

from typing import Any

import httpx
from bs4 import BeautifulSoup

from .config import get_settings
from .url_tools import extract_handle

USER_AGENT = "ClosrPortfolioWorker/0.1"


def fetch_github_profile(url: str) -> dict[str, Any]:
    settings = get_settings()
    handle = extract_handle(url)
    if not handle:
        raise ValueError("Could not extract GitHub handle.")

    headers = {"User-Agent": USER_AGENT}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    with httpx.Client(timeout=20, headers=headers) as client:
        user = client.get(f"https://api.github.com/users/{handle}")
        user.raise_for_status()
        repos = client.get(f"https://api.github.com/users/{handle}/repos", params={"sort": "updated", "per_page": 20})
        repos.raise_for_status()

    user_json = user.json()
    repos_json = repos.json()
    text_bits = [
        user_json.get("name") or "",
        user_json.get("bio") or "",
        " ".join(repo.get("name", "") for repo in repos_json[:10]),
        " ".join(str(repo.get("description") or "") for repo in repos_json[:10]),
    ]

    return {
        "handle": handle,
        "display_name": user_json.get("name") or handle,
        "metrics": {
            "followers": user_json.get("followers"),
            "public_repos": user_json.get("public_repos"),
        },
        "recent_items": [
            {
                "name": repo.get("name"),
                "description": repo.get("description"),
                "stars": repo.get("stargazers_count"),
                "language": repo.get("language"),
                "url": repo.get("html_url"),
            }
            for repo in repos_json[:10]
        ],
        "raw_text": "\n".join(bit for bit in text_bits if bit),
        "raw_payload": {"user": user_json, "repos": repos_json[:20]},
    }


def fetch_website_profile(url: str) -> dict[str, Any]:
    with httpx.Client(timeout=20, headers={"User-Agent": USER_AGENT}, follow_redirects=True) as client:
        response = client.get(url)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    description_tag = soup.find("meta", attrs={"name": "description"})
    description = description_tag.get("content", "").strip() if description_tag else ""
    links = [a.get("href") for a in soup.find_all("a", href=True)][:100]
    body_text = " ".join(soup.get_text(" ").split())[:6000]

    return {
        "handle": None,
        "display_name": title or url,
        "metrics": {},
        "recent_items": [],
        "cross_links": links,
        "raw_text": "\n".join(part for part in [title, description, body_text] if part),
        "raw_payload": {"title": title, "description": description, "links": links},
    }


def fetch_platform(job: dict[str, Any]) -> dict[str, Any]:
    platform = job["platform"]
    url = job["url"]
    if platform == "github":
        return fetch_github_profile(url)
    return fetch_website_profile(url)

