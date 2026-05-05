export async function scrapeRssSource(url: string) {
  const rssUrl = resolveRssUrl(url);
  const response = await fetch(rssUrl);

  if (!response.ok) {
    throw new Error(`RSS fetch failed for ${rssUrl}: ${response.status}`);
  }

  return response.text();
}

export function parseRssFeed(xml: string) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].slice(0, 20);
  return items.map((match) => {
    const item = match[0];
    return [
      readTag(item, "title"),
      readTag(item, "description"),
      readTag(item, "content:encoded"),
    ].filter(Boolean).join("\n");
  });
}

function resolveRssUrl(url: string) {
  const parsed = new URL(url);

  if (parsed.hostname.includes("substack.com")) {
    return `${parsed.origin}/feed`;
  }

  if (parsed.hostname.includes("medium.com")) {
    return `${parsed.origin}/feed${parsed.pathname === "/" ? "" : parsed.pathname}`;
  }

  return url;
}

function readTag(xml: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return match?.[1]
    ?.replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
