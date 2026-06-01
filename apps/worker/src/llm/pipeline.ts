import { env } from "../env.js";
import type { LLMResponse } from "./types.js";
import { creatorIdentityZodSchema, creatorIdentityJsonSchema } from "./schema.js";
import { createHash } from 'crypto';

const MODELS = [
  // Use Freeloader's virtual model names so that ModelRegistry
  // translates them to provider-specific IDs automatically (e.g.,
  // gpt-4o-mini → gemini-2.5-flash for Gemini, llama-3.1-8b-instant for Groq).
  // Passing raw names like "gemini-2.5-flash" bypasses translation and crashes
  // when Groq/Cerebras receive a model they don't serve.
  "gpt-4o-mini",
  "gpt-4o"
];

export async function extractCreatorIdentity(rawText: string, creatorName: string): Promise<LLMResponse> {
  const schemaString = JSON.stringify(creatorIdentityJsonSchema);
  
  let chunks: string[] = [];
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) {
      chunks = parsed;
    } else {
      chunks = [rawText];
    }
  } catch {
    chunks = [rawText];
  }

  if (chunks.length === 0) chunks = [""];

  // 1. MAP: Run extraction on each chunk in parallel using different models
  const mapPromises = chunks.map((chunk, index) => {
    const model = MODELS[index % MODELS.length]!;
    return executeWithRepair(chunk, schemaString, model, 1, creatorName);
  });

  const mapResults = await Promise.allSettled(mapPromises);
  
  const successfulResults: LLMResponse[] = mapResults
    .filter((r): r is PromiseFulfilledResult<LLMResponse> => r.status === 'fulfilled')
    .map(r => r.value);

  if (successfulResults.length === 0) {
    throw new Error("All Map-Reduce chunks failed LLM extraction.");
  }

  // 2. REDUCE: Merge the partial CreatorIdentities
  const mergedIdentity = successfulResults.reduce((acc, curr) => {
    const p1 = acc.parsed;
    const p2 = curr.parsed;

    return {
      ...acc,
      parsed: {
        identity_match: p1.identity_match !== false && p2.identity_match !== false,
        primary_niche: p1.primary_niche || p2.primary_niche,
        bio_summary: (p1.bio_summary?.length || 0) > (p2.bio_summary?.length || 0) ? p1.bio_summary : p2.bio_summary,
        technical_skills: Array.from(new Set([...(p1.technical_skills || []), ...(p2.technical_skills || [])])),
        brand_tone: Array.from(new Set([...(p1.brand_tone || []), ...(p2.brand_tone || [])])),
        content_format: Array.from(new Set([...(p1.content_format || []), ...(p2.content_format || [])])),
        audience_size_tier: p1.audience_size_tier || p2.audience_size_tier,
        past_topics: Array.from(new Set([...(p1.past_topics || []), ...(p2.past_topics || [])])),
        achievements: [...(p1.achievements || []), ...(p2.achievements || [])].filter((v, i, a) => 
          a.findIndex(t => t.title.toLowerCase().replace(/[^a-z0-9]/g, '') === v.title.toLowerCase().replace(/[^a-z0-9]/g, '')) === i
        ),
        timeline_events: [...(p1.timeline_events || []), ...(p2.timeline_events || [])].filter((v, i, a) => 
          a.findIndex(t => t.title.toLowerCase().replace(/[^a-z0-9]/g, '') === v.title.toLowerCase().replace(/[^a-z0-9]/g, '')) === i
        ),
        radar_scores: {
          impact: Math.max(p1.radar_scores?.impact || 50, p2.radar_scores?.impact || 50),
          consistency: Math.max(p1.radar_scores?.consistency || 50, p2.radar_scores?.consistency || 50),
          quality: Math.max(p1.radar_scores?.quality || 50, p2.radar_scores?.quality || 50),
          depth: Math.max(p1.radar_scores?.depth || 50, p2.radar_scores?.depth || 50),
          breadth: Math.max(p1.radar_scores?.breadth || 50, p2.radar_scores?.breadth || 50),
          community: Math.max(p1.radar_scores?.community || 50, p2.radar_scores?.community || 50)
        },
        confidence: Math.max(p1.confidence || 0, p2.confidence || 0)
      },
      input_tokens: (acc.input_tokens || 0) + (curr.input_tokens || 0),
      output_tokens: (acc.output_tokens || 0) + (curr.output_tokens || 0),
      duration_ms: (acc.duration_ms || 0) + (curr.duration_ms || 0),
      provider: acc.provider === curr.provider ? acc.provider : `${acc.provider},${curr.provider}`,
      model: acc.model === curr.model ? acc.model : `${acc.model},${curr.model}`,
      prompt_version: acc.prompt_version,
      prompt_hash: acc.prompt_hash,
      request_id: acc.request_id === curr.request_id ? acc.request_id : `${acc.request_id},${curr.request_id}`,
      raw_model_output: `${acc.raw_model_output}\n\n---\n\n${curr.raw_model_output}`,
      estimated_cost_usd: (acc.estimated_cost_usd || 0) + (curr.estimated_cost_usd || 0)
    };
  });

  // We must logically AND the identity_match flags. If any chunk is a clear spoof, the whole identity is spoofed.
  mergedIdentity.parsed.identity_match = successfulResults.every(r => r.parsed.identity_match !== false);

  return mergedIdentity;
}

