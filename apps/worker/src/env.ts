function optionalNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("SUPABASE_URL").replace(/\/$/, ""),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  workerId: process.env.WORKER_ID ?? "oracle-arm-portfolio-1",
  sentryDsn: process.env.SENTRY_DSN,
  port: optionalNumber(process.env.PORT, 8080),
  scrapingBatchSize: optionalNumber(process.env.SCRAPING_BATCH_SIZE, 5),
  analysisBatchSize: optionalNumber(process.env.ANALYSIS_BATCH_SIZE, 1),
  pollSeconds: optionalNumber(process.env.WORKER_POLL_SECONDS, 5),
  llmProvider: process.env.LLM_PROVIDER ?? "freeloader",
  aiGatewayUrl: (process.env.AI_GATEWAY_URL ?? "http://localhost:3000/v1/chat/completions").replace(/\/$/, ""),
  aiGatewaySecret: process.env.GATEWAY_SECRET ?? "dev-secret",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1").replace(/\/$/, ""),
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, ""),
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:3b",
  githubToken: process.env.GITHUB_TOKEN,
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  twitchClientId: process.env.TWITCH_CLIENT_ID,
  twitchClientSecret: process.env.TWITCH_CLIENT_SECRET,
};
