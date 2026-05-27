import { z } from "zod";
import type { CreatorPrimaryNiche, AudienceSizeTier } from "@closr/database/types";

// Helper for deduplication
const dedupeArray = (arr: string[]) => {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const normalized = item.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const arrayField = (maxString: number, maxItems: number) =>
  z
    .array(z.string().max(maxString))
    .max(maxItems)
    .optional()
    .default([])
    .transform(dedupeArray);

export const creatorIdentityZodSchema = z.object({
  primary_niche: z.enum([
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
  ] as const).optional().default("other"),
  technical_skills: arrayField(64, 25),
  brand_tone: arrayField(64, 15),
  content_format: arrayField(64, 15),
  audience_size_tier: z.enum([
    "micro",
    "emerging",
    "mid_market",
    "large",
    "enterprise"
  ] as const).optional().default("micro"),
  past_topics: arrayField(64, 25),
  bio_summary: z.string().max(1000).optional().default("Pending summary."),
  confidence: z.number().min(0).max(1).optional().default(0),
});

export type ParsedCreatorIdentity = z.infer<typeof creatorIdentityZodSchema>;

// The JSON schema to send to the models for generation
import { zodToJsonSchema } from "zod-to-json-schema";
export const creatorIdentityJsonSchema = zodToJsonSchema(creatorIdentityZodSchema as any, "CreatorIdentity");
