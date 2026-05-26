import { env } from "../../env.js";
import type { LLMProvider, LLMResponse } from "../types.js";
import { createHash } from "crypto";

export class DeepSeekProvider implements LLMProvider {
  name = "deepseek";

  async extractIdentity(prompt: string, schemaString: string): Promise<Omit<LLMResponse, "parsed">> {
    const start = Date.now();
    const promptVersion = "deepseek_json_v1";
    const promptHash = createHash("sha256").update(prompt + schemaString).digest("hex").slice(0, 16);

    const messages = [
      {
        role: "system",
        content: `You are an expert data extractor. You must extract a verified creator identity dossier from the provided text.\n\nYou must return ONLY a JSON object that perfectly satisfies this JSON schema:\n${schemaString}`
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await fetch(`${env.deepseekBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: env.deepseekModel,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`DeepSeek API failed: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const rawOutput = data.choices[0]?.message?.content || "{}";
    
    // Estimate cost roughly for DeepSeek Chat (approx $0.14/1M input, $0.28/1M output tokens)
    const inTokens = data.usage?.prompt_tokens ?? 0;
    const outTokens = data.usage?.completion_tokens ?? 0;
    const estimatedCostUsd = (inTokens * 0.14 / 1000000) + (outTokens * 0.28 / 1000000);

    return {
      raw_model_output: rawOutput,
      provider: this.name,
      model: data.model ?? env.deepseekModel,
      prompt_version: promptVersion,
      prompt_hash: promptHash,
      request_id: data.id ?? `ds-${Date.now()}`,
      duration_ms: Date.now() - start,
      input_tokens: inTokens,
      output_tokens: outTokens,
      estimated_cost_usd: estimatedCostUsd,
    };
  }
}
