import type { Database } from "@closr/database/types";
import { env } from "../env";
import { extractCreatorIdentity } from "../llm/ollama-client";
import { rpc, updateRow, upsertRow } from "../supabase-rest";

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
    const identity = await extractCreatorIdentity(job.raw_text, job.payload);

    await upsertRow("creator_identities", {
      creator_id: job.creator_id,
      primary_niche: identity.primary_niche,
      technical_skills: identity.technical_skills,
      brand_tone: identity.brand_tone,
      content_format: identity.content_format,
      audience_size_tier: identity.audience_size_tier,
      past_topics: identity.past_topics,
      bio_summary: identity.bio_summary,
      confidence: identity.confidence,
      raw_model_output: identity.raw_model_output,
      updated_at: new Date().toISOString(),
    }, "creator_id");

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
