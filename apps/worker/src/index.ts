import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { PipelineOrchestrator } from "@freeloaderapi/core";
import { GeminiAdapter, GroqAdapter, CerebrasAdapter, OpenRouterAdapter } from "@freeloaderapi/adapters";
import { authenticate } from "./middleware/auth.js";
import { pollAnalysisQueue } from "./queues/analysis-queue.js";
import { pollScrapingQueue } from "./queues/scraping-queue.js";
import { getRow, insertRow } from "./supabase-rest.js";
import { env } from "./env.js";

async function triggerDailySyncs() {
  console.log("[worker] Running daily sync check...");
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    // Fetch live creators whose last update was >24h ago
    const creators = await getRow<any[]>("creators", `onboarding_status=eq.live&updated_at=lt.${twentyFourHoursAgo}&limit=100`);
    if (!creators || creators.length === 0) return;
    
    console.log(`[worker] Found ${creators.length} stale profiles to resync.`);
    for (const c of creators) {
      // Find their root link
      const links = await getRow<any[]>("creator_links", `creator_id=eq.${c.id}&platform=eq.${c.root_platform}`);
      if (links && links.length > 0) {
        await insertRow("scraping_queue", {
          creator_id: c.id,
          link_id: links[0].id,
          platform: c.root_platform,
          handle: c.root_handle,
          status: "pending",
          priority: 0 // low priority for bg sync
        });
        console.log(`[worker] Queued background sync for ${c.display_name}`);
      }
    }
  } catch (error) {
    console.error("[worker] Daily sync failed", error);
  }
}

// 1. Initialize Sentry if configured
if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
  });
  console.log("[worker] Sentry initialized");
}

let isRunning = true;

// 2. Graceful Shutdown handlers
function shutdown() {
  console.log("\n[worker] Gracefully shutting down... Waiting for current tick to finish.");
  isRunning = false;
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tick() {
  const scrapingCount = await pollScrapingQueue();
  const analysisCount = await pollAnalysisQueue();
  return scrapingCount + analysisCount;
}

async function main() {
  console.log(`[worker] ${env.workerId} started`);

  // 3. Initialize AI Gateway Pipeline
  const openRouter = new OpenRouterAdapter();
  const originalOrCompletion = openRouter._chatCompletion.bind(openRouter);
  openRouter._chatCompletion = async (req: any, sig: any) => {
    const model = req.model === "gpt-4o-mini" ? "openai/gpt-4o-mini" : (req.model === "gpt-4o" ? "openai/gpt-4o" : req.model);
    return originalOrCompletion({ ...req, model }, sig);
  };

  const cerebras = new CerebrasAdapter();
  cerebras.supportsModel = () => true;
  const originalCbCompletion = cerebras._chatCompletion.bind(cerebras);
  cerebras._chatCompletion = async (req: any, sig: any) => {
    // Map any incoming model to Cerebras's fast llama 8b
    return originalCbCompletion({ ...req, model: "llama3.1-8b" }, sig);
  };

  const providers = [];
  providers.push(openRouter);
  providers.push(new GroqAdapter());
  providers.push(new GeminiAdapter());
  providers.push(cerebras);
  
  const pipeline = new PipelineOrchestrator(providers);

  // 4. Start Express Server (Monolith mode: Health Check + AI Gateway)
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: ['https://closr-monorepo.vercel.app', 'http://localhost:3000'] }));
  app.use(express.json({ limit: '50kb' }));

  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/v1/chat/completions", authenticate, async (req: Request, res: Response) => {
    try {
      const result = await pipeline.execute(req.body);
      res.json(result);
    } catch (error: any) {
      console.error("[ai-gateway] Freeloader error:", error);
      res.status(500).json({
        error: {
          message: error.message || "Internal Server Error",
          type: "server_error"
        }
      });
    }
  });

  const server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`[worker] Express AI Gateway & Health server listening on port ${env.port}`);
  });

  // 5. Start Background Polling Loop
  let lastSyncCheck = 0;
  
  while (isRunning) {
    try {
      const now = Date.now();
      if (now - lastSyncCheck > 60 * 60 * 1000) { // Every 1 hour
        lastSyncCheck = now;
        await triggerDailySyncs();
      }

      const processed = await tick();
      if (processed === 0 && isRunning) {
        await sleep(env.pollSeconds * 1000);
      }
    } catch (error) {
      console.error("[worker] tick failed", error);
      Sentry.captureException(error);
      if (isRunning) {
        await sleep(env.pollSeconds * 1000);
      }
    }
  }

  console.log("[worker] Exited successfully.");
  server.close(() => {
    process.exit(0);
  });
}

void main();
