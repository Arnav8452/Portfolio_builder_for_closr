import type { CreatorPlatform } from "@closr/database/types";

export async function scrapeWithPlaywright(platform: CreatorPlatform, url: string) {
  if (url.includes("instagram.com")) {
    throw new Error("Instagram scraping is intentionally excluded from the Closr worker.");
  }

  return {
    rawText: `${platform} page queued for Playwright scraping: ${url}`,
    payload: {
      source: "playwright",
      platform,
      url,
      status: "stubbed",
      next_step: "Install Playwright in the worker image and add platform-specific extraction.",
    },
  };
}
