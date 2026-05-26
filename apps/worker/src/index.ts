import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { PipelineOrchestrator } from "@freeloaderapi/core";
import { GeminiAdapter, GroqAdapter, CerebrasAdapter, OpenRouterAdapter } from "@freeloaderapi/adapters";
import { authenticate } from "./middleware/auth";
import { pollAnalysisQueue } from "./queues/analysis-queue";
import { pollScrapingQueue } from "./queues/scraping-queue";
import { env } from "./env";

// 1. Initialize Sentry if configured
if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
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
  const providers = [];
  providers.push(new GeminiAdapter());
  providers.push(new CerebrasAdapter());
  providers.push(new GroqAdapter());
  providers.push(new OpenRouterAdapter());
  
  const pipeline = new PipelineOrchestrator(providers);

  // 4. Start Express Server (Monolith mode: Health Check + AI Gateway)
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

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

  const server = app.listen(env.port, () => {
    console.log(`[worker] Express AI Gateway & Health server listening on port ${env.port}`);
  });

  // 5. Start Background Polling Loop
  while (isRunning) {
    try {
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
  server.close();
  process.exit(0);
}

void main();
