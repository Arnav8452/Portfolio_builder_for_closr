import type { Database, Json } from "@closr/database/types";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { env } from "../env.js";
import { insertRow, rpc, updateRow, upsertRow } from "../supabase-rest.js";
import { parseRssFeed, scrapeRssSource } from "../scrapers/rss.js";
import { fetchOauthPlatform } from "../scrapers/oauth.js";
import { scrapeWithPlaywright } from "../scrapers/playwright.js";
import { scrapeTwitter } from "../scrapers/twitter.js";
import { scrapeLinkedinWithDork } from "../scrapers/linkedin-dork.js";
import { parseBioLinks } from "../osint/bio-parser.js";
import { cleanScrapedContent } from "../osint/cleaner.js";
import { extractMetricsFromText } from "../osint/metrics.js";

type ScrapingJob = Database["public"]["Tables"]["scraping_queue"]["Row"];

type ScrapeResult = {
  rawText: string;
  payload: Json;
};

export async function claimScrapingJobs() {
  return rpc<ScrapingJob[]>("claim_scraping_jobs", {
    p_worker_id: env.workerId,
    p_batch_size: env.scrapingBatchSize,
  });
}

export async function pollScrapingQueue() {
  const jobs = await claimScrapingJobs();

  for (const job of jobs) {
    await processScrapingJob(job);
  }

  return jobs.length;
}

async function processScrapingJob(job: ScrapingJob) {
  try {
    const result = await scrape(job);
    
    // Check for bio / domain verification challenges
    if (result.rawText && (result.rawText.includes("closr-8f2a") || result.rawText.includes("closr-verification=8f2a"))) {
      if (job.link_id) {
        await updateRow("creator_links", job.link_id, {
          verification_level: 2,
          verification_status: "challenge_verified",
        });
      }
    }

    const rawOutput = {
      payload: result.payload,
      bio_links: parseBioLinks(result.rawText),
    };

    await updateRow<ScrapingJob[]>("scraping_queue", job.id, {
      status: "completed",
      raw_output: rawOutput,
      completed_at: new Date().toISOString(),
    });

    const metrics = extractMetricsFromText(result.rawText);

    await upsertRow("platform_data", {
      creator_id: job.creator_id,
      link_id: job.link_id,
      platform: job.platform,
      identity_key: "default",
      raw_payload: result.payload,
      metrics: metrics,
      verified_via: "worker",
      fetched_at: new Date().toISOString()
    }, "creator_id,platform,identity_key");

    const cleanedText = cleanScrapedContent(result.rawText);

    if (cleanedText) {
      await insertRow("analysis_queue", {
        creator_id: job.creator_id,
        scraping_job_id: job.id,
        raw_text: cleanedText,
        payload: rawOutput,
      });
    }

    await updateRow("creators", job.creator_id, {
      onboarding_status: "scraped",
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    await updateRow<ScrapingJob[]>("scraping_queue", job.id, {
      status: job.attempts >= job.max_attempts ? "failed" : "pending",
      error_log: [...asArray(job.error_log), serializeError(error)],
    });
  }
}

async function scrape(job: ScrapingJob): Promise<ScrapeResult> {
  if (job.platform === "youtube" || job.platform === "github" || job.platform === "twitch" || job.platform === "instagram" || job.platform === "linkedin") {
    try {
      return await fetchOauthPlatform(job.platform, job.url, job.creator_id);
    } catch (err) {
      console.warn(`OAuth fetch failed for ${job.platform}, falling back to default scrapers:`, err);
    }
  }

  if (job.platform === "substack" || job.platform === "medium") {
    const xml = await scrapeRssSource(job.url);
    return {
      rawText: parseRssFeed(xml).join("\n\n"),
      payload: { source: "rss", xml_length: xml.length },
    };
  }

  if (job.platform === "twitter" || job.platform === "x") {
    return scrapeTwitter(job.url);
  }

  if (job.platform === "pinterest") {
    return scrapeWithPlaywright(job.platform, job.url);
  }

  if (job.platform === "linkedin") {
    // If LinkedIn dork fails, do NOT fall back to Jina/Readability, as Jina scraping LinkedIn 
    // produces a massive auth-wall markdown that exceeds the 6000 TPM Groq rate limit.
    return await scrapeLinkedinWithDork(job.url);
  }

  // For general websites, try Jina Reader first
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${job.url}`, {
      headers: { "X-Return-Format": "markdown" }
    });
    if (jinaRes.ok) {
      const markdown = await jinaRes.text();
      
      // Jina puts "Title: <title>\nURL Source: <url>\nMarkdown Content:\n" at the top.
      const titleMatch = markdown.match(/Title:\s*([^\n]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : job.url;
      
      // Strip out the metadata header
      let bodyText = markdown;
      const contentIndex = markdown.indexOf("Markdown Content:");
      if (contentIndex !== -1) {
        bodyText = markdown.slice(contentIndex + "Markdown Content:".length).trim();
      } else {
        // Fallback if "Markdown Content:" is missing
        bodyText = markdown.replace(/^Title:.*$/im, '').replace(/^URL Source:.*$/im, '').trim();
      }
      
      const cleanMarkdown = bodyText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      const paragraphs = cleanMarkdown.split('\n\n').filter(p => p.trim().length > 20 && !p.startsWith('#') && !p.startsWith('!')).map(p => p.trim());
      const description = paragraphs.length > 0 ? paragraphs[0].slice(0, 300) + (paragraphs[0].length > 300 ? "..." : "") : "Website content extracted.";

      return {
        rawText: markdown,
        payload: { 
          source: "jina", 
          status: jinaRes.status,
          profile: {
            title,
            description
          }
        }
      };
    }
  } catch (err) {
    console.warn(`Jina Reader failed for ${job.url}`, err);
  }

  // Readability Fallback
  const response = await fetch(job.url);
  const html = await response.text();
  
  try {
    const doc = new JSDOM(html, { url: job.url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    
    if (article && article.textContent) {
      return {
        rawText: article.textContent,
        payload: { 
          source: "readability", 
          status: response.status,
          profile: {
            title: article.title,
            description: "Website content extracted via Readability."
          }
        }
      };
    }
  } catch (err) {
    console.warn(`Readability fallback failed for ${job.url}`, err);
  }

  // Ultimate fallback: regex stripping
  return {
    rawText: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 20000),
    payload: { source: "website", status: response.status },
  };
}

function asArray(value: Json) {
  return Array.isArray(value) ? value : [];
}

function serializeError(error: unknown): Json {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}
