# Closr Verified Portfolio Builder

The Verified Portfolio Builder turns creator-submitted links into verified, structured creator profiles.
The repo is organized as a monorepo so the Next.js Vercel frontend, Oracle TypeScript worker, and database contracts share one source of truth.

## Pipeline Architecture

The system is decoupled to prevent slow web scrapers from blocking the Next.js frontend or the AI processing.

1. **The Creator Intake (Vercel Frontend)**
   - A creator visits the Next.js app and connects their "Root Node" (e.g., authenticating via YouTube OAuth). This proves cryptographic ownership of their main channel.
   - They paste in their secondary links (Twitter, Substack, LinkedIn, etc).
   - Next.js writes a new creator row into Supabase and inserts their secondary links into the `scraping_queue` table.

2. **The Oracle Worker (Scraping Phase)**
   - Your Oracle ARM server constantly polls the `scraping_queue` using a `SKIP LOCKED` query.
   - It executes Playwright or RSS requests to scrape the text from those secondary links.
   - It performs OSINT checks (Layer 2 & 3), looking at the scraped bios to see if they link *back* to the Root Node. If they do, the link is marked as **Verified**.
   - The scraped raw text is then pushed into the `analysis_queue`.

3. **The Local AI Inference (Oracle Worker)**
   - The worker pulls from the `analysis_queue` and sends the massive block of scraped text to your local Ollama instance (`qwen2.5:3b`).
   - The LLM forces the text into our strict JSON schema, extracting the creator's `primary_niche`, `audience_size_tier`, and `brand_tone`.
   - The data is saved back to Supabase, completing the verified portfolio.
   - Public profiles render from Supabase through `/p/[slug]`.

## Repository Layout

```text
verified_portfolio_builder/
  apps/
    web/                    # Next.js creator intake + public portfolio
    worker/                 # TypeScript Oracle ARM queue worker
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

To make this live, you need to configure the environment variables on both the Vercel (Next.js) side and the Oracle (Worker) side.

### 1. Setup Supabase
Run the schema locked in `packages/database/schema.sql` inside your Supabase SQL Editor to generate the tables and queues.

### 2. Configure the Frontend (`apps/web/.env`)
The Next.js frontend handles the OAuth and writes to the DB. You need to configure:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_string

# OAuth credentials
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret
```

### 3. Configure the Oracle Worker (`apps/worker/.env`)
SSH into your Oracle ARM instance and set up the background worker. It needs the Service Role key to bypass Row Level Security.
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make sure Ollama is running locally on the Oracle server
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b

# APIs for scraping
GITHUB_TOKEN=your_github_personal_access_token
YOUTUBE_API_KEY=your_youtube_data_api_key
```

### 4. Run Ollama on Oracle
On the Oracle instance, make sure you have the model pulled and running:
```bash
ollama pull qwen2.5:3b
```

Once those `.env` files are populated, install workspaces with `npm install`. Then, deploy the `web` workspace to Vercel, and run `npm run worker:dev` in the `worker` workspace on your Oracle machine.

## Useful Commands

```bash
npm install
npm run web:dev
npm run worker:dev
npm run web:typecheck
npm run web:build
npm run worker:typecheck
npm run worker:build
npm run legacy-worker:test
```
