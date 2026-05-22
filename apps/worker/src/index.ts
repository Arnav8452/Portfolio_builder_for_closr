import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import http from "http";
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

  // 3. Health Check Server for Render/Railway
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200);
      res.end("OK");
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  server.listen(env.port, () => {
    console.log(`[worker] Health check server listening on port ${env.port}`);
  });

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
