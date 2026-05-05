export const creatorIdentitySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "primary_niche",
    "technical_skills",
    "brand_tone",
    "content_format",
    "audience_size_tier",
    "past_topics",
    "bio_summary",
    "confidence",
  ],
  properties: {
    primary_niche: {
      type: "string",
      enum: [
        "ai_ml",
        "devtools",
        "software_engineering",
        "gaming",
        "creator_economy",
        "business_marketing",
        "finance",
        "education",
        "fitness_wellness",
        "beauty",
        "fashion",
        "food",
        "travel",
        "music",
        "photography_video",
        "lifestyle",
        "other",
      ],
    },
    technical_skills: { type: "array", items: { type: "string" } },
    brand_tone: { type: "array", items: { type: "string" } },
    content_format: { type: "array", items: { type: "string" } },
    audience_size_tier: {
      type: "string",
      enum: ["micro", "emerging", "mid_market", "large", "enterprise"],
    },
    past_topics: { type: "array", items: { type: "string" } },
    bio_summary: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;

export function creatorIdentityPrompt(rawText: string) {
  return `Extract a verified creator identity dossier from the raw text.

Return only JSON that satisfies the provided schema. Keep arrays concise.

Raw text:
${rawText.slice(0, 12000)}`;
}
