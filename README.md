# Closr Verified Portfolio Builder

The Verified Portfolio Builder turns creator-submitted links into verified, structured creator profiles.
The repository is organized as a monorepo containing the Next.js Vercel frontend, a stateless TypeScript worker, a centralized AI Gateway, and shared database contracts.

## Pipeline Architecture

The system is decoupled to ensure high reliability, zero-proxy scalability, and seamless AI processing.

### 1. The Creator Intake (Vercel Frontend)
- A creator visits the Next.js app and securely signs in via **Google Authentication** (`NextAuth.js`). This ensures that every portfolio is tied to a verifiable user identity.
- The creator connects their "Root Node" (e.g., YouTube, GitHub) to prove cryptographic ownership.
- They paste secondary social links (Twitter, Instagram, Substack, LinkedIn, etc.).
- The Next.js frontend writes the creator profile to Supabase and pushes the links to a PostgreSQL-backed `scraping_queue`.

### 2. Supported Platforms & Zero-Proxy Social Ingestion
To guarantee stability while keeping operations completely free and scalable:

#### A. OAuth Integrated (Gold Standard)
*These platforms use official APIs via user-connected OAuth tokens for robust, legal data extraction.*
- **GitHub**: Pulls profile info, repositories, top languages, and contribution history via the official REST and GraphQL APIs.
- **YouTube**: Pulls channel analytics, demographics, engagement, and geo-data via the YouTube Analytics API.
- **Twitch**: Pulls channel streaming data and total views via the Twitch Helix API.
- **Instagram**: Integrated Meta OAuth exchanges logins for Long-Lived Access Tokens to extract media and stats via the official Meta Graph API.
- **LinkedIn**: Basic verified data pulled via LinkedIn's official OAuth scope.

#### B. Lightweight OSINT Scrapers (100% Free)
*Used for unconnected profiles, avoiding expensive proxies or fragile headless browsers.*
- **Twitter / X**: Safely fetches timelines using **Nitter** open-source RSS instances to parse bio and recent tweets for free. If Nitter fails, it automatically falls back to managed infrastructure via `Apify` to ensure high availability.
- **LinkedIn**: Bypasses strict anti-bot walls on unconnected accounts by executing a zero-API-key **DuckDuckGo HTML Dork** (`site:linkedin.com/in/username`) to silently extract the user's Headline, Job Title, and Name from search snippets.

#### C. RSS & Web Crawling
- **Substack & Medium**: Natively parses the author's public RSS feeds.
- **Custom Websites**: Routes generic URLs through **Jina AI** to convert the site to clean Markdown. If Jina fails, it uses Mozilla's **Readability** engine to semantically extract the main article/bio directly from the HTML DOM.

- **Cron Worker**: A Next.js API cron endpoint (`/api/cron/sync-socials`) runs in the background, updating the `social_cache` in Supabase to ensure sub-second portfolio load times without hitting rate limits.

### 3. The Scraping Worker (Render/Railway)
- A stateless Node.js worker polls the `scraping_queue`. 
- It extracts raw HTML from unsupported/fallback platforms and cleans it aggressively down to a compact 2-8KB semantic context.
- The worker verifies specific DNS or bio challenge codes (e.g. `closr-8f2a`) and bumps the portfolio verification level accordingly.
- The cleaned semantic payload is pushed into the `analysis_queue`.

### 4. AI Gateway & Inference 
- To avoid provider lock-in and handle rate limits, the worker routes all LLM calls through a dedicated **AI Gateway** (`apps/ai-gateway`) powered by `@freeloaderapi/core`.
- The gateway natively load-balances requests across **DeepSeek, Groq, Cerebras, and OpenRouter**.
- Output goes through a rigid Zod validation pipeline to ensure structured identities.

## Repository Layout

```text
verified_portfolio_builder/
  apps/
    web/                    # Next.js creator intake, NextAuth, Apify/Meta Cron Sync
    worker/                 # TypeScript stateless worker for general scraping & queue management
    ai-gateway/             # Centralized Freeloader API Gateway for multi-provider LLM balancing
  packages/
    database/
      schema.sql            # Master Supabase schema (Tables, Caches, Tokens, Queues)
      types.ts              # Shared TypeScript definitions
  package.json              # npm workspaces
```

## Setup & Deployment

### 1. Setup Supabase
Run the schema locked in `packages/database/schema.sql` inside your Supabase SQL Editor to generate the tables, queues, and caching infrastructure.

### 2. Configure the Frontend (`apps/web/.env`)
Deploy to Vercel and configure:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate_a_random_secret_string

GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret

# Zero-Proxy Sync
META_APP_ID=your_facebook_app_id
META_APP_SECRET=your_facebook_app_secret
APIFY_API_TOKEN=your_apify_token
CRON_SECRET=secret_for_cron_endpoint
```

### 3. Deploy the Monolith Worker (Render)
We merged the AI Gateway and the Scraping Worker into a single `@closr/worker` Node.js application.

To deploy it to Render, you can either use our automated Blueprint or set it up manually.

#### Option A: Automated Blueprint (Recommended)
1. Go to your Render Dashboard.
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will read the `render.yaml` file in this repository and automatically configure the Web Service with the correct Build Command, Run Command, and standard Environment Variables.
5. In the Render Dashboard, you will be prompted to supply your private keys.

#### Option B: Manual Setup
1. Go to your Render Dashboard, click **New +**, and select **Web Service**.
2. Choose **Build and deploy from a Git repository** and connect your repo.
3. Configure the service:
   - **Name:** `closr-monolith-worker`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build --workspace=apps/worker`
   - **Start Command:** `npm start --workspace=apps/worker`
4. Add the environment variables below under the Environment Variables section.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gateway Configuration
GEMINI_API_KEY=your_google_studio_key
GATEWAY_SECRET=closr-secure-ai-key-2026
AI_GATEWAY_URL=http://localhost:8080/v1/chat/completions # The worker queries its own internal Express server!

GITHUB_TOKEN=your_github_pat
PORT=8080 
```
