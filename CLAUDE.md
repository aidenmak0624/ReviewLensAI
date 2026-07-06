# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read this entire file at the start of every session before writing a single line of code.**

---

## Project Identity

ReviewLens AI is a full-stack AI SaaS that ingests customer reviews from multiple sources, generates vector embeddings, and enables guardrailed RAG chat with verifiable, clickable citations.

| | |
|---|---|
| **Live URL** | https://review-lens-ai-five.vercel.app/ |
| **Frontend** | React 19 + Vite 8 + Tailwind CSS 4 (`@tailwindcss/postcss`) — shadcn-style custom components with `cn()`; the shadcn/ui package is NOT installed |
| **Landing Page** | Next.js 14 + React 18 + Framer Motion — separate package in `apps/landing/` |
| **Backend** | Supabase (Postgres + Edge Functions + Storage) |
| **Vector DB** | Pinecone (`reviewlensai` index, 1536d cosine) |
| **AI** | OpenAI GPT-4o (chat / vision) + text-embedding-3-small (embeddings) |
| **Deploy** | Vercel (frontend) + Supabase (Edge Functions) |

---

## Phase Map

| Phase | Status | Tracker |
|---|---|---|
| **Progress_1** — MVP (ingestion → embedding → RAG chat) | ✅ COMPLETE | `development-plan/progress_1/PROGRESS_1.md` |
| **Progress_2** — Evidence drawer, skills, insight report | ✅ COMPLETE (92/92 tasks, manual report 20/20) | `development-plan/progress_2/PROGRESS_2.md` |
| **Test Plan** | ✅ Written | `development-plan/docs/TEST_PLAN.md` |
| **Landing Page** | ✅ SHIPPED — `apps/landing/` | Spec: `development-plan/docs/ReviewLens_Landing_Page_Spec.md` |
| **Cost Estimation** | ✅ Written | `development-plan/docs/ReviewLens_Cost_Estimation.md` + `ReviewLens_Cost_and_Maintenance.md` |
| **Progress_3** — auth + per-user rate limiting | 🔄 ACTIVE (code complete, deploy pending) | `development-plan/progress_3/PROGRESS_3.md` |

---

## Session Rules — Non-Negotiable

### Rule 1 — Audit First, Code Second
Run this at the start of **every** session. Report results before touching any file:
```bash
npm run test        # must be all green — 188/188 as of 2026-07-06
git status          # must be clean working tree
```

### Rule 2 — One Task at a Time
P1 and P2 trackers are fully checked — new work comes from the user's request or a future P3 tracker. Work one task at a time: complete it fully, run tests, mark it done in the active tracker, only then move on.

### Rule 3 — Definition of Done
A task is **DONE** only when all four are true:
- Code written and saved
- `npm run test` — all tests green
- Feature verified in browser (manual spot check)
- Checkbox in `PROGRESS_2.md` marked `[x]`

### Rule 4 — Update Progress Immediately
Mark tasks done the moment they complete. Never batch-update at session end.

### Rule 5 — Stop and Ask If…
- Any previously-passing test now fails after your change
- You need a destructive DB operation (`DROP`, `TRUNCATE`)
- An Edge Function deployment fails with a secret/auth error
- The Pinecone index needs rebuilding or a namespace deletion
- You are unsure which task comes next

### Rule 6 — No Secrets in Code
All API keys via environment variables only. Never hardcode.

---

## Repo Structure

