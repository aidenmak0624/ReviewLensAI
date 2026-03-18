# ReviewLens AI

> AI-powered review intelligence platform. Ingest customer reviews from any source, analyse sentiment and themes, and query your data through a guardrailed RAG chat interface with verifiable, clickable citations.

**Live App:** https://review-lens-ai-five.vercel.app/
**Landing Page:** https://reviewlens-landing.vercel.app/

---

## What It Does

ReviewLens AI turns unstructured customer review data into actionable product intelligence:

1. **Ingest** reviews from CSV upload, paste, URL scraping, or image upload
2. **Analyse** with auto-generated sentiment charts, rating distribution, and an AI Insight Report
3. **Query** through a guardrailed RAG chat — every AI claim is backed by a clickable citation that opens the source review
4. **Explore** with 7 analytical skill modes (Feature Extraction, UI Bug Detection, Sentiment Analysis, Competitor SWOT, Pricing Complaints, Executive Summary)

---

## Architecture

```
[Ingestion]
  CSV / Paste / URL / Image
        │
        ▼
  extract-reviews Edge Fn     extract-image Edge Fn
  (GPT-4o fn-calling)         (GPT-4o Vision)
        │                           │
        └──────────┬────────────────┘
                   ▼
          Supabase Postgres
          (products + reviews)
                   │
                   ▼
          embed-reviews Edge Fn
          (text-embedding-3-small → Pinecone)
          namespace: product-{id}
                   │
        ┌──────────┼──────────────┐
        ▼          ▼              ▼
   [Chat Tab]  [Reviews Tab]  [Insight Tab]
   chat-rag    ReviewTable    generate-insight
   Edge Fn     search/filter  3-worker agentic
   RAG + SSE   pagination     pipeline
   streaming   + Evidence     (Themes → FAQs
               Drawer         → Actions)
```

**Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui |
| Landing Page | Next.js 14 + Framer Motion |
| Backend | Supabase Edge Functions (Deno + TypeScript) |
| Database | Supabase Postgres |
| Vector Store | Pinecone (1536d cosine, text-embedding-3-small) |
| AI | OpenAI GPT-4o (chat, vision, extraction) |
| Deployment | Vercel (frontend + landing) + Supabase (backend) |

---

## Key Design Decisions

### Dual-Layer Scope Guard
The RAG chat enforces topic isolation through two independent layers:

- **Layer 1 — Structural:** Pinecone namespace isolation. Each product gets its own namespace (`product-{uuid}`). The Edge Function resolves the namespace server-side from Postgres — the client never touches it directly. The model can only retrieve vectors from the correct product's namespace.
- **Layer 2 — Instructional:** The system prompt enforces 5 strict rules — decline off-topic questions, decline questions about other platforms or general world knowledge, ground every claim in retrieved review chunks, cite every factual statement with `[Review N]`.

This means the guard works even if the instructional layer is bypassed — the structural layer still prevents cross-product data leakage.

### Streaming Citations
The `chat-rag` Edge Function streams the GPT-4o response token-by-token via SSE, then emits a final `citations_ready` event containing the full review metadata for every cited review. The frontend intercepts `[Review N]` markers in the stream and replaces them with clickable badges. Clicking a badge opens the `EvidenceDrawer` — a slide-in panel showing the complete source review, star rating, verified status, and source badge.

### Agentic Insight Pipeline
The `generate-insight` Edge Function runs three sequential GPT-4o worker calls:
1. **Themer** — extracts up to 6 MECE themes from all ingested reviews
2. **FAQ Builder** — identifies the most common friction points and user questions
3. **Action Planner** — translates themes and FAQs into prioritised product actions (high/med/low)

Each worker receives the previous worker's output as input. The final report is downloadable as PDF via jsPDF.

### URL Scraping — Honest Tradeoffs
The URL tab fetches the target page server-side in the Edge Function, strips noise tags (`<script>`, `<style>`, `<nav>`), truncates to 60k chars, and passes the HTML to GPT-4o for extraction. This works well for server-rendered platforms (Trustpilot, G2, Capterra). Amazon and Google Maps use heavy anti-bot protection and dynamic JS rendering — for these, CSV upload or paste is the recommended path. This is clearly communicated to the user in the UI.

---

## Setup

### Prerequisites
- Node.js 20+
- Supabase CLI (`npm install -g supabase`)
- A Supabase project
- A Pinecone account with a 1536-dimension cosine index named `reviewlensai`
- An OpenAI API key

### 1. Clone and install
```bash
git clone https://github.com/aidenmak0624/ReviewLensAI.git
cd ReviewLensAI
npm install
```

### 2. Environment variables
```bash
cp .env.example .env
```

