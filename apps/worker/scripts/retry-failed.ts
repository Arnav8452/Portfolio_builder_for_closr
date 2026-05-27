import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../web/.env") });

process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

import { rpc, updateRow, getRow } from "../src/supabase-rest.js";

async function retryFailed() {
  console.log("Checking for failed jobs...");
  
  const failedAnalysis = await getRow<any[]>("analysis_queue", "status=eq.failed");
  console.log(`Found ${failedAnalysis?.length || 0} failed analysis jobs.`);
  
  for (const job of failedAnalysis || []) {
    console.log(`Resetting analysis job ${job.id}...`);
    await updateRow("analysis_queue", job.id, {
      status: "pending",
      attempts: 0,
      locked_at: null,
      worker_id: null,
    });
  }

  const failedScraping = await getRow<any[]>("scraping_queue", "status=eq.failed");
  console.log(`Found ${failedScraping?.length || 0} failed scraping jobs.`);
  
  for (const job of failedScraping || []) {
    console.log(`Resetting scraping job ${job.id}...`);
    await updateRow("scraping_queue", job.id, {
      status: "pending",
      attempts: 0,
      locked_at: null,
      worker_id: null,
    });
  }
  
  console.log("Done resetting failed jobs.");
}

retryFailed().catch(console.error);
