import { env } from "../env.js";
import type { LLMResponse } from "./types.js";
import { creatorIdentityZodSchema, creatorIdentityJsonSchema } from "./schema.js";
import { createHash } from 'crypto';

export async function extractCreatorIdentity(rawText: string): Promise<LLMResponse> {
  const schemaString = JSON.stringify(creatorIdentityJsonSchema);
  return executeWithRepair(rawText, schemaString);
}

export async function executeWithRepair(
  rawText: string,
  schemaString: string,
  attempt = 1
): Promise<LLMResponse> {
  const GATEWAY_URL = env.aiGatewayUrl;
  const GATEWAY_SECRET = env.aiGatewaySecret;

  const startTime = Date.now();
  const systemPrompt = `You are an expert OSINT data analyst evaluating a creator's verified social telemetry. Extract a comprehensive, highly-detailed creator identity following this JSON schema exactly: ${schemaString}. Do not lose data. Deep dive into the text, extract specific numbers, and synthesize a rich bio_summary that highlights their most impressive metrics and achievements. CRITICAL: bio_summary MUST be a single plain string, NOT an object or array.`;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GATEWAY_SECRET}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Virtualized by Freeloader
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI Gateway error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const duration_ms = Date.now() - startTime;
  
  let jsonString = data.choices[0]?.message?.content || "{}";
  
  // Robustly extract JSON object from conversational text or markdown blocks
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    jsonString = jsonString.slice(firstBrace, lastBrace + 1);
  }

  try {
    const rawParsed = JSON.parse(jsonString);
    
    // Sometimes smaller models return an object for bio_summary despite the schema. Flatten it.
    if (rawParsed && typeof rawParsed.bio_summary === 'object' && rawParsed.bio_summary !== null) {
      if (Array.isArray(rawParsed.bio_summary)) {
        rawParsed.bio_summary = rawParsed.bio_summary.join(" ");
      } else {
        rawParsed.bio_summary = Object.values(rawParsed.bio_summary).join(" ");
      }
    }

    const parsed = creatorIdentityZodSchema.parse(rawParsed);
    return {
      parsed,
      raw_model_output: jsonString,
      provider: data.provider_used || "freeloader",
      model: data.model || "unknown",
      prompt_version: "v2-gateway",
      prompt_hash: createHash("sha256").update(systemPrompt).digest("hex").slice(0, 16),
      request_id: data.id || "req-id",
      duration_ms,
      input_tokens: data.usage?.prompt_tokens,
      output_tokens: data.usage?.completion_tokens,
      estimated_cost_usd: 0
    };
  } catch (err) {
    if (attempt === 1) {
      console.warn(`[LLM] Schema validation failed via gateway, trying repair prompt...`, err);
      const repairPrompt = `The previous JSON you output was invalid or failed validation. Please fix it.\n\nOriginal text:\n${rawText}\n\nFailed output:\n${jsonString}\n\nValidation errors:\n${String(err)}`;
      return executeWithRepair(repairPrompt, schemaString, attempt + 1);
    }
    throw new Error(`Failed to parse/validate LLM output after repair. Errors: ${String(err)}`);
  }
}
