Here is exactly how the Verified Portfolio Builder works end-to-end, and the checklist of what you need to configure to make it live.

### How the Pipeline Works

The system is decoupled to prevent slow web scrapers from blocking the Next.js frontend or the AI processing.

1. **Authentication & Identity Phase**
   - A creator visits the Next.js app (`/creators`) and signs in using **Google OAuth**. This is the core identity anchor.
   - NextAuth uses the Supabase Adapter to save the user into a highly-secure `next_auth` schema inside Supabase.
   - **Routing Fork**: The Next.js server checks if the authenticated user already has a portfolio in the `creators` table. If yes, they go to the Dashboard. If no, they go to the Intake Builder.

2. **The Creator Intake (Vercel Frontend)**
   - The creator connects their "Root Node" (e.g., authenticating via YouTube/Twitch/GitHub). This proves cryptographic ownership of their main channel.
   - They paste in their secondary links (Twitter, Substack, LinkedIn, etc).
   - Next.js writes a new creator row into Supabase with `onboarding_status = "queued"`, and inserts their secondary links into the `scraping_queue` table.

3. **The Worker (Scraping & Cleaning Phase)**
   - Your stateless worker (deployed on Render, Railway, etc.) constantly polls the `scraping_queue` using a `SKIP LOCKED` query.
   - It executes Playwright or RSS requests to scrape the text from those secondary links.
   - It passes the raw HTML into a semantic cleaner which aggressively strips navigation, deduplicates arrays, and truncates the HTML into a compact 2-8KB payload.
   - It extracts deterministic metrics (e.g. `12.4K followers` -> `12400`) and saves them directly to the DB.
   - It updates the creator's `onboarding_status` to `"completed"`.
   - The cleaned payload is then pushed into the `analysis_queue`.

4. **The LLM Inference (DeepSeek API + Zod Validation)**
   - The worker pulls from the `analysis_queue` and sends the cleaned semantic text to the **DeepSeek API** using strict `json_object` formatting.
   - The response is piped through a `Zod` validation schema. If the model hallucinated or missed fields, it triggers an automatic repair prompt loop.
   - **Identity Merging**: The worker fetches any existing identity data, merges the new arrays with the old ones, and upserts it back to Supabase (along with robust observability metrics like `llm_request_id` and token usage).
   - It updates the creator's `onboarding_status` to `"analysis_completed"`, marking the portfolio as "Live" on the public `public_creator_profiles` view!

---

### What You Need to Do

To make this live, you need to configure the environment variables on both the Vercel (Next.js) side and the Render (Worker) side.

#### 1. Setup Supabase
Run the schema we locked in `packages/database/schema.sql` inside your Supabase SQL Editor to generate the tables, queues, and the specific `next_auth` schema.

#### 2. Configure the Frontend (`apps/web/.env`)
The Next.js frontend handles the OAuth and writes to the DB. You need to configure:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NextAuth Configuration (For Google Auth and Root Node verification)
NEXTAUTH_URL=http://localhost:3000 # Change to your Vercel URL in prod
NEXTAUTH_SECRET=generate_a_random_secret_string

# Google OAuth for Core Identity
GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret

# Root Nodes Developer Apps
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
```

#### 3. Configure the Worker (`apps/worker/.env`)
You deploy this to Render, Railway, or Fly.io as a Background Service or Web Service. It needs the powerful Service Role key to bypass Row Level Security.
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DeepSeek Configuration
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_MODEL=deepseek-chat

# APIs for scraping
GITHUB_TOKEN=your_github_personal_access_token
YOUTUBE_API_KEY=your_youtube_data_api_key

# Observability (Optional)
SENTRY_DSN=your_sentry_dsn
PORT=8080 # Required by Render/Railway for health checks
```