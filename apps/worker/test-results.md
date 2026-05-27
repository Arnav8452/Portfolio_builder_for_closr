# Backend Integration Test Results

**Target:** https://portfolio-builder-for-closr.onrender.com
**Time:** 2026-05-27T18:39:33.580Z

```
╔══════════════════════════════════════════════════════════════════════╗
║  CLOSR BACKEND INTEGRATION TEST SUITE                              ║
║  Target: https://portfolio-builder-for-closr.onrender.com                    ║
║  Time:   2026-05-27T18:39:10.565Z                          ║
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
  Response preview: {"id":"chatcmpl-4fa1fca8-7b13-4fc0-980d-168a758c8ffe","object":"chat.completion","created":1779907153,"model":"llama-3.1-8b-instant","choices":[{"index":0,"message":{"role":"assistant","content":"Hello, how are you today?"},"logprobs":null,"finish_reason":"stop"}],"usage":{"queue_time":0.06434275,"p
  ✅ PASS: Authenticated request succeeds with LLM response

══════════════════════════════════════════════════════════════════════
  TEST 3: GitHub Scraper (OAuth API)
══════════════════════════════════════════════════════════════════════

  rawText length: 1237 chars
  rawText preview (first 500):
Name: Arnav Chandra

Bio: An ECE student in BITS Pilani Goa campus, interested in system design and AI.

Company: 

Followers: 3

Total Commits: 0

Top Languages: 

Recent Repositories:
Portfolio_builder_for_closr: Tool 2 for closr ecosystem - Live Portfolio builder for Creators
Arnav8452: 
chain-seat: ChainSeat is a blockchain-powered ticketing platform designed to eliminate fraud and scalping.
entity_resolution_graph_osint: An autonomous, entirely localized, AI-driven Open Source Intelligence 
  payload.source: github_api
  payload.profile.name: Arnav Chandra
  payload.profile.login: Arnav8452
  payload.profile.public_repos: 13
  payload.profile.followers: 3
  payload.repos count: 10
  payload.contributions exists: false
  payload.readme length: 0 chars
  payload.readme preview (first 300):
(empty)
  ✅ PASS: rawText has substantial content
  ✅ PASS: Profile name extracted: Arnav Chandra
  ✅ PASS: Public repos: 13
  ✅ PASS: 10 repos fetched
  ❌ FAIL: Contributions — Missing GraphQL contribution data
  ❌ FAIL: README in rawText — Profile README section missing from rawText sent to LLM
  ⚠️  WARN: README in payload — Empty or missing

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

  Combined raw input length: 1478 chars
  Produced 1 chunks
  Chunk 1: 1460 chars
    Preview: [GITHUB] Name: Arnav Chandra Bio: An ECE student in BITS Pilani Goa campus, interested in system design and AI. Company: Followers: 3 Total Commits: 0...
  ✅ PASS: Produced 1 chunks
  ✅ PASS: All chunks under 6000 char limit
  ✅ PASS: GitHub content preserved in chunks
  Dedup ratio: 98.8% of original
  ✅ PASS: Deduplication working (98.8% of original)

══════════════════════════════════════════════════════════════════════
  TEST 6: Metrics Extraction (extractMetricsFromText)
══════════════════════════════════════════════════════════════════════

  Extracted metrics: {}
  ⚠️  WARN: Metrics — No metrics extracted from raw text

══════════════════════════════════════════════════════════════════════
  TEST 7: LLM Analysis via Live Gateway
══════════════════════════════════════════════════════════════════════

  Sending chunk of 1460 chars to LLM
  Gateway URL: https://portfolio-builder-for-closr.onrender.com/v1/chat/completions
  Gateway status: 200
  Duration: 1573ms
  Provider used: groq
  Model used: llama-3.1-8b-instant
  Input tokens: 629
  Output tokens: 616
  Raw LLM output (first 500):
{
  "name": "Arnav Chandra",
   "bio": "An ECE student in BITS Pilani Goa campus, interested in system design and AI.",
   "achievements": [
      {
         "title": "Creator of ChainSeat: A Blockchain-Powered Ticketing Platform",
         "description": "Eliminated fraud and scalping in ticketing systems."
      },
      {
         "title": "Developer of Freeloader: An OpenAI-Compatible AI Gateway",
         "description": "Maximized free-tier LLM usage with intelligent request cascading and e

  Parsed keys: name, bio, achievements, radar_scores, timeline_events, bio_summary
  ✅ PASS: Zod schema validation passed

  ─── VALIDATED IDENTITY ───
  primary_niche: other
  audience_size_tier: micro
  confidence: 0
  bio_summary: Arnav Chandra is a talented ECE student at BITS Pilani Goa campus, with a passion for system design and AI. He has developed several innovative projects, including ChainSeat, Freeloader, and TradingAg...
  technical_skills: []
  brand_tone: []
  content_format: []
  past_topics: []
  achievements (5):
    • Creator of ChainSeat: A Blockchain-Powered Ticketing Platform: Eliminated fraud and scalping in ticketing systems.
    • Developer of Freeloader: An OpenAI-Compatible AI Gateway: Maximized free-tier LLM usage with intelligent request cascading and enterprise-grade API reliabilit
    • Contributor to TradingAgents: A Multi-Agents LLM Financial Trading Framework: Developed a framework for financial trading using multi-agents and LLMs.
    • Creator of Lead Generator for Closr Ecosystem: Tool 1 of the Closr ecosystem for lead generation.
    • Developer of Portfolio Builder for Closr Ecosystem: Tool 2 for closr ecosystem - Live Portfolio builder for Creators.
  radar_scores: {"impact":80,"consistency":70,"quality":85,"depth":75,"breadth":80,"community":60}
  timeline_events (4):
    • 2023-01-01: Started as an ECE student in BITS Pilani Goa campus
    • 2023-06-01: Created ChainSeat: A Blockchain-Powered Ticketing Platform
    • 2023-09-01: Developed Freeloader: An OpenAI-Compatible AI Gateway
    • 2023-12-01: Contributed to TradingAgents: A Multi-Agents LLM Financial Trading Framework
  ✅ PASS: bio_summary is a meaningful string
  ⚠️  WARN: technical_skills — Only 0 skills
  ✅ PASS: 5 achievements extracted
  ⚠️  WARN: confidence — Low confidence: 0
  ✅ PASS: Radar scores are differentiated (not all 50)

══════════════════════════════════════════════════════════════════════
  TEST SUMMARY
══════════════════════════════════════════════════════════════════════

  ✅ PASSED: 16
  ❌ FAILED: 2
  ⚠️  WARNS:  5
  TOTAL:    23
```
