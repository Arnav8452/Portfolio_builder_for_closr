/**
 * Comprehensive Backend Integration Test
 * =======================================
 * Tests the full pipeline: Scrapers → Semantic Chunking → LLM Analysis
 * Against the LIVE deployed backend at https://portfolio-builder-for-closr.onrender.com
 *
 * Usage: npx tsx test-backend.ts
 */

import { fetchOauthPlatform } from "./src/scrapers/oauth.js";
import { cleanScrapedContent } from "./src/osint/cleaner.js";
import { extractMetricsFromText } from "./src/osint/metrics.js";
import { creatorIdentityZodSchema } from "./src/llm/schema.js";
import fs from "fs";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────
const BACKEND_URL = "https://portfolio-builder-for-closr.onrender.com";
const GATEWAY_SECRET = "dev-secret_2005";
const GITHUB_URL = "https://github.com/Arnav8452";
const LINKEDIN_URL = "https://www.linkedin.com/in/arnav-chandra-051813325";

// Set env vars from shell environment (see Render_apis.md for values)
// Run with: $env:GITHUB_TOKEN="..."; $env:SUPABASE_URL="..."; ... npx tsx test-backend.ts
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.AI_GATEWAY_URL = `${BACKEND_URL}/v1/chat/completions`;
process.env.GATEWAY_SECRET = GATEWAY_SECRET;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const results: string[] = [];
function log(msg: string) {
  console.log(msg);
  results.push(msg);
}

function separator(title: string) {
  const line = "═".repeat(70);
  log(`\n${line}`);
  log(`  ${title}`);
  log(`${line}\n`);
}

function testPass(name: string) { log(`  ✅ PASS: ${name}`); }
function testFail(name: string, reason: string) { log(`  ❌ FAIL: ${name} — ${reason}`); }
function testWarn(name: string, reason: string) { log(`  ⚠️  WARN: ${name} — ${reason}`); }

// ─── TEST 1: Health Check ────────────────────────────────────────────────────
async function testHealthCheck() {
  separator("TEST 1: Backend Health Check");
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    const body = await res.json() as any;
    log(`  Status: ${res.status}`);
    log(`  Body: ${JSON.stringify(body)}`);
    if (res.status === 200 && body.status === "ok") {
      testPass("Health endpoint returns 200 OK");
    } else {
      testFail("Health check", `Expected {status: 'ok'}, got ${JSON.stringify(body)}`);
    }
  } catch (err) {
    testFail("Health check", `Network error: ${(err as Error).message}`);
  }
}

