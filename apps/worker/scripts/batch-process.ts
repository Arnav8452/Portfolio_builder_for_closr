import { pollAnalysisQueue } from "../src/queues/analysis-queue";
import { pollScrapingQueue } from "../src/queues/scraping-queue";

const target = Number(process.env.BATCH_LIMIT ?? 300);

let processed = 0;

while (processed < target) {
  const scraping = await pollScrapingQueue();
  const analysis = await pollAnalysisQueue();
  const tick = scraping + analysis;

  if (tick === 0) break;
  processed += tick;
}

console.log(`Processed ${processed} queue jobs.`);
