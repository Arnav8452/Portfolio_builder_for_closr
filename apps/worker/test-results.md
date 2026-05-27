# Backend Integration Test Results

**Target:** https://portfolio-builder-for-closr.onrender.com
**Time:** 2026-05-27T17:45:07.052Z

```
╔══════════════════════════════════════════════════════════════════════╗
║  CLOSR BACKEND INTEGRATION TEST SUITE                              ║
║  Target: https://portfolio-builder-for-closr.onrender.com                    ║
║  Time:   2026-05-27T17:44:42.366Z                          ║
╚══════════════════════════════════════════════════════════════════════╝

══════════════════════════════════════════════════════════════════════
  TEST 1: Backend Health Check
══════════════════════════════════════════════════════════════════════

  Status: 200
  Body: {"status":"ok"}
  ✅ PASS: Health endpoint returns 200 OK

══════════════════════════════════════════════════════════════════════
  TEST 2: AI Gateway Auth
══════════════════════════════════════════════════════════════════════

  No-auth status: 401
  ✅ PASS: Unauthenticated request rejected
  Wrong-secret status: 403
  ✅ PASS: Wrong-secret request rejected
  Auth-ok status: 200
  Response preview: {"id":"chatcmpl-204ce4cf-711a-4249-bb52-787b48d9855c","object":"chat.completion","created":1779903884,"model":"llama-3.1-8b-instant","choices":[{"index":0,"message":{"role":"assistant","content":"Hello, how are you today?"},"logprobs":null,"finish_reason":"stop"}],"usage":{"queue_time":0.106603513,"
  ✅ PASS: Authenticated request succeeds with LLM response

══════════════════════════════════════════════════════════════════════
  TEST 3: GitHub Scraper (OAuth API)
══════════════════════════════════════════════════════════════════════

  rawText length: 10578 chars
  rawText preview (first 500):
Name: Arnav Chandra

Bio: An ECE student in BITS Pilani Goa campus, interested in system design and AI.

Company: 

Followers: 3

Total Commits: 265

Top Languages: Python: 435682 bytes, TypeScript: 351014 bytes, JavaScript: 198586 bytes, CSS: 59918 bytes, HTML: 48800 bytes, PLpgSQL: 32841 bytes, PowerShell: 3304 bytes, Solidity: 1272 bytes, Dockerfile: 1157 bytes

Recent Repositories:
Portfolio_builder_for_closr: Tool 2 for closr ecosystem - Live Portfolio builder for Creators
Arnav8452: 
chain
  payload.source: github_api
  payload.profile.name: Arnav Chandra
  payload.profile.login: Arnav8452
  payload.profile.public_repos: 13
  payload.profile.followers: 3
  payload.repos count: 10
  payload.contributions exists: true
  payload.readme length: 9120 chars
  payload.readme preview (first 300):
<img src="https://capsule-render.vercel.app/api?type=waving&amp;color=gradient&amp;customColorList=2,12,20&amp;height=200&amp;section=header&amp;text=Arnav%20Chandra&amp;fontSize=57&amp;textAlignY=40&amp;desc=Builder%20%E2%80%94%20AI%20and%20Data%20Systems&amp;descSize=15&amp;fontColor=ffffff&amp;de
  ✅ PASS: rawText has substantial content
  ✅ PASS: Profile name extracted: Arnav Chandra
  ✅ PASS: Public repos: 13
  ✅ PASS: 10 repos fetched
  ✅ PASS: Contributions data present
  ✅ PASS: README content included in rawText
  ✅ PASS: README stored in payload (9120 chars)

══════════════════════════════════════════════════════════════════════
  TEST 4: LinkedIn Scraper (Jina Fallback)
══════════════════════════════════════════════════════════════════════

  Jina status: 200
  Jina response length: 219 chars
  Jina response preview (first 500):
Title: 

URL Source: https://www.linkedin.com/in/arnav-chandra-051813325

Warning: Target URL returned error 999
Warning: This page maybe not yet fully loaded, consider explicitly specify a timeout.

Markdown Content:


  ⚠️  WARN: Jina Reader — Error 999 — LinkedIn is blocking Jina's proxy IPs. This is expected.

══════════════════════════════════════════════════════════════════════
  TEST 5: Semantic Chunking (cleanScrapedContent)
══════════════════════════════════════════════════════════════════════

  Combined raw input length: 10819 chars
  Produced 2 chunks
  Chunk 1: 5962 chars
    Preview: [GITHUB] Name: Arnav Chandra Bio: An ECE student in BITS Pilani Goa campus, interested in system design and AI. Company: Followers: 3 Total Commits: 2...
  Chunk 2: 173 chars
    Preview: com/in/arnav-chandra-051813325 Warning: Target URL returned error 999 Warning: This page maybe not yet fully loaded, consider explicitly specify a tim...
  ✅ PASS: Produced 2 chunks
  ✅ PASS: All chunks under 6000 char limit
  ✅ PASS: GitHub content preserved in chunks
  Dedup ratio: 56.7% of original
  ✅ PASS: Deduplication working (56.7% of original)

══════════════════════════════════════════════════════════════════════
  TEST 6: Metrics Extraction (extractMetricsFromText)
══════════════════════════════════════════════════════════════════════

  Extracted metrics: {}
  ⚠️  WARN: Metrics — No metrics extracted from raw text

══════════════════════════════════════════════════════════════════════
  TEST 7: LLM Analysis via Live Gateway
══════════════════════════════════════════════════════════════════════

  Sending chunk of 5962 chars to LLM
  Gateway URL: https://portfolio-builder-for-closr.onrender.com/v1/chat/completions
  Gateway status: 200
  Duration: 3050ms
  Provider used: groq
  Model used: llama-3.1-8b-instant
  Input tokens: 1784
  Output tokens: 553
  Raw LLM output (first 500):
{
  "name": "Arnav Chandra",
   "bio": "An ECE student in BITS Pilani Goa campus, interested in system design and AI.",
   "achievements": [
      {
         "title": "Built a production-grade, OpenAI-compatible AI gateway",
         "description": "Freeloader — AI Inference Resilience Gateway"
      },
      {
         "title": "Engineered a fully autonomous B2B lead generation pipeline",
         "description": "Closr — Autonomous B2B Lead Generation Engine"
      },
      {
         "title": 

  Parsed keys: name, bio, achievements, radar_scores, timeline_events, bio_summary
  ❌ FAIL: Zod validation — timeline_events.0.title: Invalid input: expected string, received undefined; timeline_events.0.description: Invalid input: expected string, received undefined; timeline_events.1.title: Invalid input: expected string, received undefined; timeline_events.1.description: Invalid input: expected string, received undefined; timeline_events.2.title: Invalid input: expected string, received undefined; timeline_events.2.description: Invalid input: expected string, received undefined; timeline_events.3.title: Invalid input: expected string, received undefined; timeline_events.3.description: Invalid input: expected string, received undefined; timeline_events.4.title: Invalid input: expected string, received undefined; timeline_events.4.description: Invalid input: expected string, received undefined; timeline_events.5.title: Invalid input: expected string, received undefined; timeline_events.5.description: Invalid input: expected string, received undefined; timeline_events.6.title: Invalid input: expected string, received undefined; timeline_events.6.description: Invalid input: expected string, received undefined
  Full parsed object:
{
  "name": "Arnav Chandra",
  "bio": "An ECE student in BITS Pilani Goa campus, interested in system design and AI.",
  "achievements": [
    {
      "title": "Built a production-grade, OpenAI-compatible AI gateway",
      "description": "Freeloader — AI Inference Resilience Gateway"
    },
    {
      "title": "Engineered a fully autonomous B2B lead generation pipeline",
      "description": "Closr — Autonomous B2B Lead Generation Engine"
    },
    {
      "title": "Developed an identity verification pipeline for the creator economy",
      "description": "Closr — Verified Creator Portfolio Builder"
    },
    {
      "title": "Created a Palantir-grade intelligence pipeline for entity resolution",
      "description": "Entity Resolution OSINT Platform"
    },
    {
      "title": "Designed a secure event ticketing ecosystem",
      "description": "ChainSeat — Fraud-Proof Ticketing System"
    }
  ],
  "radar_scores": {
    "impact": 85,
    "consistency": 90,
    "quality": 92,
    "depth": 88,
    "breadth": 80,
    "community": 78
  },
  "timeline_events": [
    {
      "date": "University at Buffalo (2+2)",
      "event": "Education"
    },
    {
      "date": "BITS Pilani, Goa",
      "event": "Education"
    },
    {
      "date": "Built Freeloader — AI Inference Resilience Gateway",
      "event": "Project"
    },
    {
      "date": "Engineered Closr — Autonomous B2B Lead Generation Engine",
      "event": "Project"
    },
    {
      "date": "Developed Closr — Verified Creator Portfolio Builder",
      "event": "Project"
    },
    {
      "date": "Created Entity Resolution OSINT Platform",
      "event": "Project"
    },
    {
      "date": "Designed ChainSeat — Fraud-Proof Ticketing System",
      "event": "Project"
    }
  ],
  "bio_summary": "Arnav Chandra is a BITS Pilani Goa campus ECE student with a passion for system design and AI. He has built a range of innovative projects, including a production-grade AI gateway, a fully autonomous B2B lead generation pipeline, and a secure event ticketing ecosystem. With a strong focus on creating systems that save time, compute, and money, Arnav is a talented developer making a significant impact in the creator economy."
}

══════════════════════════════════════════════════════════════════════
  TEST SUMMARY
══════════════════════════════════════════════════════════════════════

  ✅ PASSED: 15
  ❌ FAILED: 1
  ⚠️  WARNS:  2
  TOTAL:    18
```
