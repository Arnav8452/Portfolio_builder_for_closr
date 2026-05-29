import { JSDOM } from "jsdom";
import type { Json } from "@closr/database/types";
import { env } from "../env.js";

type ScrapeResult = {
  rawText: string;
  payload: Json;
};

async function scrapeLinkedinSerperAPI(username: string): Promise<ScrapeResult | null> {
  if (!env.serperApiKey) return null;

  const query = `site:linkedin.com/in/${username}`;

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": env.serperApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, num: 1 })
    });

    if (!res.ok) return null;

    const data = await res.json() as any;
    if (!data.organic || data.organic.length === 0) return null;

    const firstItem = data.organic[0];
    const title = firstItem.title || "";
    const snippet = firstItem.snippet || "";

    const cleanTitle = title.replace(/\s*[-|]\s*LinkedIn.*$/i, "");
    
    const rawText = [
      `LinkedIn Profile: ${cleanTitle}`,
      `Bio/Headline: ${snippet}`
    ].filter(Boolean).join("\n\n");

    return {
      rawText,
      payload: {
        source: "serper_api",
        profile: {
          name: cleanTitle,
          headline: snippet,
          username
        }
      }
    };
  } catch (err) {
    console.warn(`[LinkedIn Serper API] Failed for ${username}:`, err);
    return null;
  }
}

export async function scrapeLinkedinWithDork(url: string): Promise<ScrapeResult> {
  const match = url.match(/linkedin\.com\/in\/([^/]+)/i);
  const username = match?.[1];

  if (!username) {
    throw new Error(`Could not extract LinkedIn username from ${url}`);
  }

  // 1. Try DuckDuckGo
  const dorkQuery = encodeURIComponent(`site:linkedin.com/in/${username}`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${dorkQuery}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });

    if (res.ok) {
      const html = await res.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const resultElement = document.querySelector(".result__body");
      
      if (resultElement) {
        const titleElement = resultElement.querySelector(".result__title");
        const snippetElement = resultElement.querySelector(".result__snippet");

        const title = titleElement?.textContent?.trim() || "";
        const snippet = snippetElement?.textContent?.trim() || "";

        const cleanTitle = title.replace(/\s*[-|]\s*LinkedIn.*$/i, "");
        
        const rawText = [
          `LinkedIn Profile: ${cleanTitle}`,
          `Bio/Headline: ${snippet}`
        ].filter(Boolean).join("\n\n");

        return {
          rawText,
          payload: {
            source: "duckduckgo_dork",
            profile: {
              name: cleanTitle,
              headline: snippet,
              username
            }
          }
        };
      }
    }
  } catch (err) {
    console.warn(`[LinkedIn DuckDuckGo] Failed for ${username}:`, err);
  }

  // 2. Try Serper API Fallback
  const serperRes = await scrapeLinkedinSerperAPI(username);
  if (serperRes) {
    return serperRes;
  }

  throw new Error(`All dork search methods failed for LinkedIn profile ${username}`);
}
