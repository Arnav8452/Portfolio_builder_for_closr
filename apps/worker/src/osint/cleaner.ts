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

  // 4. Split into chunks by basic delimiters (paragraphs or strong punctuation)
  const segments = cleaned.split(/([.!?|]+)/);
  const seen = new Set<string>();
  
  const chunks: string[] = [];
  let currentChunk = "";
  const CHUNK_MAX_LENGTH = 6000; // Roughly 1500 tokens
  
  for (let i = 0; i < segments.length; i += 2) {
    const text = segments[i]?.trim();
    const delimiter = segments[i + 1] ?? "";
    
    if (text && text.length > 5) {
      const normalized = text.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        const block = text + delimiter + " ";
        
        if (currentChunk.length + block.length > CHUNK_MAX_LENGTH && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }
        currentChunk += block;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Return JSON string of chunks so the database can store it in the text column
  return JSON.stringify(chunks);
}
