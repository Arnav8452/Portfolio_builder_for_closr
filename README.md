# Closr Verified Portfolio Builder

The Verified Portfolio Builder turns creator-submitted links and documents into verified, structured creator profiles.
The repository is organized as a monorepo containing the Next.js Vercel frontend, a stateless TypeScript worker, a centralized AI Gateway, and shared database contracts.

## 🚀 Key Features

*   **Interactive Bento UI**: Beautiful, interactive retro-arcade styled portfolios. Data cards and platform dossiers act as hyperlinks connecting directly to the source content (e.g. GitHub repos, Tweets, YouTube videos).
*   **Fully Mobile Optimized**: The UI utilizes a fluid CSS grid (`bento-grid`) and `flexWrap` optimizations to ensure perfect rendering across desktops, tablets, and extremely small mobile screens.
*   **Advanced Dynamic SEO**: Portfolios are primed for Google search out of the box. Includes Next.js dynamic metadata, Open Graph / Twitter Card social previews, JSON-LD `Person` structured data, and a dynamically generated XML Sitemap (`/sitemap.xml`) for all live portfolios.
*   **Strict Anti-Hallucination LLM Pipeline**: Uses rigorous system prompts and a cross-referencing protocol to ensure the AI never invents generic achievements or misattributes web-scraped OSINT data to the wrong person.
*   **Zero-Proxy Social Ingestion**: A highly scalable architecture that avoids expensive proxies by using official OAuth APIs, RSS feeds, and lightweight HTML dorks.

---

## 🛠 Supported Platforms & Extraction Engines

The pipeline supports an extensive list of platforms to build a holistic profile of the creator:

### 1. OAuth Integrated (The Gold Standard)
*These platforms use official APIs via user-connected OAuth tokens for robust, legal data extraction.*
- **GitHub**: Pulls profile info, repositories, top languages, and contribution history.
- **YouTube**: Pulls channel analytics, demographics, engagement, and geo-data.
- **Twitch**: Pulls channel streaming data and total views.
- **Instagram**: Integrated Meta OAuth exchanges logins for Long-Lived Access Tokens to extract media and stats.
- **LinkedIn**: Basic verified data pulled via LinkedIn's official OAuth scope.

### 2. Lightweight OSINT Scrapers (100% Free)
*Used for unconnected profiles, avoiding expensive proxies or fragile headless browsers.*
- **Twitter / X**: Safely fetches timelines using **Nitter** open-source RSS instances. Automatically falls back to managed infrastructure via `Apify` if Nitter instances fail.
- **LinkedIn**: Bypasses strict anti-bot walls on unconnected accounts by executing a zero-API-key **DuckDuckGo HTML Dork** (`site:linkedin.com/in/username`) to silently extract the user's Headline, Job Title, and Name.

### 3. Web Crawling & RSS
- **Substack & Medium**: Natively parses the author's public RSS feeds.
- **Custom Websites**: Routes generic URLs through **Jina AI** to convert the site to clean Markdown. If Jina fails, it uses Mozilla's **Readability** engine to semantically extract the main article/bio.

### 4. Direct Document Uploads
- **Resumes / CVs**: Creators can directly upload their Resume/CV files (PDF, DOCX). The files are parsed using advanced multimodal LLMs (like LlamaParse/Gemini). Data extracted from these files is explicitly marked as "Not Truly Verified" on the UI to maintain integrity. For privacy, the uploaded files are immediately and permanently deleted from the database once data extraction is complete.

---

## 🏗 Pipeline Architecture

The system is decoupled to ensure high reliability, zero-proxy scalability, and seamless AI processing.

### 1. The Creator Intake (Vercel Frontend)
- A creator visits the Next.js app and securely signs in via **Google Authentication** (`NextAuth.js`).
- They connect their "Root Node" (e.g., YouTube, GitHub) to prove cryptographic ownership.
- They paste secondary social links or upload their Resume/CV.
- The Next.js frontend writes the creator profile to Supabase and pushes the links to a PostgreSQL-backed `scraping_queue`.

### 2. The Scraping Worker (Render/Railway)
- A stateless Node.js worker polls the `scraping_queue`. 
- It extracts raw HTML/data from platforms and cleans it aggressively down to a compact semantic context.
- The worker verifies specific DNS or bio challenge codes (e.g. `closr-8f2a`) to establish cryptographic trust.
- The cleaned semantic payload is pushed into the `analysis_queue`.

### 3. AI Gateway & Inference 
- To avoid provider lock-in and handle rate limits, the worker routes all LLM calls through a dedicated **AI Gateway** powered by `@freeloaderapi/core`.
- The gateway natively load-balances requests across **DeepSeek, Groq, Cerebras, and OpenRouter**.
- Output goes through a rigid Zod validation pipeline to ensure structured identities.

---

## 📁 Repository Layout

```text
closr-monorepo/
  apps/
    web/                    # Next.js creator intake, NextAuth, SEO Engine, Interactive UI
    worker/                 # TypeScript stateless worker for scraping, queues & OSINT
    ai-gateway/             # Centralized Freeloader API Gateway for LLM balancing
  packages/
    database/
      schema.sql            # Master Supabase schema (Tables, Caches, Tokens, Queues)
      types.ts              # Shared TypeScript definitions
  package.json              # npm workspaces
```

---

## ⚙️ Setup & Deployment

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
