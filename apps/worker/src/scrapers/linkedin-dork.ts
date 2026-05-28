import { JSDOM } from "jsdom";
import type { Json } from "@closr/database/types";

type ScrapeResult = {
  rawText: string;
  payload: Json;
};

export async function scrapeLinkedinWithDork(url: string): Promise<ScrapeResult> {
  const match = url.match(/linkedin\.com\/in\/([^/]+)/i);
  const username = match?.[1];

  if (!username) {
    throw new Error(`Could not extract LinkedIn username from ${url}`);
  }

  // Use DuckDuckGo HTML search for a lightweight zero-API-key dork
  const dorkQuery = encodeURIComponent(`site:linkedin.com/in/${username}`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${dorkQuery}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });

    if (!res.ok) {
      throw new Error(`DuckDuckGo request failed: ${res.status}`);
    }

    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Find the first result
    const resultElement = document.querySelector(".result__body");
    
    if (!resultElement) {
      throw new Error(`No search results found for LinkedIn profile ${username}`);
    }

    const titleElement = resultElement.querySelector(".result__title");
    const snippetElement = resultElement.querySelector(".result__snippet");

    const title = titleElement?.textContent?.trim() || "";
    const snippet = snippetElement?.textContent?.trim() || "";

    // Clean up the title (usually format is "Name - Job Title - Company | LinkedIn")
    const cleanTitle = title.replace(/\s*[-|]\s*LinkedIn.*$/i, "");
    
    // Sometimes the title is just the name, and snippet has the job.
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
  } catch (err) {
    console.warn(`[LinkedIn Dork] Failed for ${username}:`, err);
    throw err;
  }
}
