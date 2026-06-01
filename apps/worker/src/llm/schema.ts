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

const arrayField = (maxItems: number) =>
  z
    .array(z.string())
    .max(maxItems)
    .optional()
    .default([])
    .transform(dedupeArray);

export const creatorIdentityZodSchema = z.object({
  identity_match: z.boolean().describe("True if this data clearly belongs to the claimed creator name. False if it explicitly belongs to someone completely different (e.g., claiming to be Arnav but the profile is Linus Torvalds).").optional().default(true),
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
  technical_skills: arrayField(25),
  brand_tone: arrayField(15),
  content_format: arrayField(15),
  audience_size_tier: z.enum([
    "micro",
    "emerging",
    "mid_market",
    "large",
    "enterprise"
  ] as const).optional().default("micro"),
  past_topics: arrayField(25),
  bio_summary: z.string().optional().default("Pending summary."),
  confidence: z.number().min(0).max(1).optional().default(0),
  
  // Retro UI dynamic fields
  achievements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().optional().describe("Optional URL linking to the source of this achievement (e.g. repo URL, video URL).")
  })).optional().default([]),
  radar_scores: z.object({
    impact: z.number().min(0).max(100).optional().default(50),
    consistency: z.number().min(0).max(100).optional().default(50),
    quality: z.number().min(0).max(100).optional().default(50),
    depth: z.number().min(0).max(100).optional().default(50),
    breadth: z.number().min(0).max(100).optional().default(50),
    community: z.number().min(0).max(100).optional().default(50)
  }).optional(),
  timeline_events: z.array(z.object({
    date: z.string(),
    title: z.string(),
    description: z.string()
  })).optional().default([])
});

export type ParsedCreatorIdentity = z.infer<typeof creatorIdentityZodSchema>;

// The JSON schema to send to the models for generation
import { zodToJsonSchema } from "zod-to-json-schema";
export const creatorIdentityJsonSchema = zodToJsonSchema(creatorIdentityZodSchema as any, "CreatorIdentity");
