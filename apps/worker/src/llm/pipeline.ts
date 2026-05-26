import { env } from "../env.js";
import type { LLMResponse } from "./types.js";
import { creatorIdentityZodSchema, creatorIdentityJsonSchema } from "./schema.js";

export async function extractCreatorIdentity(rawText: string): Promise<LLMResponse> {
  const schemaString = JSON.stringify(creatorIdentityJsonSchema);
  return executeWithRepair(rawText, schemaString);
}

async function executeWithRepair(
  rawText: string,
  schemaString: string,
  attempt = 1
): Promise<LLMResponse> {
  const GATEWAY_URL = env.aiGatewayUrl || "http://localhost:3000/v1/chat/completions";
  const GATEWAY_SECRET = env.aiGatewaySecret || "dev-secret";

  const startTime = Date.now();

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GATEWAY_SECRET}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Virtualized by Freeloader
      messages: [
        { role: "system", content: `Extract creator identity following this JSON schema exactly: ${schemaString}` },
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
  
  // Strip markdown fences
  if (jsonString.startsWith("\`\`\`")) {
    jsonString = jsonString.replace(/^\`\`\`(json)?\n/, "").replace(/\n\`\`\`$/, "");
  }

  try {
    const rawParsed = JSON.parse(jsonString);
    const parsed = creatorIdentityZodSchema.parse(rawParsed);
    return {
      parsed,
      raw_model_output: jsonString,
      provider: data.provider_used || "freeloader",
      model: data.model || "unknown",
      prompt_version: "v2-gateway",
      prompt_hash: "hash-placeholder",
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
