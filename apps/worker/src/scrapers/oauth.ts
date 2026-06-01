import type { CreatorPlatform, Json } from "@closr/database/types";
import { env } from "../env.js";
import { getRow, updateRow } from "../supabase-rest.js";
import { decryptToken } from "../lib/encryption.js";

type OauthScrapeResult = {
  rawText: string;
  payload: Json;
};

export async function fetchOauthPlatform(platform: CreatorPlatform, url: string, creatorId?: string): Promise<OauthScrapeResult> {
  if (platform === "github") {
    return fetchGithubProfile(url, creatorId);
  }

  if (platform === "youtube") {
    if (!creatorId) throw new Error("creatorId required for YouTube Analytics.");
    return fetchYouTubeAnalytics(url, creatorId);
  }

  if (platform === "twitch") {
    if (!creatorId) throw new Error("creatorId required for Twitch API.");
    return fetchTwitchProfile(url, creatorId);
  }

  if (platform === "instagram") {
    if (!creatorId) throw new Error("creatorId required for Instagram Analytics.");
    return fetchInstagramStats(url, creatorId);
  }

  if (platform === "linkedin") {
    if (!creatorId) throw new Error("creatorId required for LinkedIn API.");
    return fetchLinkedinProfile(url, creatorId);
  }

  return {
    rawText: "",
    payload: { source: "oauth", unsupported_platform: platform },
  };
}

