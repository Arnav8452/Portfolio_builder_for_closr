import type { CreatorPlatform, Json } from "@closr/database/types";
import { env } from "../env.js";
import { getRow, updateRow } from "../supabase-rest.js";

type OauthScrapeResult = {
  rawText: string;
  payload: Json;
};

export async function fetchOauthPlatform(platform: CreatorPlatform, url: string, creatorId?: string): Promise<OauthScrapeResult> {
  if (platform === "github") {
    return fetchGithubProfile(url);
  }

  if (platform === "youtube") {
    if (!creatorId) throw new Error("creatorId required for YouTube Analytics.");
    return fetchYouTubeAnalytics(url, creatorId);
  }

  if (platform === "twitch") {
    return {
      rawText: "[SYSTEM] Twitch API collection is not supported in the current worker environment.",
      payload: { source: "unsupported", status: "not_supported", platform },
    };
  }

  if (platform === "instagram") {
    if (!creatorId) throw new Error("creatorId required for Instagram Analytics.");
    return fetchInstagramStats(url, creatorId);
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

type OauthToken = {
  id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
};

async function getValidYouTubeToken(creatorId: string): Promise<string | null> {
  const creators = await getRow<any>("creators", `id=eq.${creatorId}&select=owner_user_id`);
  if (!creators || creators.length === 0) return null;
  const userId = creators[0].owner_user_id;

  const accounts = await getRow<any>("accounts", `userId=eq.${userId}&provider=eq.youtube`);
  if (!accounts || accounts.length === 0) return null;
  const tokenRecord = accounts[0];

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (tokenRecord.expires_at && tokenRecord.expires_at < nowSeconds + 300) {
    if (!tokenRecord.refresh_token) return null;
    
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_ID ?? "",
      client_secret: process.env.GOOGLE_SECRET ?? "",
      refresh_token: tokenRecord.refresh_token,
      grant_type: "refresh_token",
    });
    
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    
    if (!res.ok) return null;
    
    const data = await res.json() as { access_token: string, expires_in: number };
    const newAccessToken = data.access_token;
    const newExpiresAt = nowSeconds + data.expires_in;
    
    await updateRow("accounts", tokenRecord.id, {
      access_token: newAccessToken,
      expires_at: newExpiresAt,
    });
    
    return newAccessToken;
  }
  
  return tokenRecord.access_token;
}

async function fetchYouTubeAnalytics(url: string, creatorId: string): Promise<OauthScrapeResult> {
  const token = await getValidYouTubeToken(creatorId);
  if (!token) {
    throw new Error("Missing or expired YouTube OAuth token. Creator must re-authenticate.");
  }

  const headers = { Authorization: `Bearer ${token}` };
  const today = new Date().toISOString().split("T")[0];
  const paramsCommon = `ids=channel==MINE&startDate=2010-01-01&endDate=${today}`;
  
  const [demoRes, geoRes, watchRes, trafficRes] = await Promise.all([
    fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${paramsCommon}&metrics=viewerPercentage&dimensions=ageGroup,gender&sort=-viewerPercentage`, { headers }),
    fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${paramsCommon}&metrics=views&dimensions=country&sort=-views&maxResults=3`, { headers }),
    fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${paramsCommon}&metrics=views,estimatedMinutesWatched,averageViewDuration`, { headers }),
    fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${paramsCommon}&metrics=views&dimensions=insightTrafficSourceType&sort=-views&maxResults=10`, { headers })
  ]);

  const [demo, geo, watch, traffic] = await Promise.all([
    demoRes.ok ? demoRes.json() : Promise.resolve(null),
    geoRes.ok ? geoRes.json() : Promise.resolve(null),
    watchRes.ok ? watchRes.json() : Promise.resolve(null),
    trafficRes.ok ? trafficRes.json() : Promise.resolve(null),
  ]);

  return {
    rawText: `YouTube Analytics Data Extracted for ${url}`,
    payload: {
      source: "youtube_analytics_api",
      demographics: (demo as any)?.rows ?? [],
      geography: (geo as any)?.rows ?? [],
      engagement: (watch as any)?.rows ?? [],
      traffic_sources: (traffic as any)?.rows ?? []
    }
  };
}

async function fetchInstagramStats(url: string, creatorId: string): Promise<OauthScrapeResult> {
  // 1. Get the Meta token from external_api_tokens
  const tokens = await getRow<any>("external_api_tokens", `creator_id=eq.${creatorId}&provider=eq.meta`);
  if (!tokens || tokens.length === 0) {
    throw new Error("Missing Meta OAuth token. Creator must re-authenticate Instagram.");
  }
  const token = tokens[0].access_token;

  // 2. Resolve the connected Instagram Business/Creator Account ID
  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${token}`);
  if (!pagesRes.ok) {
    const err = await pagesRes.text();
    throw new Error(`Failed to fetch Meta Pages: ${err}`);
  }
  
  const pagesData = await pagesRes.json() as { data: Array<{ instagram_business_account?: { id: string } }> };
  const igAccountId = pagesData.data?.find((p) => p.instagram_business_account?.id)?.instagram_business_account?.id;
  
  if (!igAccountId) {
    throw new Error("No connected Instagram Professional account found for this Meta user.");
  }

  // 3. Fetch the Instagram Analytics
  const igRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}?fields=username,name,biography,followers_count,media_count,website&access_token=${token}`);
  if (!igRes.ok) {
    const err = await igRes.text();
    throw new Error(`Failed to fetch Instagram stats: ${err}`);
  }

  const igData = await igRes.json() as Record<string, any>;
  
  const rawText = [
    igData.name ? `Name: ${igData.name}` : "",
    igData.username ? `Username: ${igData.username}` : "",
    igData.biography ? `Bio: ${igData.biography}` : "",
    igData.followers_count !== undefined ? `Followers: ${igData.followers_count}` : "",
    igData.media_count !== undefined ? `Posts: ${igData.media_count}` : "",
  ].filter(Boolean).join("\n\n");

  return {
    rawText,
    payload: {
      source: "instagram_graph_api",
      profile: igData,
    }
  };
}