export async function executeWithRepair(
  rawText: string,
  schemaString: string,
  modelName: string,
  attempt: number = 1,
  creatorName: string
): Promise<LLMResponse> {
  const GATEWAY_URL = env.aiGatewayUrl;
  const GATEWAY_SECRET = env.aiGatewaySecret;

  const startTime = Date.now();
  const systemPrompt = `You are evaluating a creator's verified social telemetry chunks to construct a comprehensive B2B profile.
  The creator claims to be named "${creatorName}".
  If this telemetry clearly belongs to a different person with a vastly different name (e.g. claiming to be Arnav but the profile is Linus Torvalds), set 'identity_match' to false. 
  CRITICAL: If the telemetry says "No results found", "Not Found", or otherwise indicates the data is missing, DO NOT reject the identity. Set 'identity_match' to true. Only set false if you see POSITIVE proof that the profile belongs to someone else.
  Extract the data matching the following JSON schema exactly.
  Schema: ${schemaString}
  
  CRITICAL GROUNDING INSTRUCTION: You MUST ground ALL your extraction and analysis STRICTLY in the provided telemetry data payload. DO NOT hallucinate, guess, or invent external information. If a field like bio_summary cannot be confidently deduced from the payload, clearly state 'Insufficient data to generate summary.' instead of inventing one.
  CRITICAL UI FIELDS:
  1. 'achievements': Extract notable achievements, major projects, top repositories, and impressive metrics (e.g., follower counts, total commits). Treat prominent repositories or projects as distinct achievements. Use the project name or metric as the 'title' with a brief summary as the 'description'. Return an array of these achievements.
  2. 'radar_scores': Score the creator from 0 to 100 on the following metrics using this STRICT RUBRIC:
     - IMPACT: How much reach or tangible influence does their work have? (e.g. >10k followers/stars = 90+, <100 = 50-).
     - CONSISTENCY: How regularly and reliably do they publish, commit, or upload? (e.g. Daily/Weekly = 90+, Sporadic/Inactive = 50-).
     - QUALITY: How polished and well-received is their content/code? (e.g. High engagement, clean code, highly praised = 90+).
     - DEPTH: Do they demonstrate profound expertise or build complex/advanced projects?
     - BREADTH: Do they cover multiple domains, technologies, or topics? (e.g. Polyglot dev, multi-niche creator = 85+).
     - COMMUNITY: How much do they interact, collaborate, and respond to their audience/peers?
  3. 'timeline_events': Extract any notable dates/events to build a timeline. Each event MUST have a 'date', a 'title', and a 'description'.
  4. 'confidence': A decimal from 0.0 to 1.0 representing how much raw, hard data was actually available to make these assessments. If the data is extremely sparse or missing, confidence MUST be low (< 0.4). If there is rich, verifiable data, set it high (> 0.8).
  CRITICAL: bio_summary MUST be a single plain string, NOT an object or array.
  ANTI-HALLUCINATION PROTOCOL: If the rawText says "No tweets found", "data extraction is not supported", or clearly lacks profile data, you MUST return empty arrays [] for achievements, technical_skills, past_topics, brand_tone, content_format, and timeline_events, and an empty string "" for bio_summary. NEVER invent default placeholders like "100 Tweets" or "Bachelor's Degree".`;

  let response: Response | null = null;
  let fetchAttempt = 0;
  const maxFetchAttempts = 4; // Initial + 3 retries

  while (fetchAttempt < maxFetchAttempts) {
    fetchAttempt++;
    response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_SECRET}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: rawText }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (response.ok) break;

    const errText = await response.text();
    if (response.status === 429 && fetchAttempt < maxFetchAttempts) {
      // Exponential backoff default: 2s, 4s, 8s
      let waitSeconds = Math.pow(2, fetchAttempt); 
      
      // Parse Groq's specific wait time if available: "Please try again in 10.42s"
      const match = errText.match(/Please try again in ([\d.]+)s/);
      if (match && match[1]) {
        waitSeconds = parseFloat(match[1]) + 1.5; // Give it an extra 1.5s buffer
      }
      
      console.warn(`[LLM] Rate limit hit (429). Waiting ${waitSeconds.toFixed(2)}s before attempt ${fetchAttempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
      continue;
    }

    throw new Error(`AI Gateway error: ${response.status} ${errText}`);
  }

  if (!response) {
    throw new Error("Failed to fetch from AI Gateway");
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
    let rawParsed = JSON.parse(jsonString);
    
    if (rawParsed && rawParsed.CreatorIdentity) {
      rawParsed = rawParsed.CreatorIdentity;
    }
    
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
      model: data.model || modelName,
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
      console.warn(`[LLM] Schema validation failed via gateway, trying repair prompt on model ${modelName}...`);
      const repairPrompt = `The previous JSON you output was invalid or failed validation. Please fix it.\n\nOriginal text:\n${rawText}\n\nFailed output:\n${jsonString}\n\nValidation errors:\n${String(err)}`;
      // Use gpt-4o-mini to trigger Freeloader's provider-specific mapping
      const repairModel = "gpt-4o-mini"; 
      return executeWithRepair(repairPrompt, schemaString, repairModel, attempt + 1, creatorName);
    }
    throw new Error(`Failed to parse/validate LLM output after repair. Errors: ${String(err)}`);
  }
}