```
ReviewLensAI/
├── .claude/
│   ├── launch.json                       # Dev server config (runs Vite with --port 5174)
│   ├── settings.local.json
│   └── skills/                           # Local Claude Code skills
├── .env / .env.example
├── CLAUDE.md                             # ← THIS FILE
├── README.md                             # Assignment README — live URLs, setup, P3 vision
│
├── src/
│   ├── main.jsx
│   ├── App.jsx                           # Router setup
│   ├── index.css                         # Tailwind base + CSS design tokens
│   ├── api/
│   │   └── supabaseClient.js             # Shared Supabase client instance
│   ├── lib/
│   │   └── utils.js                      # cn() helper
│   ├── components/
│   │   ├── Layout.jsx                    # App shell — navbar + <Outlet>
│   │   ├── dashboard/                    # EMPTY — leftover directory
│   │   ├── chat/
│   │   │   ├── ChatInterface.jsx         # SSE stream consumer + message state
│   │   │   ├── MessageBubble.jsx         # Bubbles + [Review N] citation badges
│   │   │   ├── SkillSelector.jsx         # NEW P2 — 7-skill scrollable pill row
│   │   │   └── EvidenceDrawer.jsx        # NEW P2 — slide-in review detail panel
│   │   ├── ingestion/
│   │   │   ├── CSVUploader.jsx           # Drag-drop CSV + papaparse
│   │   │   ├── PasteReviews.jsx          # Textarea + char counter
│   │   │   └── ReviewPreview.jsx         # Editable preview table before confirm
│   │   └── product/
│   │       ├── IngestionSummary.jsx      # Stats tiles + Recharts bar/pie
│   │       ├── RatingDistribution.jsx    # 1–5 star horizontal bar chart
│   │       ├── ReviewTable.jsx           # Searchable / filterable / paginated table
│   │       ├── SentimentChart.jsx        # Emoji cards + stacked bar
│   │       └── InsightReport.jsx         # NEW P2 — 3-section collapsible report
│   └── pages/
│       ├── Dashboard.jsx                 # Stats overview + product card grid
│       ├── NewProduct.jsx                # 3-step ingestion wizard
│       └── Product.jsx                   # Detail page (Summary / Reviews / Chat / Insight tabs)
│
├── apps/
│   └── landing/                          # Next.js 14 landing page — SEPARATE package (own package.json; cd in, npm install, npm run dev → port 3000)
│
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── cors.ts                   # CORS headers — import in every Edge Function
│   │   │   ├── openai.ts                 # OpenAI client wrapper
│   │   │   ├── pinecone.ts               # Pinecone client wrapper
│   │   │   ├── supabase.ts               # Supabase admin client
│   │   │   └── skills.ts                 # NEW P2 — SKILL_PROMPTS export
│   │   ├── extract-reviews/index.ts      # GPT-4o fn-calling: CSV / paste / URL
│   │   ├── embed-reviews/index.ts        # Batch embed → Pinecone upsert
│   │   ├── chat-rag/index.ts             # RAG retrieval + GPT-4o SSE stream
│   │   ├── extract-image/index.ts        # NEW P2 — GPT-4o vision extraction
│   │   └── generate-insight/index.ts     # NEW P2 — 3-worker agentic orchestrator
│   └── migrations/
│       ├── 001_create_tables.sql         # P1 schema (products + reviews)
│       └── 002_multimodal_columns.sql    # NEW P2 — source_modality, spatial_metadata
│
├── development-plan/
│   ├── docs/                             # TEST_PLAN.md · TIMELINE.md · cost docs · landing spec · architecture · prompt library
│   ├── progress_1/
│   │   ├── PROGRESS_1.md                 # P1 tracker (complete)
│   │   └── USER_WORKFLOW_P1.md
│   ├── progress_2/
│   │   ├── PROGRESS_2.md                 # P2 tracker (complete — 92/92)
│   │   ├── PROGRESS2_PLAN.md
│   │   ├── P2_MANUAL_TEST_REPORT.md      # Manual test report (20/20 pass)
│   │   └── USER_WORKFLOW_P2.md           # P2 user workflows
│   └── screenshots/                      # progress_0 / progress_1 / progress_2
│
├── LLMtests/
│   └── promptfoo/promptfooconfig.yaml    # promptfoo LLM eval matrix (6 cases)
├── ai-transcripts/                       # Claude Code session logs (deliverable)
│
├── test/
│   ├── setup.js
│   ├── fixtures/                         # Test data (large_reviews.csv, medium_reviews.csv)
│   ├── progress_1/                       # Foundation + ingestion tests (13 files)
│   └── progress_2/                       # P2 tests (10 files)
```

---

## Architecture Flow

