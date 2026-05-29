import { env } from "../env.js";
import type { Json } from "@closr/database/types";
import { JSDOM } from "jsdom";

type ScrapeResult = {
  rawText: string;
  payload: Json;
};

// --- DuckDuckGo Dork (Free Bio + Followers) ---
async function scrapeTwitterDork(username: string): Promise<Partial<ScrapeResult> | null> {
  const dorkQuery = encodeURIComponent(`site:twitter.com/${username}`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${dorkQuery}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });

    if (!res.ok) return null;

    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // We look at the top 3 results to find the actual profile (not a tweet)
    const results = Array.from(document.querySelectorAll(".result__body")).slice(0, 3);
    
    for (const resultElement of results) {
      const titleElement = resultElement.querySelector(".result__title");
      const snippetElement = resultElement.querySelector(".result__snippet");

      const title = titleElement?.textContent?.trim() || "";
      const snippet = snippetElement?.textContent?.trim() || "";

      // Ensure this result is actually the user's profile and not a specific status/tweet
      if (title.toLowerCase().includes(`(@${username.toLowerCase()})`) || title.toLowerCase().includes(`on x`)) {
        
        // Clean up title to extract name (e.g. "Elon Musk (@elonmusk) / X" -> "Elon Musk")
        const name = title.split("(@")[0].trim();
        
        // Snippet usually contains "followers"
        let followers = "";
        const followersMatch = snippet.match(/([\d,.]+[KMB]?)\s*followers/i);
        if (followersMatch) {
          followers = followersMatch[1];
        }

        const rawText = [
          `Name: ${name}`,
          `Username: ${username}`,
          `Bio/Snippet: ${snippet}`,
          followers ? `Followers: ${followers}` : ""
        ].filter(Boolean).join("\n\n");

        return {
          rawText,
          payload: {
            profile: {
              name,
              userName: username,
              description: snippet,
              followers
            }
          }
        };
      }
    }
    
    return null;
  } catch (err) {
    console.warn(`[Twitter Dork] Failed for ${username}:`, err);
    return null;
  }
}

// --- Nitter RSS (Free Tweets) ---
async function scrapeWithNitter(username: string): Promise<Partial<ScrapeResult> | null> {
  const nitterInstances = [
    "https://nitter.net",
    "https://nitter.cz",
    "https://nitter.poast.org",
    "https://nitter.soopy.moe",
    "https://nitter.uni-sonia.com",
    "https://nitter.catsarch.com",
    "https://nitter.esmailelbob.xyz",
    "https://nitter.projectsegfau.lt"
  ];
  
  for (const instance of nitterInstances) {
    try {
      const feedUrl = `${instance}/${username}/rss`;
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      
      if (!res.ok) continue;
      
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      
      if (items.length === 0) continue;
      
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
        payload: { tweets }
      };
    } catch (err) {
      // try next instance
    }
  }
  
  return null;
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
    // 1. Try Free Hybrid (Dork + Nitter RSS)
    const [dorkRes, nitterRes] = await Promise.all([
      scrapeTwitterDork(username),
      scrapeWithNitter(username)
    ]);

    if (dorkRes || nitterRes) {
      const combinedRaw = [dorkRes?.rawText, nitterRes?.rawText].filter(Boolean).join("\n\n---\n\n");
      return {
        rawText: combinedRaw,
        payload: {
          source: "hybrid_free",
          profile: (dorkRes?.payload as any)?.profile || { userName: username },
          tweets: (nitterRes?.payload as any)?.tweets || []
        }
      };
    }

    throw new Error("Free scrapers returned null");
  } catch (err) {
    console.warn(`[Twitter Scraper] Hybrid free approach failed for ${username}, falling back to Apify:`, err);
    // 2. Fallback to Apify
    return await scrapeWithApify(username);
  }
}