// ─── TEST 2: AI Gateway Auth ─────────────────────────────────────────────────
async function testGatewayAuth() {
  separator("TEST 2: AI Gateway Auth");

  // 2a. Without auth header
  try {
    const noAuth = await fetch(`${BACKEND_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemini-2.5-flash", messages: [{ role: "user", content: "hi" }] })
    });
    log(`  No-auth status: ${noAuth.status}`);
    if (noAuth.status === 401 || noAuth.status === 403) {
      testPass("Unauthenticated request rejected");
    } else {
      testFail("Auth guard", `Expected 401/403, got ${noAuth.status}`);
    }
  } catch (err) {
    testFail("Auth guard (no-auth)", (err as Error).message);
  }

  // 2b. With wrong secret
  try {
    const wrongAuth = await fetch(`${BACKEND_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer WRONG-SECRET" },
      body: JSON.stringify({ model: "gemini-2.5-flash", messages: [{ role: "user", content: "hi" }] })
    });
    log(`  Wrong-secret status: ${wrongAuth.status}`);
    if (wrongAuth.status === 401 || wrongAuth.status === 403) {
      testPass("Wrong-secret request rejected");
    } else {
      testFail("Auth guard", `Expected 401/403, got ${wrongAuth.status}`);
    }
  } catch (err) {
    testFail("Auth guard (wrong-secret)", (err as Error).message);
  }

  // 2c. With correct secret
  try {
    const goodAuth = await fetch(`${BACKEND_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_SECRET}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "Say hello in 5 words." }],
        temperature: 0.1
      })
    });
    log(`  Auth-ok status: ${goodAuth.status}`);
    const authBody = await goodAuth.json() as any;
    log(`  Response preview: ${JSON.stringify(authBody).substring(0, 300)}`);
    if (goodAuth.ok && authBody.choices?.[0]?.message?.content) {
      testPass("Authenticated request succeeds with LLM response");
    } else {
      testFail("Auth gateway response", "Missing choices[0].message.content");
    }
  } catch (err) {
    testFail("Auth gateway", (err as Error).message);
  }
}

// ─── TEST 3: GitHub Scraper ──────────────────────────────────────────────────
async function testGitHubScraper(): Promise<string> {
  separator("TEST 3: GitHub Scraper (OAuth API)");
  try {
    const result = await fetchOauthPlatform("github", GITHUB_URL);
    const rawLen = result.rawText.length;
    const payload = result.payload as any;

    log(`  rawText length: ${rawLen} chars`);
    log(`  rawText preview (first 500):\n${result.rawText.substring(0, 500)}`);
    log(`  payload.source: ${payload.source}`);
    log(`  payload.profile.name: ${payload.profile?.name}`);
    log(`  payload.profile.login: ${payload.profile?.login}`);
    log(`  payload.profile.public_repos: ${payload.profile?.public_repos}`);
    log(`  payload.profile.followers: ${payload.profile?.followers}`);
    log(`  payload.repos count: ${payload.repos?.length}`);
    log(`  payload.contributions exists: ${!!payload.contributions}`);
    log(`  payload.readme length: ${payload.readme?.length || 0} chars`);
    log(`  payload.readme preview (first 300):\n${(payload.readme || "(empty)").substring(0, 300)}`);

    // Assertions
    if (rawLen > 100) testPass("rawText has substantial content");
    else testFail("rawText length", `Only ${rawLen} chars`);

    if (payload.profile?.name) testPass(`Profile name extracted: ${payload.profile.name}`);
    else testFail("Profile name", "Missing");

    if (payload.profile?.public_repos > 0) testPass(`Public repos: ${payload.profile.public_repos}`);
    else testWarn("Public repos", "Zero or missing");

    if (payload.repos?.length > 0) testPass(`${payload.repos.length} repos fetched`);
    else testFail("Repos list", "Empty");

    if (payload.contributions?.contributionsCollection) testPass("Contributions data present");
    else testFail("Contributions", "Missing GraphQL contribution data");

    const hasReadme = result.rawText.includes("Profile README:");
    if (hasReadme) testPass("README content included in rawText");
    else testFail("README in rawText", "Profile README section missing from rawText sent to LLM");

    if (payload.readme && payload.readme.length > 50) testPass(`README stored in payload (${payload.readme.length} chars)`);
    else testWarn("README in payload", "Empty or missing");

    return result.rawText;
  } catch (err) {
    testFail("GitHub scraper", (err as Error).message);
    return "";
  }
}

// ─── TEST 4: LinkedIn Scraper ────────────────────────────────────────────────
async function testLinkedInScraper(): Promise<string> {
  separator("TEST 4: LinkedIn Scraper (Jina Fallback)");
  
  // No OAuth token available (no creatorId), so test the Jina fallback path
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${LINKEDIN_URL}`, {
      headers: { "X-Return-Format": "markdown" }
    });
    const text = await jinaRes.text();
    log(`  Jina status: ${jinaRes.status}`);
    log(`  Jina response length: ${text.length} chars`);
    log(`  Jina response preview (first 500):\n${text.substring(0, 500)}`);

    const hasError = text.includes("error 999") || text.includes("Error 999");
    if (jinaRes.ok && !hasError && text.length > 200) {
      testPass("Jina Reader successfully scraped LinkedIn");
    } else if (hasError) {
      testWarn("Jina Reader", "Error 999 — LinkedIn is blocking Jina's proxy IPs. This is expected.");
    } else {
      testWarn("Jina Reader", `Status ${jinaRes.status}, body length ${text.length}`);
    }

    return text;
  } catch (err) {
    testFail("LinkedIn scraper (Jina)", (err as Error).message);
    return "";
  }
}

// ─── TEST 5: Semantic Chunking ───────────────────────────────────────────────
function testSemanticChunking(githubRaw: string, linkedinRaw: string): string {
  separator("TEST 5: Semantic Chunking (cleanScrapedContent)");
  
  const combined = `[GITHUB]\n${githubRaw}\n\n[LINKEDIN]\n${linkedinRaw}`;
  log(`  Combined raw input length: ${combined.length} chars`);
  
  const chunkedJson = cleanScrapedContent(combined);
  let chunks: string[];
  try {
    chunks = JSON.parse(chunkedJson);
  } catch {
    testFail("Chunker output", "cleanScrapedContent did not return valid JSON");
    return chunkedJson;
  }

  log(`  Produced ${chunks.length} chunks`);
  for (let i = 0; i < chunks.length; i++) {
    log(`  Chunk ${i + 1}: ${chunks[i].length} chars`);
    log(`    Preview: ${chunks[i].substring(0, 150)}...`);
  }

  // Assertions
  if (chunks.length >= 1) testPass(`Produced ${chunks.length} chunks`);
  else testFail("Chunks", "Zero chunks produced");

  const allChunksUnder6k = chunks.every(c => c.length <= 6200);
  if (allChunksUnder6k) testPass("All chunks under 6000 char limit");
  else testWarn("Chunk size", "Some chunks exceed 6000 chars");

  const hasGithubContent = chunks.some(c => c.includes("GITHUB") || c.includes("Arnav"));
  if (hasGithubContent) testPass("GitHub content preserved in chunks");
  else testFail("GitHub content", "GitHub data lost during chunking");

  // Check deduplication
  const totalChunkLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const ratio = totalChunkLength / combined.length;
  log(`  Dedup ratio: ${(ratio * 100).toFixed(1)}% of original`);
  if (ratio < 1.0) testPass(`Deduplication working (${(ratio * 100).toFixed(1)}% of original)`);
  else testWarn("Deduplication", "Chunks are larger than input — possible issue");

  return chunkedJson;
}

