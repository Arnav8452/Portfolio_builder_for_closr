import { env } from "../env.js";
import type { Json } from "@closr/database/types";

type ScrapeResult = {
  rawText: string;
  payload: Json;
};

export async function scrapeTwitterWithApify(url: string): Promise<ScrapeResult> {
  if (!env.apifyToken) {
    throw new Error("Missing Apify Token (APIFY_API_TOKEN). Cannot scrape Twitter/X.");
  }

  // Extract username from URL
  const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i);
  const username = match?.[1];
  
  if (!username) {
    throw new Error(`Could not extract Twitter username from ${url}`);
  }

  const endpoint = `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${env.apifyToken}`;
  const requestBody = {
    twitterHandles: [username],
    maxItems: 1,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

  // Find the author's profile from the first tweet that matches the username
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
      tweets: items.slice(0, 5),
    },
  };
}