```
[NewProduct.jsx — User Input]
        │
        ├── CSV / Paste / URL ──► extract-reviews (GPT-4o fn-calling)
        └── Image / PDF       ──► extract-image   (GPT-4o vision)        [P2]
                                          │
                                  Supabase Postgres
                             products + reviews tables
                        (P2 adds: source_modality, spatial_metadata)
                                          │
                                  embed-reviews
                            text-embedding-3-small → Pinecone
                                (namespace: product-{id})
                                          │
              ┌───────────────────────────┼───────────────────────┐
              │                           │                       │
        [Chat Tab]                [Reviews Tab]          [Insight Tab]    [P2]
      chat-rag Edge Fn             ReviewTable.jsx       generate-insight
      embed Q → Pinecone           search / filter         Worker 1: Themes
      topK=8 → GPT-4o SSE         pagination               Worker 2: FAQs
      skill injection [P2]                                 Worker 3: Actions
              │                           │
      citations_ready ─────────────────── ┘
      SSE event [P2]                      │
                                   EvidenceDrawer.jsx [P2]
                          Triggered from: chat badge click OR table row click
                          Renders: full review text, stars, verified badge,
                                   source badge, helpful count
```

---

## Supabase Schema

### `products` table
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | |
| platform | TEXT | `amazon` / `g2` / `yelp` / `google_maps` / `capterra` / `trustpilot` |
| source_url | TEXT | Original listing URL |
| status | TEXT | `ingesting` → `ready` → `error` |
| average_rating | FLOAT | Computed on ingestion |
| rating_distribution | JSONB | `{1: n, 2: n, 3: n, 4: n, 5: n}` |
| ingestion_method | TEXT | `csv` / `paste` / `url` / `image` |
| total_reviews | INTEGER | Computed on ingestion |
| user_id | UUID FK | **P3** — → auth.users.id; NULL = public demo product (read-only for everyone) |
| created_at | TIMESTAMPTZ | |

### `reviews` table
| Column | Type | Phase | Notes |
|---|---|---|---|
| id | UUID PK | P1 | |
| product_id | UUID FK | P1 | → products.id |
| reviewer_name | TEXT | P1 | |
| rating | INTEGER | P1 | 1–5 |
| review_text | TEXT | P1 | Primary embedding payload |
| review_date | DATE | P1 | |
| verified | BOOLEAN | P1 | Verified purchase flag |
| helpful_count | INTEGER | P1 | Helpful vote count |
| pinecone_vector_id | TEXT | P1 | Pinecone upsert ID |
| source_modality | TEXT | **P2** | `csv` / `paste` / `url` / `image` |
| source_file_name | TEXT | **P2** | Original filename or Supabase Storage URL |
| spatial_metadata | JSONB | **P2** | Bounding box `{x, y, width, height}` for highlight overlay |
| created_at | TIMESTAMPTZ | P1 | |

### `usage_counters` table (P3)
| Column | Type | Notes |
|---|---|---|
| user_id | UUID FK | → auth.users.id, part of PK |
| action | TEXT | `chat` / `ingest` / `insight`, part of PK |
| day | DATE | UTC day, part of PK |
| count | INTEGER | Incremented atomically via `increment_usage()` RPC (service-role only) |

**Auth & rate limiting (P3):** Whole app behind Supabase email+password login. RLS (migration 004): users see their own products + NULL-owner demo products. Edge Functions validate the caller's JWT via `_shared/auth.ts` (`requireUser`) and enforce per-user daily quotas via `_shared/ratelimit.ts` — chat 50/day, ingest 5/day, insight 10/day → HTTP 429 `{ error: "RATE_LIMITED", message }`.

---

## P2 Component Reference

### SkillSelector.jsx
Horizontal scrollable pill row rendered **above the chat input** in `ChatInterface.jsx`.
Switching skill resets the conversation so a fresh context injection fires on the next send.

| Key | Label | Prompt Directive |
|---|---|---|
| `general` | 💬 General | No injection — default behavior |
| `feature_extraction` | 🔧 Features | Extract requested/praised features by frequency & urgency |
| `ui_bug_detection` | 🐛 UI Bugs | Focus on interface friction, broken flows, exact error quotes |
| `sentiment_analysis` | 😤 Sentiment | Classify: Aggressive / Frustrated / Neutral / Satisfied / Evangelist |
| `competitor_swot` | ⚔️ SWOT | Build SWOT matrix from competitor mentions in reviews |
| `pricing_complaints` | 💰 Pricing | Isolate price / cost / value / refund mentions |
| `executive_summary` | 📋 Executive | Top 3 insights, non-technical, max 200 words |

### EvidenceDrawer.jsx
Fixed right-side panel (`z-50`) with semi-transparent backdrop (`z-40`).

