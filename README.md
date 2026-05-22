# Closr Verified Portfolio Builder

The Verified Portfolio Builder turns creator-submitted links into verified, structured creator profiles.
The repo is organized as a monorepo so the Next.js Vercel frontend, stateless TypeScript worker, and database contracts share one source of truth.

## Pipeline Architecture

The system is decoupled to prevent slow web scrapers from blocking the Next.js frontend or the AI processing.

1. **The Creator Intake (Vercel Frontend)**
   - A creator visits the Next.js app and connects their "Root Node" (e.g., authenticating via YouTube OAuth). This proves cryptographic ownership of their main channel.
   - They paste in their secondary links (Twitter, Substack, LinkedIn, etc).
   - Next.js writes a new creator row into Supabase and inserts their secondary links into the `scraping_queue` table.

2. **The Worker (Scraping & Cleaning)**
   - A horizontally scalable stateless worker (deployed on Render, Railway, etc.) constantly polls the `scraping_queue`.
   - It scrapes the raw HTML and cleans it aggressively (extracting bio blocks, metrics, and deduplicating arrays) down to a compact 2-8KB semantic context.
   - Deterministic numeric metrics (like "12.4K followers") are parsed explicitly and saved securely.
   - The cleaned semantic payload is pushed into the `analysis_queue`.

3. **LLM Inference (DeepSeek API + Zod)**
   - The worker pulls from the `analysis_queue` and sends the semantic context to the DeepSeek API using an OpenAI-compatible interface.
   - Output goes through a rigid Zod validation pipeline. If it fails, the worker triggers an automated repair loop.
   - Validated creator identities are enriched with full observability metrics (token usage, latency, prompt versions) and upserted back to Supabase.

## Repository Layout

```text
verified_portfolio_builder/
  apps/
    web/                    # Next.js creator intake + public portfolio
    worker/                 # TypeScript stateless worker (Render/Railway ready)
    worker-python/          # Legacy Python worker scaffold kept for reference
  packages/
    database/
      schema.sql            # Master Supabase schema
      types.ts              # Shared DB/platform types
    config/
      eslint-config/
      typescript-config/
  package.json              # npm workspaces
  turbo.json                # build/typecheck pipeline
```

## Setup & Deployment

### 1. Setup Supabase
Run the schema locked in `packages/database/schema.sql` inside your Supabase SQL Editor to generate the tables and queues.

### 2. Configure the Frontend (`apps/web/.env`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_string

GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret
```

### 3. Configure the Worker (`apps/worker/.env`)
Deploy this application to a service like Render or Railway. 
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DeepSeek Configuration
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key

# Optional Observability
SENTRY_DSN=your_sentry_dsn
PORT=8080 # Required for Health Checks
```

### 4. Local Development
```bash
npm install
npm run web:dev
npm run worker:dev
```
