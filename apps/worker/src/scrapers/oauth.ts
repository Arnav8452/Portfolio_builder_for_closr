import type { CreatorPlatform, Json } from "@closr/database/types";
import { env } from "../env";

type OauthScrapeResult = {
  rawText: string;
  payload: Json;
};

export async function fetchOauthPlatform(platform: CreatorPlatform, url: string): Promise<OauthScrapeResult> {
  if (platform === "github") {
    return fetchGithubProfile(url);
  }

  if (platform === "youtube") {
    return {
      rawText: "YouTube API collection is queued. Configure OAuth token storage before production fetching.",
      payload: { source: "youtube_api", configured: Boolean(env.youtubeApiKey) },
    };
  }

  if (platform === "twitch") {
    return {
      rawText: "Twitch API collection is queued. Configure app token exchange before production fetching.",
      payload: { source: "twitch_api", configured: Boolean(env.twitchClientId && env.twitchClientSecret) },
    };
  }

  return {
    rawText: "",
    payload: { source: "oauth", unsupported_platform: platform },
  };
}

async function fetchGithubProfile(url: string): Promise<OauthScrapeResult> {
  const username = new URL(url).pathname.split("/").filter(Boolean)[0];
  if (!username) {
    throw new Error(`Cannot derive GitHub username from ${url}`);
  }

  const headers = env.githubToken ? { Authorization: `Bearer ${env.githubToken}` } : undefined;
  const [profileResponse, reposResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?per_page=20&sort=updated`, { headers }),
  ]);

  if (!profileResponse.ok) {
    throw new Error(`GitHub profile fetch failed for ${username}: ${profileResponse.status}`);
  }

  const profile = await profileResponse.json() as Record<string, Json>;
  const repos = reposResponse.ok ? await reposResponse.json() as Array<Record<string, Json>> : [];
  const repoText = repos
    .map((repo) => `${repo.name ?? "repo"}: ${repo.description ?? ""}`)
    .join("\n");

  return {
    rawText: [profile.bio, profile.company, repoText].filter(Boolean).join("\n\n"),
    payload: {
      source: "github_api",
      profile,
      repos: repos.slice(0, 10),
    },
  };
}