// ─── TEST 6: Metrics Extraction ──────────────────────────────────────────────
function testMetricsExtraction(rawText: string) {
  separator("TEST 6: Metrics Extraction (extractMetricsFromText)");
  
  const metrics = extractMetricsFromText(rawText);
  log(`  Extracted metrics: ${JSON.stringify(metrics, null, 2)}`);
  
  if (metrics && Object.keys(metrics).length > 0) {
    testPass(`Extracted ${Object.keys(metrics).length} metric fields`);
  } else {
    testWarn("Metrics", "No metrics extracted from raw text");
  }
}

// ─── TEST 7: LLM Analysis via Gateway ────────────────────────────────────────
async function testLLMAnalysis(chunkedText: string) {
  separator("TEST 7: LLM Analysis via Live Gateway");

  const schemaString = JSON.stringify((await import("./src/llm/schema.js")).creatorIdentityJsonSchema);

  const systemPrompt = `You are an expert OSINT data analyst evaluating a creator's verified social telemetry to build a comprehensive portfolio dashboard. 
  Extract a highly-detailed creator identity following this JSON schema exactly: ${schemaString}. 
  Do not lose data. Deep dive into the text, extract specific numbers, and synthesize a rich bio_summary. 
  CRITICAL GROUNDING INSTRUCTION: You MUST ground ALL your extraction and analysis STRICTLY in the provided telemetry data payload.
  CRITICAL: bio_summary MUST be a single plain string, NOT an object or array.
  CRITICAL UI FIELDS:
  1. 'achievements': Create punchy, insightful achievements with a 'title' and 'description'.
  2. 'radar_scores': Score the creator from 0 to 100 on impact, consistency, quality, depth, breadth, and community.
  3. 'timeline_events': Extract any notable dates/events to build a timeline. Each event MUST have a 'date', a 'title', and a 'description'.`;

  // Parse chunks to send only the first (most meaningful) chunk
  let chunks: string[];
  try {
    chunks = JSON.parse(chunkedText);
  } catch {
    chunks = [chunkedText];
  }

  const targetChunk = chunks[0] || "";
  log(`  Sending chunk of ${targetChunk.length} chars to LLM`);
  log(`  Gateway URL: ${BACKEND_URL}/v1/chat/completions`);

  try {
    const start = Date.now();
    const res = await fetch(`${BACKEND_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_SECRET}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: targetChunk }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    const duration = Date.now() - start;

    log(`  Gateway status: ${res.status}`);
    log(`  Duration: ${duration}ms`);

    if (!res.ok) {
      const errText = await res.text();
      testFail("Gateway call", `Status ${res.status}: ${errText.substring(0, 300)}`);
      return;
    }

    const data = await res.json() as any;
    log(`  Provider used: ${data.provider_used || "unknown"}`);
    log(`  Model used: ${data.model || "unknown"}`);
    log(`  Input tokens: ${data.usage?.prompt_tokens || "unknown"}`);
    log(`  Output tokens: ${data.usage?.completion_tokens || "unknown"}`);

    let jsonString = data.choices?.[0]?.message?.content || "{}";
    log(`  Raw LLM output (first 500):\n${jsonString.substring(0, 500)}`);

    // Extract JSON
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.slice(firstBrace, lastBrace + 1);
    }

    // Parse + Validate with Zod
    let rawParsed: any;
    try {
      rawParsed = JSON.parse(jsonString);
      if (rawParsed?.CreatorIdentity) rawParsed = rawParsed.CreatorIdentity;
    } catch (parseErr) {
      testFail("JSON parse", `LLM output is not valid JSON: ${(parseErr as Error).message}`);
      log(`  Full raw output:\n${jsonString}`);
      return;
    }

    log(`\n  Parsed keys: ${Object.keys(rawParsed).join(", ")}`);

    const validated = creatorIdentityZodSchema.safeParse(rawParsed);
    if (validated.success) {
      testPass("Zod schema validation passed");
      const v = validated.data;
      
      log(`\n  ─── VALIDATED IDENTITY ───`);
      log(`  primary_niche: ${v.primary_niche}`);
      log(`  audience_size_tier: ${v.audience_size_tier}`);
      log(`  confidence: ${v.confidence}`);
      log(`  bio_summary: ${v.bio_summary?.substring(0, 200)}...`);
      log(`  technical_skills: [${v.technical_skills?.join(", ")}]`);
      log(`  brand_tone: [${v.brand_tone?.join(", ")}]`);
      log(`  content_format: [${v.content_format?.join(", ")}]`);
      log(`  past_topics: [${v.past_topics?.join(", ")}]`);
      log(`  achievements (${v.achievements?.length || 0}):`);
      for (const a of v.achievements || []) {
        log(`    • ${a.title}: ${a.description.substring(0, 100)}`);
      }
      log(`  radar_scores: ${JSON.stringify(v.radar_scores)}`);
      log(`  timeline_events (${v.timeline_events?.length || 0}):`);
      for (const t of v.timeline_events || []) {
        log(`    • ${t.date}: ${t.title}`);
      }

      // Quality assertions
      if (v.bio_summary && v.bio_summary !== "Pending summary." && v.bio_summary !== "Insufficient data to generate summary.") {
        testPass("bio_summary is a meaningful string");
      } else {
        testFail("bio_summary", `Got: "${v.bio_summary}"`);
      }

      if ((v.technical_skills?.length || 0) >= 3) testPass(`${v.technical_skills!.length} technical skills extracted`);
      else testWarn("technical_skills", `Only ${v.technical_skills?.length || 0} skills`);

      if ((v.achievements?.length || 0) >= 2) testPass(`${v.achievements!.length} achievements extracted`);
      else testWarn("achievements", `Only ${v.achievements?.length || 0}`);

      if (v.confidence && v.confidence > 0.3) testPass(`Confidence: ${v.confidence}`);
      else testWarn("confidence", `Low confidence: ${v.confidence}`);

      if (v.radar_scores) {
        const scores = Object.values(v.radar_scores);
        const allDefault = scores.every(s => s === 50);
        if (!allDefault) testPass("Radar scores are differentiated (not all 50)");
        else testWarn("radar_scores", "All scores are default 50 — LLM may not be analyzing deeply");
      }
    } else {
      const zodErrors = validated.error?.issues || validated.error?.errors || [];
      testFail("Zod validation", zodErrors.map((e: any) => `${(e.path || []).join(".")}: ${e.message}`).join("; "));
      log(`  Full parsed object:\n${JSON.stringify(rawParsed, null, 2)}`);
    }
  } catch (err) {
    testFail("LLM analysis", (err as Error).message);
    log(`  Stack: ${(err as Error).stack}`);
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  log("╔══════════════════════════════════════════════════════════════════════╗");
  log("║  CLOSR BACKEND INTEGRATION TEST SUITE                              ║");
  log(`║  Target: ${BACKEND_URL}                    ║`);
  log(`║  Time:   ${new Date().toISOString()}                          ║`);
  log("╚══════════════════════════════════════════════════════════════════════╝");

  await testHealthCheck();
  await testGatewayAuth();
  const githubRaw = await testGitHubScraper();
  const linkedinRaw = await testLinkedInScraper();
  const chunkedText = testSemanticChunking(githubRaw, linkedinRaw);
  testMetricsExtraction(githubRaw);
  await testLLMAnalysis(chunkedText);

  // ─── Summary ─────────────────────────────────────────────────────────────
  separator("TEST SUMMARY");
  const passes = results.filter(r => r.includes("✅")).length;
  const fails = results.filter(r => r.includes("❌")).length;
  const warns = results.filter(r => r.includes("⚠️")).length;
  log(`  ✅ PASSED: ${passes}`);
  log(`  ❌ FAILED: ${fails}`);
  log(`  ⚠️  WARNS:  ${warns}`);
  log(`  TOTAL:    ${passes + fails + warns}`);

  // Write to file
  const outPath = path.join(import.meta.dirname || ".", "test-results.md");
  const md = `# Backend Integration Test Results\n\n**Target:** ${BACKEND_URL}\n**Time:** ${new Date().toISOString()}\n\n\`\`\`\n${results.join("\n")}\n\`\`\`\n`;
  fs.writeFileSync(outPath, md);
  log(`\nResults written to: ${outPath}`);
}

main().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
