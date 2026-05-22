export function cleanScrapedContent(rawText: string): string {
  // 1. Normalize: basic HTML tag stripping if it's HTML
  let cleaned = rawText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " "); // Strip remaining HTML tags
    
  // 2. Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");

  // 3. Remove excessive whitespace, newlines, and tabs
  cleaned = cleaned.replace(/\s+/g, " ");

  // 4. Deduplicate sentences/lines roughly
  // We'll split by common delimiters and use a Set
  const segments = cleaned.split(/([.!?|]+)/);
  const seen = new Set<string>();
  const semanticBlocks: string[] = [];
  
  for (let i = 0; i < segments.length; i += 2) {
    const text = segments[i]?.trim();
    const delimiter = segments[i + 1] ?? "";
    
    if (text && text.length > 5) {
      const normalized = text.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        semanticBlocks.push(text + delimiter);
      }
    }
  }

  // 5. Compress / Truncate noise
  // We target 2 - 8 KB for semantic payload to save tokens.
  // 8000 characters is a good target.
  const compressed = semanticBlocks.join(" ");
  return compressed.slice(0, 8000).trim();
}
