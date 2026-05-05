import { pollAnalysisQueue } from "./queues/analysis-queue";
import { pollScrapingQueue } from "./queues/scraping-queue";
import { env } from "./env";

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

  while (true) {
    try {
      const processed = await tick();
      if (processed === 0) {
        await sleep(env.pollSeconds * 1000);
      }
    } catch (error) {
      console.error("[worker] tick failed", error);
      await sleep(env.pollSeconds * 1000);
    }
  }
}

void main();
