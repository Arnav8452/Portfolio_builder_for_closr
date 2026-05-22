import type { Database } from "@closr/database/types";
import { env } from "../env";
import { extractCreatorIdentity } from "../llm/pipeline";
import { getRow, rpc, updateRow, upsertRow } from "../supabase-rest";

type AnalysisJob = Database["public"]["Tables"]["analysis_queue"]["Row"];

export async function claimAnalysisJobs() {
  return rpc<AnalysisJob[]>("claim_analysis_jobs", {
    p_worker_id: env.workerId,
    p_batch_size: env.analysisBatchSize,
  });
}

export async function pollAnalysisQueue() {
  const jobs = await claimAnalysisJobs();

  for (const job of jobs) {
    await processAnalysisJob(job);
  }

  return jobs.length;
}

async function processAnalysisJob(job: AnalysisJob) {
  try {
    const result = await extractCreatorIdentity(job.raw_text);
    const identity = result.parsed;

    // Fetch existing identity to merge arrays
    const existingResult = await getRow<any[]>("creator_identities", `creator_id=eq.${job.creator_id}`);
    const existing = existingResult?.[0];

    const mergedSkills = [...new Set([...(existing?.technical_skills ?? []), ...(identity.technical_skills ?? [])])];
    const mergedTone = [...new Set([...(existing?.brand_tone ?? []), ...(identity.brand_tone ?? [])])];
    const mergedFormat = [...new Set([...(existing?.content_format ?? []), ...(identity.content_format ?? [])])];
    const mergedTopics = [...new Set([...(existing?.past_topics ?? []), ...(identity.past_topics ?? [])])];

    await upsertRow("creator_identities", {
      creator_id: job.creator_id,
      primary_niche: identity.primary_niche ?? existing?.primary_niche,
      technical_skills: mergedSkills,
      brand_tone: mergedTone,
      content_format: mergedFormat,
      audience_size_tier: identity.audience_size_tier ?? existing?.audience_size_tier,
      past_topics: mergedTopics,
      bio_summary: identity.bio_summary ?? existing?.bio_summary,
      extraction_confidence: Math.max(identity.confidence ?? 0, existing?.extraction_confidence ?? 0),
      llm_provider: result.provider,
      llm_model: result.model,
      prompt_version: result.prompt_version,
      prompt_hash: result.prompt_hash,
      llm_request_id: result.request_id,
      processing_duration_ms: result.duration_ms,
      input_tokens: result.input_tokens,
      output_tokens: result.output_tokens,
      estimated_cost_usd: result.estimated_cost_usd,
      raw_model_output: { raw: result.raw_model_output, source_payload: job.payload },
      updated_at: new Date().toISOString(),
    }, "creator_id");

    await updateRow("creators", job.creator_id, {
      onboarding_status: "analysis_completed",
      updated_at: new Date().toISOString(),
    });

    await updateRow<AnalysisJob[]>("analysis_queue", job.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    await updateRow<AnalysisJob[]>("analysis_queue", job.id, {
      status: job.attempts + 1 >= job.max_attempts ? "failed" : "pending",
      error_log: [...(Array.isArray(job.error_log) ? job.error_log : []), { message: String(error) }],
    });
  }
}
