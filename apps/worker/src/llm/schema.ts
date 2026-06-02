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
  past_topics: arrayField(25),
  bio_summary: z.string().optional().default("Pending summary."),
  confidence: z.number().min(0).max(1).optional().default(0),
  
  // Retro UI dynamic fields
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    timeframe: z.string().describe("e.g., '2020 - 2023' or 'Jan 2023 - Present'"),
    description: z.string()
  })).optional().default([]).describe("Extract professional work history, roles, or major employment milestones from the provided telemetry, resumes, or platforms."),
  
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().optional()
  })).optional().default([]).describe("Extract specific side projects, major open source contributions, or content series."),
  
  radar_scores: z.object({
    impact: z.number().min(0).max(100).optional().default(50),
    consistency: z.number().min(0).max(100).optional().default(50),
    quality: z.number().min(0).max(100).optional().default(50),
    depth: z.number().min(0).max(100).optional().default(50),
    breadth: z.number().min(0).max(100).optional().default(50),
    community: z.number().min(0).max(100).optional().default(50)
  }).optional()
});

export type ParsedCreatorIdentity = z.infer<typeof creatorIdentityZodSchema>;

// The JSON schema to send to the models for generation
import { zodToJsonSchema } from "zod-to-json-schema";
export const creatorIdentityJsonSchema = zodToJsonSchema(creatorIdentityZodSchema as any, "CreatorIdentity");
