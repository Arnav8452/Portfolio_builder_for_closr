import type { CreatorPlatform } from "@closr/database/types";

export async function scrapeWithPlaywright(platform: CreatorPlatform, url: string) {
  return {
    rawText: `[SYSTEM] ${platform} data extraction is not supported in the current worker environment.`,
    payload: {
      source: "unsupported",
      platform,
      url,
      status: "not_supported",
      message: "Scraping for this platform is intentionally stubbed/excluded.",
    },
  };
}
