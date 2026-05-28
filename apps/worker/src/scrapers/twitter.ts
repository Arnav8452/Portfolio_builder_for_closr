import { env } from "../env.js";
import type { Json } from "@closr/database/types";

type ScrapeResult = {
  rawText: string;
  payload: Json;
};

// --- Nitter (Free) ---
async function scrapeWithNitter(username: string): Promise<ScrapeResult> {
  const nitterInstances = [
    "https://nitter.net",
    "https://nitter.cz",
    "https://nitter.privacydev.net"
  ];
  
  let lastErr;
  for (const instance of nitterInstances) {
    try {
      const feedUrl = `${instance}/${username}/rss`;
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      
      if (!res.ok) {
        throw new Error(`Nitter instance ${instance} failed with ${res.status}`);
      }
      
      const xml = await res.text();
      // Basic regex parsing for RSS since we don't want to add heavy XML parsers
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      
      if (items.length === 0) {
        throw new Error(`No tweets found for ${username} on ${instance}`);
      }
      
      const tweets = items.map(match => {
        const itemXml = match[1];
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        return {
          text: titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : "",
          createdAt: dateMatch ? dateMatch[1] : ""
        };
      }).slice(0, 15);
      
      const rawText = tweets.map(t => `Tweet: ${t.text}`).join("\n\n");
      
      return {
        rawText,
        payload: {
          source: "nitter_rss",
          profile: { userName: username },
          tweets
        }
      };
    } catch (err) {
      lastErr = err;
      console.warn(`[Nitter Fallback] ${err}`);
      // try next instance
    }
  }
  
  throw lastErr || new Error("All Nitter instances failed");
}

// --- Apify (Paid Fallback) ---
async function scrapeWithApify(username: string): Promise<ScrapeResult> {
  if (!env.apifyToken) {
    throw new Error("Missing Apify Token (APIFY_API_TOKEN). Cannot fallback to Apify.");
  }

  const endpoint = `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${env.apifyToken}`;
  const requestBody = {
    twitterHandles: [username],
    maxItems: 50,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Apify request failed with status: ${response.status} ${await response.text()}`);
  }

  const items = await response.json() as any[];
  
  if (!items || items.length === 0) {
    return {
      rawText: `No tweets found for ${username}`,
      payload: { source: "apify_twitter", status: "empty" },
    };
  }

  const authorTweet = items.find((tweet: any) => 
    tweet?.author?.userName?.toLowerCase() === username.toLowerCase()
  ) || items[0];

  const profile = authorTweet?.author || {};

  const rawText = [
    profile.name ? `Name: ${profile.name}` : "",
    profile.userName ? `Username: ${profile.userName}` : "",
    profile.description ? `Bio: ${profile.description}` : "",
    profile.followers ? `Followers: ${profile.followers}` : "",
    ...items.map((t: any) => `Tweet: ${t.text || ""}`)
  ].filter(Boolean).join("\n\n");

  return {
    rawText,
    payload: {
      source: "apify_twitter",
      profile,
      tweets: items.slice(0, 20),
    },
  };
}

export async function scrapeTwitter(url: string): Promise<ScrapeResult> {
  const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i);
  const username = match?.[1];
  
  if (!username) {
    throw new Error(`Could not extract Twitter username from ${url}`);
  }

  try {
    // 1. Try free Nitter first
    return await scrapeWithNitter(username);
  } catch (err) {
    console.warn(`[Twitter Scraper] Nitter failed for ${username}, falling back to Apify:`, err);
    // 2. Fallback to Apify
    return await scrapeWithApify(username);
  }
}
