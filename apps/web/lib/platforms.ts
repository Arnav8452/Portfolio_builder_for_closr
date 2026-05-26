export const platforms = [
  "youtube",
  "github",
  "twitch",
  "substack",
  "medium",
  "twitter",
  "x",
  "pinterest",
  "website",
  "instagram",
  "other",
] as const;

export type CreatorPlatform = (typeof platforms)[number];

const hostMap: Record<string, CreatorPlatform> = {
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "github.com": "github",
  "twitch.tv": "twitch",
  "substack.com": "substack",
  "medium.com": "medium",
  "twitter.com": "twitter",
  "x.com": "x",
  "pinterest.com": "pinterest",
  "instagram.com": "instagram",
};

export function normalizeUrl(input: string) {
  const raw = input.trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "");
  return `https://${host}${path}`;
}

export function detectPlatform(input: string): CreatorPlatform {
  try {
    const normalized = normalizeUrl(input);
    const host = new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
    for (const [candidate, platform] of Object.entries(hostMap)) {
      if (host === candidate || host.endsWith(`.${candidate}`)) {
        return platform;
      }
    }
  } catch {
    return "other";
  }
  return "website";
}