Fill in `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Set Supabase Edge Function secrets:
```bash
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase secrets set PINECONE_API_KEY=your_pinecone_key
supabase secrets set PINECONE_INDEX=reviewlensai
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SUPABASE_STORAGE_BUCKET=reviews-media
```

### 3. Database
```bash
supabase db push
```

### 4. Deploy Edge Functions
```bash
supabase functions deploy extract-reviews
supabase functions deploy extract-image
supabase functions deploy embed-reviews
supabase functions deploy chat-rag
supabase functions deploy generate-insight
```

### 5. Run locally
```bash
npm run dev
# App available at http://localhost:5174
```

### Landing page (optional)
```bash
cd apps/landing
npm install
npm run dev
# Landing page at http://localhost:3000
```

---

## Testing

### Unit tests (Vitest)
```bash
npm run test
# 168/173 passing
# 5 pre-existing timeout failures in NewProduct rendering — unrelated to core features
```

### LLM Evaluation (promptfoo)
```bash
npm install -g promptfoo
npx promptfoo eval --config tests/promptfoo/promptfooconfig.yaml
# 6/6 test cases passing
```

Test cases cover: complaint extraction with citations, sentiment analysis, scope guard enforcement, sarcasm detection, skill selector output format, and insight report structure.

### Manual E2E Testing
Full end-to-end workflow documented with screenshots in `development-plan/screenshots/progress_2/workflow_demo/` and written up in `development-plan/progress_2/USER_WORKFLOW_P2.md`.

The E2E test covers the complete user journey:

| Step | What is verified |
|---|---|
| CSV ingest | Upload → AI extraction → preview table → confirm → product page |
| URL scrape | Trustpilot URL → server-side fetch → GPT-4o extraction → 68 reviews ingested |
| Image upload | Screenshot → GPT-4o Vision → structured review extraction |
| Summary tab | Stats tiles, rating distribution chart, sentiment breakdown |
| Reviews tab | Search, star filter pills, pagination, row click → Evidence Drawer |
| Chat tab | Question → SSE stream → `[Review N]` badges → click → Evidence Drawer |
| Scope guard | Off-topic question → explicit decline with correct message |
| Skill selector | Switch to UI Bugs / Sentiment / Executive → response format changes |
| Insight Report | Generate → 3-step loading → Themes + FAQs + Actions rendered → PDF download |

---

## Assumptions Made

- **No authentication** — RLS is set to public read/write. Multi-tenant auth is a P3 feature. For the assignment scope, a single shared workspace is sufficient.
- **Single-page scraping** — URL scraper fetches page 1 only. Full pagination (5+ pages) is a known P3 improvement.
- **PDF ingestion deferred** — Image upload covers screenshots. Full PDF OCR pipeline is documented in the P3 roadmap.
- **Supabase free tier** — Project may pause after 7 days of inactivity. Visit the app or restore via the Supabase dashboard if it appears offline.

---

## What I'm Proud Of

- The dual-layer scope guard — it's architecturally correct, not just a prompt hack
- The `citations_ready` SSE event pattern — clean separation between streaming text and metadata
- The agentic insight pipeline — each worker has a tightly scoped task and output schema
- 6/6 LLM eval tests passing with real Edge Function calls, not mocks

### What I'd Do Differently With More Time

- Add user authentication (currently public RLS — fine for demo, not for multi-tenant production)
- PDF ingestion with page-level citations and OCR fallback
- URL scraper pagination — currently fetches page 1 only, would extend to pages 1–5 for full corpus
- Multi-file upload — currently accepts one CSV or one image at a time; would support batch upload for bulk ingestion
- Expand AI Insight Report — add confidence scoring, custom templates, and executive one-pager mode

### P3 Vision — Business Intelligence

**Ingestion**
- PDF ingestion — upload research reports, support tickets, enterprise feedback documents with page-level citations
- URL scraper pagination — ingest full review corpus across all pages, not just page 1
- Multi-file batch upload — drag in 10 CSVs at once

**Deeper Business Analysis**
- Sentiment trend over time (weekly/monthly tracking)
- Feature request prioritisation matrix (frequency × sentiment intensity)
- Competitor benchmarking — compare your product vs competitors side by side
- NPS estimation from review language
- ROI calculator — estimate revenue impact of fixing top complaints

**Integrations**
- Push action items directly to Slack / Jira
- Scheduled weekly insight report delivered via email

**Multi-Model Support (at scale)**
- Model routing — Claude Haiku for simple scope guard checks, GPT-4o only for complex reasoning and vision (significant cost reduction at scale)
- User-selectable models — choose between OpenAI, Anthropic Claude, or Google Gemini for analysis
- Gemini embeddings — evaluate text-embedding-004 as a cost-effective alternative to text-embedding-3-small for high-volume ingestion

---

## Project Structure

```
ReviewLensAI/
├── src/                    # React + Vite main app
├── apps/landing/           # Next.js 14 landing page
├── supabase/functions/     # Supabase Edge Functions (Deno)
├── supabase/migrations/    # Postgres schema
├── test/                   # Vitest unit tests
├── tests/promptfoo/        # LLM evaluation matrix
├── development-plan/       # Progress docs + screenshots
├── ai-transcripts/         # Claude Code session logs
├── CLAUDE.md               # AI agent instructions
└── README.md               # This file
```

---

## Deliverables

| # | Deliverable | Link |
|---|---|---|
| 1 | GitHub Repository | https://github.com/aidenmak0624/ReviewLensAI |
| 2 | AI Session Transcripts | `/ai-transcripts/` directory in this repo |
| 3 | Live Application | https://review-lens-ai-five.vercel.app/ |
| 4 | Loom Demo | *(link to be added)* |
| 5 | README | This file |
