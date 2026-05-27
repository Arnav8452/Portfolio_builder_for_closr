import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../web/.env") });

// Mock AI Gateway URL to localhost since we are running locally
process.env.AI_GATEWAY_URL = "https://portfolio-builder-for-closr.onrender.com/v1/chat/completions";
process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

import { getRow } from "../src/supabase-rest.js";
import { extractCreatorIdentity } from "../src/llm/pipeline.js";

async function testPipeline() {
  console.log("Fetching raw payload from database for Arnav8452...");
  const jobs = await getRow<any[]>("analysis_queue", `status=eq.completed`);
  if (!jobs || jobs.length === 0) {
    console.log("No completed analysis jobs found to test");
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log("No analysis jobs found for this user");
    return;
  }
  
  const rawText = jobs[0].raw_text;
  console.log(`Found raw text (${rawText.length} characters)`);
  console.log("Passing to AI Gateway...");
  
  try {
    const result = await extractCreatorIdentity(rawText);
    console.log("\n====== LLM RESULT ======\n");
    console.log("Provider:", result.provider);
    console.log("Model:", result.model);
    console.log("Duration:", result.duration_ms, "ms");
    console.log("\nParsed Identity:\n", JSON.stringify(result.parsed, null, 2));
  } catch (error) {
    console.error("Pipeline failed:", error);
  }
}

testPipeline().catch(console.error);
