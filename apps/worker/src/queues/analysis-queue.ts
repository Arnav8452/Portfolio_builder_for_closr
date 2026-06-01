import type { Database } from "@closr/database/types";
import { env } from "../env.js";
import { extractCreatorIdentity } from "../llm/pipeline.js";
import { getRow, rpc, updateRow, upsertRow } from "../supabase-rest.js";

type AnalysisJob = Database["public"]["Tables"]["analysis_queue"]["Row"];

const creatorLocks = new Map<string, Promise<void>>();

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
  while (creatorLocks.has(job.creator_id)) {
    await creatorLocks.get(job.creator_id);
  }
  let releaseLock: () => void;
  creatorLocks.set(job.creator_id, new Promise<void>(resolve => { releaseLock = resolve; }));

  try {
    // Fetch creator name for consistency checking
    const creatorResult = await getRow<any[]>("creators", `id=eq.${job.creator_id}`);
    const creatorName = creatorResult?.[0]?.display_name || "Unknown Creator";

    const result = await extractCreatorIdentity(job.raw_text, creatorName);
    const identity = result.parsed;

    if (identity.identity_match === false) {
      // Identity spoofing detected!
      if (job.scraping_job_id) {
        const scrapingJobResult = await getRow<any[]>("scraping_queue", `id=eq.${job.scraping_job_id}`);
        const linkId = scrapingJobResult?.[0]?.link_id;
        if (linkId) {
          await updateRow("creator_links", linkId, {
            verification_status: "inconsistent_identity"
          });
        }
      }
      
      await updateRow<AnalysisJob[]>("analysis_queue", job.id, {
        status: "completed", // Complete the job so it doesn't retry, but we didn't merge it.
        raw_output: result
      });
      return;
    }

    // Fetch existing identity to merge arrays
    const existingResult = await getRow<any[]>("creator_identities", `creator_id=eq.${job.creator_id}`);
    const existing = existingResult?.[0];

    const mergedSkills = [...new Set([...(existing?.technical_skills ?? []), ...(identity.technical_skills ?? [])])];
    const mergedTone = [...new Set([...(existing?.brand_tone ?? []), ...(identity.brand_tone ?? [])])];
    const mergedFormat = [...new Set([...(existing?.content_format ?? []), ...(identity.content_format ?? [])])];
    const mergedTopics = [...new Set([...(existing?.past_topics ?? []), ...(identity.past_topics ?? [])])];

    // Smart merge bio_summary
    const isNewBioPoor = !identity.bio_summary || identity.bio_summary.includes("Insufficient data") || identity.bio_summary === "Pending summary.";
    const mergedBioSummary = isNewBioPoor && existing?.bio_summary && !existing.bio_summary.includes("Insufficient data") && existing.bio_summary !== "Pending summary."
      ? existing.bio_summary
      : identity.bio_summary ?? existing?.bio_summary;

    // Smart merge data cards (achievements, timeline, radar)
    const existingRaw = existing?.raw_model_output || {};
    
    // Merge achievements
    const existingAchievements = Array.isArray(existingRaw.achievements) ? existingRaw.achievements : [];
    const newAchievements = Array.isArray(identity.achievements) ? identity.achievements : [];
    const mergedAchievements = [...existingAchievements, ...newAchievements].reduce((acc, curr) => {
      if (!acc.find((a: any) => a.title === curr.title)) acc.push(curr);
      return acc;
    }, []);

    // Merge timeline events
    const existingTimeline = Array.isArray(existingRaw.timeline_events) ? existingRaw.timeline_events : [];
    const newTimeline = Array.isArray(identity.timeline_events) ? identity.timeline_events : [];
    const mergedTimeline = [...existingTimeline, ...newTimeline].reduce((acc, curr) => {
      if (!acc.find((a: any) => a.title === curr.title)) acc.push(curr);
      return acc;
    }, []);

    // Merge radar scores
    const confidenceIsHigher = (identity.confidence ?? 0) > (existing?.extraction_confidence ?? 0);
    const mergedRadar = confidenceIsHigher && identity.radar_scores && Object.keys(identity.radar_scores).length > 0
      ? identity.radar_scores 
      : existingRaw.radar_scores || identity.radar_scores;

    const finalRawModelOutput = {
      ...existingRaw,
      ...identity,
      achievements: mergedAchievements,
      timeline_events: mergedTimeline,
      radar_scores: mergedRadar,
      raw: result.raw_model_output,
      source_payload: job.payload
    };

    await upsertRow("creator_identities", {
      creator_id: job.creator_id,
      primary_niche: identity.primary_niche ?? existing?.primary_niche,
      technical_skills: mergedSkills,
      brand_tone: mergedTone,
      content_format: mergedFormat,
      audience_size_tier: identity.audience_size_tier ?? existing?.audience_size_tier,
      past_topics: mergedTopics,
      bio_summary: mergedBioSummary,
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
      raw_model_output: finalRawModelOutput,
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
      status: job.attempts >= job.max_attempts ? "failed" : "pending",
      error_log: [...(Array.isArray(job.error_log) ? job.error_log : []), serializeError(error)],
    });
  } finally {
    creatorLocks.delete(job.creator_id);
    releaseLock!();
  }
}

function serializeError(error: unknown): any { if (error instanceof Error) { return { message: error.message, stack: error.stack }; } return { message: String(error) }; }

