import type { ParsedCreatorIdentity } from "./schema";

export type LLMResponse = {
  parsed: ParsedCreatorIdentity;
  raw_model_output: any;
  provider: string;
  model: string;
  prompt_version: string;
  prompt_hash: string;
  request_id: string;
  duration_ms: number;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost_usd?: number;
};

export interface LLMProvider {
  name: string;
  extractIdentity(prompt: string, schemaString: string): Promise<Omit<LLMResponse, "parsed">>;
}
