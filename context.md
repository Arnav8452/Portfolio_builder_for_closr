Here is exactly how the Verified Portfolio Builder works end-to-end, and the checklist of what you need to configure to make it live.

### How the Pipeline Works

The system is decoupled to prevent slow web scrapers from blocking the Next.js frontend or the AI processing.

1. **The Creator Intake (Vercel Frontend)**
   - A creator visits the Next.js app and connects their "Root Node" (e.g., authenticating via YouTube OAuth). This proves cryptographic ownership of their main channel.
   - They paste in their secondary links (Twitter, Substack, LinkedIn, etc).
   - Next.js writes a new creator row into Supabase and inserts their secondary links into the `scraping_queue` table.

2. **The Oracle Worker (Scraping Phase)**
   - Your Oracle ARM server constantly polls the `scraping_queue` using a `SKIP LOCKED` query (so if you run multiple Oracle instances, they never grab the same job).
   - It executes Playwright or RSS requests to scrape the text from those secondary links.
   - It performs OSINT checks (Layer 2 & 3), looking at the scraped bios to see if they link *back* to the Root Node. If they do, the link is marked as **Verified**.
   - The scraped raw text is then pushed into the `analysis_queue`.

3. **The Local AI Inference (Oracle Worker)**
   - The worker pulls from the `analysis_queue` and sends the massive block of scraped text to your local Ollama instance (`qwen2.5:3b`).
   - The LLM forces the text into our strict JSON schema, extracting the creator's `primary_niche`, `audience_size_tier`, and `brand_tone`. 
   - The data is saved back to Supabase, completing the verified portfolio!

---

### What You Need to Do

To make this live, you need to configure the environment variables on both the Vercel (Next.js) side and the Oracle (Worker) side.

#### 1. Setup Supabase
Run the schema we locked in `packages/database/schema.sql` inside your Supabase SQL Editor to generate the tables and queues.

#### 2. Configure the Frontend (`apps/web/.env`)
The Next.js frontend handles the OAuth and writes to the DB. You need to configure:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NextAuth Configuration (For the Root Node verification)
NEXTAUTH_URL=http://localhost:3000 # Change to your Vercel URL in prod
NEXTAUTH_SECRET=generate_a_random_secret_string

# You need to create OAuth apps in these developer portals to let creators sign in
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret
```

#### 3. Configure the Oracle Worker (`apps/worker/.env`)
You need to SSH into your Oracle ARM instance and set up the background worker. It needs the powerful Service Role key to bypass Row Level Security.
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make sure Ollama is running locally on the Oracle server
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b

# You need tokens here to query the APIs for scraping
GITHUB_TOKEN=your_github_personal_access_token
YOUTUBE_API_KEY=your_youtube_data_api_key
```

#### 4. Run Ollama on Oracle
On the Oracle instance, make sure you have the model pulled and running:
```bash
ollama pull qwen2.5:3b
```

Once those `.env` files are populated, you simply deploy the `web` workspace to Vercel, and run `npm run start` in the `worker` workspace on your Oracle machine. 