import { env } from "../env";
import type { LLMProvider, LLMResponse } from "./types";
import { DeepSeekProvider } from "./providers/deepseek";
import { OllamaProvider } from "./providers/ollama";
import { creatorIdentityZodSchema, creatorIdentityJsonSchema } from "./schema";

// Basic in-memory circuit breaker
let deepSeekFailures = 0;
let deepSeekCircuitOpenUntil = 0;
const MAX_FAILURES = 3;
const CIRCUIT_TIMEOUT_MS = 60000; // 1 minute pause

const providers = {
  deepseek: new DeepSeekProvider(),
  ollama: new OllamaProvider(),
};

export async function extractCreatorIdentity(rawText: string): Promise<LLMResponse> {
  const schemaString = JSON.stringify(creatorIdentityJsonSchema);

  // 1. Determine active provider chain
  const chain: LLMProvider[] = [];
  
  if (env.llmProvider === "deepseek") {
    if (Date.now() > deepSeekCircuitOpenUntil) {
      chain.push(providers.deepseek);
    }
    chain.push(providers.ollama); // Fallback
  } else {
    chain.push(providers.ollama);
  }

  let lastError: any = null;

  for (const provider of chain) {
    try {
      const result = await executeWithRepair(provider, rawText, schemaString);
      
      if (provider.name === "deepseek") {
        deepSeekFailures = 0; // Reset circuit breaker
      }
      return result;
    } catch (err) {
      lastError = err;
      if (provider.name === "deepseek") {
        deepSeekFailures++;
        if (deepSeekFailures >= MAX_FAILURES) {
          deepSeekCircuitOpenUntil = Date.now() + CIRCUIT_TIMEOUT_MS;
          console.warn(`[CIRCUIT BREAKER] DeepSeek failed ${MAX_FAILURES} times. Pausing API calls for 1 minute.`);
        }
      }
      console.warn(`[LLM] Provider ${provider.name} failed:`, String(err));
      // Continue to next provider in chain
    }
  }

  throw new Error(`All LLM providers failed. Last error: ${String(lastError)}`);
}

async function executeWithRepair(
  provider: LLMProvider,
  rawText: string,
  schemaString: string,
  attempt = 1
): Promise<LLMResponse> {
  const result = await provider.extractIdentity(rawText, schemaString);
  
  let jsonString = result.raw_model_output;
  // Strip markdown fences
  if (jsonString.startsWith("```")) {
    jsonString = jsonString.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
  }

  try {
    const rawParsed = JSON.parse(jsonString);
    const parsed = creatorIdentityZodSchema.parse(rawParsed);
    return { ...result, parsed };
  } catch (err) {
    if (attempt === 1) {
      console.warn(`[LLM] Schema validation failed for ${provider.name}, trying repair prompt...`, err);
      // Construct a repair prompt
      const repairPrompt = `The previous JSON you output was invalid or failed validation. Please fix it.\n\nOriginal text:\n${rawText}\n\nFailed output:\n${jsonString}\n\nValidation errors:\n${String(err)}`;
      return executeWithRepair(provider, repairPrompt, schemaString, attempt + 1);
    }
    throw new Error(`Failed to parse/validate LLM output after repair. Errors: ${String(err)}`);
  }
}
