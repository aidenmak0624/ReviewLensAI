# Development Timeline

| Date | Milestone |
|---|---|
| Mar 14 | Received assignment |
| Mar 15 | Day 1 — Planning & research |
| Mar 16 | Day 2 — Progress 1: MVP built and deployed |
| Mar 17 | Day 3 — Progress 2: Enhanced features, testing, landing page |
| Mar 18 | Final polish — README, Loom demo, submission |

**Total active development:** 3 days (Mar 15–17)
**Final polish & submission:** Mar 18
**Total OpenAI API spend:** $1.28

---

## March 14 — Received Assignment

## March 15 (Day 1) — Planning & Research

- Studied assignment requirements and defined scope
- Researched ORM use cases and RAG architecture patterns
- Produced a strategic development blueprint covering system architecture, ingestion pipeline design, dual-layer scope guard approach, testing strategy, and cost model
- Designed Supabase schema (products + reviews tables)
- Planned full tech stack: React + Vite + Supabase + Pinecone + OpenAI + Vercel
- Key decision made before writing any code: dual-layer scope guard (Pinecone namespace isolation + system prompt guardrails)

## March 16 (Day 2) — Progress 1: MVP Build & Deploy

### Foundation

- Scaffolded React + Vite + Tailwind CSS + shadcn/ui project
- Configured Supabase project, ran database migration (products + reviews schema)
- Set up shared Edge Function utilities (OpenAI client, Pinecone client, CORS)

### Ingestion Pipeline

- Built `extract-reviews` Edge Function — GPT-4o function calling for CSV, paste, and URL modes
- Built `embed-reviews` Edge Function — batch text-embedding-3-small → Pinecone upsert per product namespace
- Built ingestion wizard UI — URL tab, CSV drag-drop, paste textarea, review preview table
- Wired full extract → preview → confirm → embed → redirect pipeline

### Product Detail & RAG Chat

- Built Dashboard with stats overview and product card grid
- Built product detail page — Summary tab (stats, rating distribution, sentiment charts), Reviews tab (searchable, filterable, paginated), Chat tab
- Built `chat-rag` Edge Function — embed question → Pinecone topK=8 → GPT-4o SSE streaming
- Implemented dual-layer scope guard — Pinecone namespace isolation + strict system prompt
- Built ChatInterface.jsx — SSE stream consumer, message history, [Review N] citation badges

### Testing & Deploy

- 56 unit tests across 8 test files — all passing
- All 3 Edge Functions deployed to Supabase production
- Frontend deployed to Vercel — full pipeline verified live
- User workflow documented with 11 real-data screenshots

## March 17 (Day 3) — Progress 2: Enhanced Features, Testing & Launch

### Evidence Drawer

- Built EvidenceDrawer.jsx — slide-in panel triggered from chat citation badges and review table rows
- Modified chat-rag to emit `citations_ready` SSE event with full review metadata
- Made [Review N] badges clickable — opens full source review with star rating, verified badge, source badge

### Skill Selector

- Built `_shared/skills.ts` — 7 skill prompt library (General, Features, UI Bugs, Sentiment, SWOT, Pricing, Executive)
- Built SkillSelector.jsx — horizontal scrollable pill row above chat input
- Integrated skill injection into chat-rag Edge Function

### AI Insight Report

- Built `generate-insight` Edge Function — 3-worker sequential agentic pipeline:
  - Worker 1 (Themer): extracts up to 6 MECE themes
  - Worker 2 (FAQ Builder): identifies common friction points
  - Worker 3 (Action Planner): prioritised action items (HIGH / MED / LOW)
- Built InsightReport.jsx — collapsible sections, PDF export via jsPDF, clipboard copy

### Image Ingestion

- Built `extract-image` Edge Function — GPT-4o Vision extracts structured reviews from screenshots
- Added Image upload tab — drag-drop, MIME validation, base64 conversion
- Created Supabase Storage bucket (reviews-media)

### URL Scraping Fix

- Edge Function now fetches actual page HTML server-side
- Strips noise, truncates to 60k chars, sets browser User-Agent
- Works for: Trustpilot, G2, Capterra
- Added Trustpilot and Other to platform dropdown

### Testing & QA

- promptfoo LLM evaluation — 6/6 test cases passing against real Edge Functions
- Test cases cover: complaint extraction, sentiment analysis, scope guard, sarcasm detection, skill output, insight report
- Unit tests: 168/173 passing (5 pre-existing timeouts unrelated to P2)

### Landing Page

- Next.js 14 at `apps/landing/` — Syne + DM Sans, navy + teal colour system
- 8 sections with Framer Motion scroll animations
- Deployed as separate Vercel project

### Documentation

- Cost model and maintenance plan
- P3 roadmap with business intelligence vision
- AI development log
- P2 workflow screenshots and user workflow doc

## March 18 — Final Polish & Submission

- README finalised with full deliverables, architecture, and P3 vision
- Repo reorganised — `development-plan/`, `ai-transcripts/`, `tests/`
- Loom demo recorded and linked
- Submission prepared
- Loom Video recorded and edited
