export function parseMetric(text: string): number | undefined {
  if (!text) return undefined;
  
  const normalized = text.toLowerCase().replace(/\s+/g, "");
  const match = normalized.match(/^([\d.,]+)([kmbt]?)/);
  if (!match) return undefined;
  
  let num = parseFloat(match[1].replace(/,/g, ""));
  if (isNaN(num)) return undefined;
  
  const multiplier = match[2];
  if (multiplier === "k") num *= 1000;
  else if (multiplier === "m") num *= 1000000;
  else if (multiplier === "b") num *= 1000000000;
  else if (multiplier === "t") num *= 1000000000000;
  
  return Math.floor(num);
}

export function extractMetricsFromText(text: string): Record<string, any> {
  const metrics: Record<string, any> = {};
  
  // Find "12.4K followers" or "1.2M subscribers"
  const followersMatch = text.match(/([\d.,]+[KkMmBbTt]?)\s*(followers|subscribers)/i);
  if (followersMatch) {
    metrics.followers = parseMetric(followersMatch[1]);
    metrics.raw_followers_text = followersMatch[0];
  }

  return metrics;
}