**Two trigger sources:**
1. Clicking a `[Review N]` badge in `MessageBubble.jsx`
2. Clicking a row in `ReviewTable.jsx`

**Renders:** reviewer name · visual star rating · review date · verified badge · source badge (`CSV` / `Paste` / `Image`) · full `review_text` · helpful count

**Close:** Escape key · backdrop click · × button

### InsightReport.jsx — Agentic 3-Worker Pipeline
```
POST /functions/v1/generate-insight  { product_id }
        │
        ├── Worker 1 — Themer
        │   Input:  ≤80 reviews (rating + name + text)
        │   Output: { themes: [{ theme, summary }] }          max 6 themes
        │
        ├── Worker 2 — FAQ Builder
        │   Input:  Worker 1 themes + ≤60 review texts
        │   Output: { faqs: [{ question, answer }] }          max 8 items
        │
        └── Worker 3 — Action Planner
            Input:  Themes + FAQs from Workers 1 & 2
            Output: { actions: [{ action, priority, rationale }] }  max 10 items
                    priority: 'high' | 'med' | 'low'
```

**UI:** 3 collapsible section cards — Evidence & Themes / FAQ & Friction Points / Action Items
**Exports:** jsPDF download · clipboard copy of action items checklist

---

## Environment Variables

```bash
# .env — frontend (VITE_ prefix required for Vite browser exposure)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Supabase Edge Function secrets (set via: supabase secrets set KEY=value)
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=reviewlensai
SUPABASE_SERVICE_ROLE_KEY=        # admin operations inside Edge Functions

# P2 additions
STORAGE_BUCKET=reviews-media      # read by extract-image, defaults to reviews-media (NOTE: README says SUPABASE_STORAGE_BUCKET — that name is wrong, the code reads STORAGE_BUCKET)
```

---

## Key Commands

```bash
# Development
npm run dev                            # Vite dev server — port 5173 by default (.claude/launch.json uses --port 5174)
npm run build                          # Production build
npm run lint                           # ESLint (flat config)
cd apps/landing && npm run dev         # Landing page (separate package) — port 3000

# Testing — run after EVERY task
npm run test                           # Vitest single pass (`vitest run`) — see Rule 1 for known-failing baseline
npx vitest                             # Watch mode (NOT `npm run test -- --watch` — that expands to `vitest run --watch`)
npx vitest run test/progress_2/SkillSelector.test.jsx   # Run a single test file
npm run test -- --coverage             # Coverage report

# Supabase Edge Functions
supabase functions serve               # Local Edge Function dev
supabase functions deploy extract-reviews
supabase functions deploy embed-reviews
supabase functions deploy chat-rag
supabase functions deploy extract-image       # P2
supabase functions deploy generate-insight    # P2
supabase db push                       # Apply pending migrations
supabase secrets set KEY=value         # Set Edge Function environment secret

# LLM evaluation — hits the DEPLOYED Edge Functions, not mocks
npx promptfoo eval --config LLMtests/promptfoo/promptfooconfig.yaml
```

---

## Coding Standards

| Concern | Standard |
|---|---|
| Components | Functional React + hooks. No class components. |
| Styling | Tailwind CSS 4 utilities (`@tailwindcss/postcss`) + shadcn-style custom components. Use `cn()` from `src/lib/utils.js`. The shadcn/ui package is not installed — don't import from it. |
| Animations | Framer Motion for EvidenceDrawer slide-in. CSS transitions for hover states. |
| Edge Functions | TypeScript. Always `import cors from '../_shared/cors.ts'`. Wrap in try/catch. |
| Error handling | Every Edge Fn: `return new Response(JSON.stringify({ error: msg }), { status: 4xx/5xx })` |
| PDF export | `jsPDF` client-side for InsightReport download. |
| Secrets | Environment variables only. Never hardcode. |
| Tests | Vitest test for every new component and every new Edge Function utility added in P2. |

---

## Session Checklist

```
[ ] Read CLAUDE.md — confirm you understand the stack, schema, and P2 component specs
[ ] npm run test     → all green (188/188)
[ ] git status       → clean
[ ] Identify the active task (P1 & P2 complete — check PROGRESS_3.md for P3 state)
[ ] Confirm task with user before starting
[ ] After task: mark done in tracker → run tests → confirm no new failures → stop
```
