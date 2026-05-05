export function parseBioLinks(text: string) {
  const matches = text.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
  return [...new Set(matches.map(canonicalizeUrl))].filter(Boolean);
}

export function hasCrossLink(text: string, rootUrl: string) {
  const root = canonicalizeUrl(rootUrl);
  return parseBioLinks(text).some((link) => link === root);
}

export function canonicalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}
