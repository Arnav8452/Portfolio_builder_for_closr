import { env } from "../../env.js";
import type { LLMProvider, LLMResponse } from "../types.js";
import { createHash } from "crypto";

export class OllamaProvider implements LLMProvider {
  name = "ollama";

  async extractIdentity(prompt: string, schemaString: string): Promise<Omit<LLMResponse, "parsed">> {
    const start = Date.now();
    const promptVersion = "ollama_json_v1";
    const promptHash = createHash("sha256").update(prompt + schemaString).digest("hex").slice(0, 16);

    const fullPrompt = `You are an expert data extractor. Extract a verified creator identity dossier from the raw text.\n\nYou must return ONLY JSON that perfectly satisfies this JSON schema:\n${schemaString}\n\nRaw text:\n${prompt}`;

    const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.ollamaModel,
        prompt: fullPrompt,
        stream: false,
        format: JSON.parse(schemaString), // Ollama allows passing the raw JSON object schema
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama generation failed: ${response.status}`);
    }

    const data = await response.json();
    const rawOutput = data.response || "{}";

    return {
      raw_model_output: rawOutput,
      provider: this.name,
      model: data.model ?? env.ollamaModel,
      prompt_version: promptVersion,
      prompt_hash: promptHash,
      request_id: `ollama-${Date.now()}`,
      duration_ms: Date.now() - start,
      input_tokens: data.prompt_eval_count ?? 0,
      output_tokens: data.eval_count ?? 0,
      estimated_cost_usd: 0, // Local inference
    };
  }
}