async function fetchGithubProfile(url: string, creatorId?: string): Promise<OauthScrapeResult> {
  const username = new URL(url).pathname.split("/").filter(Boolean)[0];
  if (!username) {
    throw new Error(`Cannot derive GitHub username from ${url}`);
  }

  let dbToken: string | undefined;
  if (creatorId) {
    const creators = await getRow<any>("creators", `id=eq.${creatorId}&select=owner_user_id`);
    if (creators && creators.length > 0) {
      const accounts = await getRow<any>("accounts", `%22userId%22=eq.${creators[0].owner_user_id}&provider=eq.github`, "next_auth");
      if (accounts && accounts.length > 0) {
        dbToken = accounts[0].access_token;
      }
    }
  }

  let token = dbToken || env.githubToken;
  let headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  let [profileResponse, reposResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?per_page=20&sort=updated`, { headers }),
  ]);

  if (!profileResponse.ok && (profileResponse.status === 401 || profileResponse.status === 403)) {
    // 1) Fallback to the app-level env token if dbToken failed
    if (token === dbToken && env.githubToken) {
      console.warn(`[GitHub Scraper] User token 401/403 for ${username}, falling back to env token`);
      token = env.githubToken;
      headers = { Authorization: `Bearer ${token}` };
      [profileResponse, reposResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`, { headers }),
        fetch(`https://api.github.com/users/${username}/repos?per_page=20&sort=updated`, { headers }),
      ]);
    }
    
    // 2) If it STILL fails with 401/403 (or there was no dbToken to begin with), fallback to unauthenticated
    if (!profileResponse.ok && (profileResponse.status === 401 || profileResponse.status === 403) && headers !== undefined) {
      console.warn(`[GitHub Scraper] Token 401/403 for ${username}, falling back to unauthenticated fetch`);
      headers = undefined;
      [profileResponse, reposResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`, { headers }),
        fetch(`https://api.github.com/users/${username}/repos?per_page=20&sort=updated`, { headers }),
      ]);
    }
  }

  if (!profileResponse.ok) {
    throw new Error(`GitHub profile fetch failed for ${username}: ${profileResponse.status}`);
  }

  const profile = await profileResponse.json() as Record<string, Json>;
  const repos = reposResponse.ok ? await reposResponse.json() as Array<Record<string, Json>> : [];
  
  // RateMyGithub GraphQL Query
  const query = `
    query($login: String!) {
      user(login: $login) {
        createdAt
        contributionsCollection {
          contributionCalendar { totalContributions }
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
        }
        repository(name: $login) {
          object(expression: "HEAD:README.md") {
            ... on Blob {
              text
            }
          }
        }
        repositories(first: 30, isFork: false, ownerAffiliations: [OWNER], orderBy: { field: STARGAZERS, direction: DESC }) {
          nodes {
            name
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name } }
            }
          }
        }
      }
    }
  `;
  
  const gqlRes = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...(headers || {}), "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  
  let contributions = null;
  let languagesText = "";
  let profileReadme = "";
  if (gqlRes.ok) {
    const body = await gqlRes.json() as any;
    if (body.data?.user) {
      contributions = body.data.user;
      
      if (contributions.repository?.object?.text) {
        profileReadme = contributions.repository.object.text;
      }
      
      const byLang = new Map<string, number>();
      for (const r of contributions?.repositories?.nodes || []) {
        for (const e of r?.languages?.edges || []) {
          byLang.set(e.node.name, (byLang.get(e.node.name) ?? 0) + e.size);
        }
      }
      languagesText = Array.from(byLang.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([lang, bytes]) => `${lang}: ${bytes} bytes`)
        .join(", ");
    }
  }

  const repoText = repos
    .map((repo) => `${repo.name ?? "repo"}: ${repo.description ?? ""}`)
    .join("\n");

  const rawText = [
    `Name: ${profile.name || profile.login}`,
    `Bio: ${profile.bio || ""}`,
    `Company: ${profile.company || ""}`,
    `Followers: ${profile.followers}`,
    `Total Commits: ${contributions?.contributionsCollection?.totalCommitContributions || 0}`,
    `Top Languages: ${languagesText}`,
    `Recent Repositories:\n${repoText}`,
    profileReadme ? `Profile README:\n${profileReadme}` : "NO README EXISTS. YOU MUST RELY ON THE NUMBERS ABOVE TO GENERATE ACHIEVEMENTS (e.g. Followers, Repos, Commits).",
  ].filter(Boolean).join("\n\n");

  return {
    rawText,
    payload: {
      source: "github_api",
      profile,
      repos: repos.slice(0, 10),
      contributions,
      readme: profileReadme,
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

  const accounts = await getRow<any>("accounts", `%22userId%22=eq.${userId}&provider=eq.youtube`, "next_auth");
  if (!accounts || accounts.length === 0) return null;
  const tokenRecord = accounts[0];

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (tokenRecord.expires_at && tokenRecord.expires_at < nowSeconds + 300) {
    if (!tokenRecord.refresh_token) return null;
    
    const params = new URLSearchParams({
      client_id: env.googleId ?? "",
      client_secret: env.googleSecret ?? "",
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
  
  const [demoRes, geoRes, watchRes, trafficRes, channelRes] = await Promise.all([
    fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${paramsCommon}&metrics=viewerPercentage&dimensions=ageGroup,gender&sort=-viewerPercentage`, { headers }),
    fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${paramsCommon}&metrics=views&dimensions=country&sort=-views&maxResults=3`, { headers }),
    fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${paramsCommon}&metrics=views,estimatedMinutesWatched,averageViewDuration`, { headers }),
    fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${paramsCommon}&metrics=views&dimensions=insightTrafficSourceType&sort=-views&maxResults=10`, { headers }),
    fetch(`https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`, { headers })
  ]);

  const [demo, geo, watch, traffic, channel] = await Promise.all([
    demoRes.ok ? demoRes.json() : Promise.resolve(null),
    geoRes.ok ? geoRes.json() : Promise.resolve(null),
    watchRes.ok ? watchRes.json() : Promise.resolve(null),
    trafficRes.ok ? trafficRes.json() : Promise.resolve(null),
    channelRes.ok ? channelRes.json() : Promise.resolve(null),
  ]);

  const channelData = (channel as any)?.items?.[0] || {};
  const snippet = channelData.snippet || {};
  const stats = channelData.statistics || {};

  const rawText = [
    `YouTube Channel: ${snippet.title || url}`,
    snippet.description ? `Bio: ${snippet.description}` : '',
    stats.subscriberCount ? `Subscribers: ${stats.subscriberCount}` : '',
    stats.videoCount ? `Videos: ${stats.videoCount}` : '',
    stats.viewCount ? `Total Channel Views: ${stats.viewCount}` : '',
    (demo as any)?.rows?.length ? `Demographics: ${JSON.stringify((demo as any).rows)}` : '',
    (geo as any)?.rows?.length ? `Top Countries: ${JSON.stringify((geo as any).rows)}` : '',
    (watch as any)?.rows?.length ? `Engagement: total views=${(watch as any).rows[0]?.[0]}, minutes watched=${(watch as any).rows[0]?.[1]}, avg duration=${(watch as any).rows[0]?.[2]}` : '',
    (traffic as any)?.rows?.length ? `Traffic Sources: ${JSON.stringify((traffic as any).rows)}` : '',
  ].filter(Boolean).join('\n\n');

  return {
    rawText,
    payload: {
      source: "youtube_analytics_api",
      profile: channelData,
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
  const token = decryptToken(tokens[0].access_token);

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

async function fetchTwitchProfile(url: string, creatorId: string): Promise<OauthScrapeResult> {
  const creators = await getRow<any>("creators", `id=eq.${creatorId}&select=owner_user_id`);
  if (!creators || creators.length === 0) throw new Error("Creator not found");
  const userId = creators[0].owner_user_id;

  const accounts = await getRow<any>("accounts", `%22userId%22=eq.${userId}&provider=eq.twitch`, "next_auth");
  if (!accounts || accounts.length === 0) {
    throw new Error("Missing Twitch OAuth token. Creator must connect Twitch.");
  }
  const token = accounts[0].access_token;
  const providerAccountId = accounts[0].providerAccountId;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Client-Id": env.twitchClientId || "",
  };

  const userRes = await fetch(`https://api.twitch.tv/helix/users?id=${providerAccountId}`, { headers });
  if (!userRes.ok) {
    throw new Error(`Failed to fetch Twitch user: ${await userRes.text()}`);
  }
  const userData = await userRes.json() as any;
  const user = userData.data?.[0];
  if (!user) {
    throw new Error("Twitch user not found in API response.");
  }

  const channelRes = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${providerAccountId}`, { headers });
  const channelData = channelRes.ok ? await channelRes.json() as any : null;
  const channel = channelData?.data?.[0];

  const rawText = [
    user.display_name ? `Display Name: ${user.display_name}` : "",
    user.description ? `Bio: ${user.description}` : "",
    user.view_count !== undefined ? `Total Views: ${user.view_count}` : "",
    channel?.game_name ? `Game: ${channel.game_name}` : "",
    channel?.title ? `Title: ${channel.title}` : "",
  ].filter(Boolean).join("\n\n");

  return {
    rawText,
    payload: {
      source: "twitch_api",
      profile: user,
      channel: channel || null,
    }
  };
}

async function fetchLinkedinProfile(url: string, creatorId: string): Promise<OauthScrapeResult> {
  const creators = await getRow<any>("creators", `id=eq.${creatorId}&select=owner_user_id`);
  if (!creators || creators.length === 0) throw new Error("Creator not found");
  const userId = creators[0].owner_user_id;

  const accounts = await getRow<any>("accounts", `%22userId%22=eq.${userId}&provider=eq.linkedin`, "next_auth");
  if (!accounts || accounts.length === 0) {
    throw new Error("Missing LinkedIn OAuth token. Creator must connect LinkedIn.");
  }
  const token = accounts[0].access_token;

  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`LinkedIn API failed: ${response.status} ${await response.text()}`);
  }

  const profile = await response.json() as any;

  const rawText = [
    profile.name ? `Name: ${profile.name}` : "",
    profile.email ? `Email: ${profile.email}` : "",
    profile.locale?.country ? `Locale: ${profile.locale.country}` : "",
  ].filter(Boolean).join("\n\n");

  return {
    rawText,
    payload: { source: "linkedin_oauth", profile },
  };
}
