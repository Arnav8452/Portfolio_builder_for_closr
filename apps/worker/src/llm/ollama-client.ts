import type { AudienceSizeTier, CreatorPrimaryNiche, Json } from "@closr/database/types";
import { env } from "../env";
import { creatorIdentityPrompt, creatorIdentitySchema } from "./prompts";

export type CreatorIdentityOutput = {
  primary_niche: CreatorPrimaryNiche;
  technical_skills: string[];
  brand_tone: string[];
  content_format: string[];
  audience_size_tier: AudienceSizeTier;
  past_topics: string[];
  bio_summary: string;
  confidence: number;
  raw_model_output: Json;
};

type OllamaResponse = {
  response: string;
};

export async function extractCreatorIdentity(rawText: string, payload: Json): Promise<CreatorIdentityOutput> {
  const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.ollamaModel,
      prompt: creatorIdentityPrompt(rawText),
      stream: false,
      format: creatorIdentitySchema,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama generation failed: ${response.status}`);
  }

  const data = await response.json() as OllamaResponse;
  const parsed = JSON.parse(data.response) as Omit<CreatorIdentityOutput, "raw_model_output">;

  return {
    primary_niche: parsed.primary_niche ?? "other",
    technical_skills: parsed.technical_skills ?? [],
    brand_tone: parsed.brand_tone ?? [],
    content_format: parsed.content_format ?? [],
    audience_size_tier: parsed.audience_size_tier ?? "micro",
    past_topics: parsed.past_topics ?? [],
    bio_summary: parsed.bio_summary ?? "Pending summary.",
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0))),
    raw_model_output: { parsed: parsed as Json, source_payload: payload },
  };
}
