<div align="center">
  <h1>Closr Verified Portfolio Engine</h1>
  <p><strong>Enterprise-Grade Creator Identity & Cryptographic Portfolio Verification System</strong></p>
  
  [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)]()
  [![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)]()
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)]()
</div>

---

## 📌 Overview

The **Closr Verified Portfolio Engine** is a high-availability, zero-trust architecture designed to autonomously construct, verify, and serve structured creator profiles. Built for scale, it seamlessly ingests fragmented data across the social web, applies cryptographic verification protocols, and deploys fully responsive, SEO-optimized B2B creator portfolios in real-time.

By decoupling the ingestion pipeline, AI inference routing, and the client presentation layer, the engine achieves robust fault tolerance, zero-proxy scalability, and sub-second latency for end users.

---

## 🚀 Enterprise Features

*   **Zero-Trust Cryptographic Verification**: Implements strict Cross-Platform Identity Consistency protocols. Data ingested via official OAuth tokens is cryptographically verified, while unconnected OSINT data (like uploaded CVs or deep-web searches) undergoes a rigorous semantic signature check before being flagged as "Claimed".
*   **Agentic Re-Act Deep Scraping Engine**: The worker utilizes a Reasoning + Acting (Re-Act) autonomous loop. If initial telemetry is insufficient, the agent dynamically executes OSINT (Open Source Intelligence) deep searches to proactively hunt for missing background context without human intervention.
*   **Strict Anti-Hallucination Pipeline**: Employs deterministic cross-referencing algorithms to ensure Large Language Models (LLMs) never misattribute OSINT data or hallucinate generic achievements.
*   **Decentralized AI Gateway Routing**: Built-in support for `@freeloaderapi/core` to automatically load-balance LLM inference across DeepSeek, Groq, Cerebras, and OpenRouter, preventing vendor lock-in and bypassing strict rate limits.
*   **Production-Ready SEO & SSR**: Portfolios are Server-Side Rendered (SSR) with Next.js dynamic metadata. Includes auto-generated JSON-LD `Person` schemas, Open Graph rich previews, and dynamic XML Sitemaps for optimal search engine indexing.
*   **Responsive Bento-Grid UI**: A fluid, interactive interface optimized for all form factors, featuring hyperlinked data cards that trace every achievement back to its origin source.

---

## 🔌 Supported Telemetry Pipelines

The ingestion engine is highly modular, supporting multi-modal data extraction:

### 1. OAuth Verified Nodes (Tier 1 Trust)
*Direct integration with official REST & GraphQL APIs via user-authorized tokens.*
- **GitHub**: Repositories, language heatmaps, and contribution timelines.
- **YouTube**: Channel analytics, demographics, engagement, and geo-data.
- **Twitch**: Live streaming data, concurrents, and total views.
- **Instagram**: Long-Lived Access Token exchange for media & community metrics via Meta Graph API.
- **LinkedIn**: Verified professional headline and summary extraction.

### 2. Zero-Proxy OSINT Scrapers (Tier 2 Trust)
*Highly resilient, scalable scraping without relying on fragile headless browsers or expensive proxy networks.*
- **Twitter / X**: Distributed fetching via **Nitter** open-source instances, with automatic failover to managed `Apify` infrastructure.
- **LinkedIn (Fallback)**: Executes silent, zero-API-key **DuckDuckGo HTML Dorks** (`site:linkedin.com/in/*`) to bypass anti-bot walls.
- **Websites & Blogs**: Intelligent routing via **Jina AI** for markdown conversion, falling back to Mozilla's **Readability** engine for semantic DOM extraction.

### 3. Asynchronous Document Parsing (Tier 3 Trust)
- **Resumes / CVs**: Supports direct PDF/DOCX uploads. Documents are processed by multimodal LLMs (LlamaParse/Gemini), explicitly marked as "Claimed" for data integrity, and immediately purged from block storage post-extraction to comply with strict data privacy standards.

---

## 🏗 System Architecture

The monorepo strictly separates concerns across three primary services:

```text
closr-monorepo/
  apps/
    web/                    # Next.js 14 (App Router) - Client Intake, SSR Portfolios, SEO Engine
    worker/                 # Node.js TypeScript Worker - Headless Scrapers, Queues & Re-Act OSINT
    ai-gateway/             # Express.js - Centralized LLM Inference Load Balancer
  packages/
    database/
      schema.sql            # Master PostgreSQL schema (Supabase)
      types.ts              # Global TypeScript definitions for end-to-end type safety
```

### Data Flow
1. **Intake**: Creators authenticate via NextAuth and submit their root platform.
2. **Queueing**: The Next.js client writes to Supabase and pushes jobs to a PostgreSQL-backed asynchronous queue.
3. **Execution**: The stateless Node.js worker polls the queue, executes multi-threaded scrapers, and performs DNS/bio verification.
4. **Synthesis**: Cleaned semantic payloads are routed through the AI Gateway for structured JSON generation.
5. **Serving**: The Next.js client reconstructs the data into sub-second, highly interactive public portfolios.

---

## ⚙️ Deployment & Infrastructure

### 1. Database (Supabase)
Execute `packages/database/schema.sql` in your PostgreSQL instance to initialize tables, row-level security (RLS), and message queues.

### 2. Frontend Edge Deployment (Vercel)
Configure the following environment variables in your deployment dashboard:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate_a_random_secret_string
GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret
META_APP_ID=your_facebook_app_id
META_APP_SECRET=your_facebook_app_secret
APIFY_API_TOKEN=your_apify_token
CRON_SECRET=secret_for_cron_endpoint
```

### 3. Worker Node Deployment (Render / AWS / Railway)
The backend is packaged as a high-performance Node monolith containing both the scrapers and the AI gateway. 

**Recommended Setup (Render Blueprint):**
Link the repository to Render and use the integrated `render.yaml` for automatic provisioning.

**Manual Docker / Node Setup:**
```bash
npm install
npm run build --workspace=apps/worker
npm start --workspace=apps/worker
```
Required Environment Variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_google_studio_key
GATEWAY_SECRET=closr-secure-ai-key-2026
AI_GATEWAY_URL=http://localhost:8080/v1/chat/completions # Routes internally
GITHUB_TOKEN=your_github_pat
PORT=8080 
```

---

<div align="center">
  <p>Built with precision for the next generation of creators.</p>
</div>
