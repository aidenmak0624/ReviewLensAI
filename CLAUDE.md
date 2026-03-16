# ReviewLens AI — Project Intelligence

> Read this file in full before any task. Every implementation decision must trace
> back to the PRD, architecture, or ADRs documented here.

---

## 1. What This Project Is

ReviewLens AI is a **web-based Review Intelligence Portal** for ORM analysts.
It ingests product reviews from a single public platform (G2, Amazon, Google Maps,
Yelp, Capterra), visualises the data, and lets analysts interrogate it through a
**guardrailed conversational Q&A interface** — the AI never drifts outside the
ingested dataset.

**Live URL:** https://reviewlens.vercel.app
**GitHub:** https://github.com/aidenmak0624/reviewlens-ai
**Owner:** Aiden Mak · March 2026

---

## 2. Tech Stack (Do Not Deviate Without an ADR)

| Layer        | Technology                                        |
|--------------|---------------------------------------------------|
| Frontend     | React + Vite · Tailwind CSS · shadcn/ui           |
| Backend      | Supabase (Postgres + Storage + Edge Functions)    |
| Vector Store | Pinecone — one namespace per product (`product-{uuid}`) |
| LLM          | OpenAI GPT-4o + text-embedding-3-small            |
| Hosting      | Vercel (frontend) · Supabase Cloud (backend)      |
| Cost         | Zero — free-tier services only                    |

**Never introduce a paid service or a new major dependency without flagging it.**

---

## 3. Project Structure

```
reviewlens-ai/
├── src/
│   ├── api/supabaseClient.js           ← shared Supabase client (single instance)
│   ├── components/
│   │   ├── dashboard/                  ← ProductCard, StatsOverview
│   │   ├── ingestion/                  ← CSVUploader, PasteReviews, ReviewPreview
│   │   ├── product/                    ← RatingDistribution, ReviewTable, SentimentChart
│   │   └── chat/                       ← ChatInterface, MessageBubble
│   └── pages/                          ← Dashboard, NewProduct, Product
├── supabase/
│   ├── functions/
│   │   ├── _shared/                    ← openai.ts, pinecone.ts (shared utils)
│   │   ├── extract-reviews/            ← OpenAI fn-calling extraction
│   │   ├── embed-reviews/              ← Pinecone namespace upsert
│   │   └── chat-rag/                   ← RAG retrieval + GPT-4o SSE streaming
│   └── migrations/                     ← products + reviews SQL
├── ai-transcripts/                     ← Full session logs (first-class deliverable)
├── CLAUDE.md                           ← this file
├── README.md
└── .env.example
```

---

## 4. Core Requirements (PRD Contract)

These are non-negotiable. Every feature must serve one of these:

### 4.1 Ingestion Module
- Accept a **target URL** from a public review platform
- **CSV upload** and **paste-text** are first-class paths — not fallbacks
- G2 is the primary platform (anti-bot measures make URL scraping unreliable)
- On completion: show an **Ingestion Summary** panel with:
  - Total reviews ingested + date range
  - Rating distribution bar chart (1–5 stars, % + count)
  - Sentiment breakdown (positive/neutral/negative)
  - Sample review table with search + star-filter
  - Ingestion method badge (URL Scraped / CSV Upload / Pasted) + timestamp

### 4.2 Guardrailed Q&A Interface (Critical — Two-Layer Enforcement)
**Layer 1 — Structural (Pinecone namespace isolation):**
- Every product's reviews live in namespace `product-{uuid}`
- The `chat-rag` Edge Function resolves namespace from Postgres server-side — NEVER from client input
- The model literally cannot retrieve vectors from another product's namespace

**Layer 2 — Instructional (System Prompt):**
- Exact decline script: *"I can only answer questions about {productName}'s {platform} reviews. That information is not available in the ingested review data."*
- Decline: other platforms, competitors, world knowledge, weather, news, coding help
- Cite `[Review N]` for every specific claim

### 4.3 Deployment
- Publicly accessible URL — no login required
- No API keys in browser bundle — all keys in Supabase Edge Function secrets via `Deno.env.get()`

---

## 5. Database Schema (Do Not Modify Without Migration)

```sql
-- products table
create table products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  platform            text,           -- amazon | g2 | google_maps | yelp | capterra
  source_url          text,
  total_reviews       int     default 0,
  average_rating      numeric(3,2) default 0,
  rating_distribution jsonb   default '{"1":0,"2":0,"3":0,"4":0,"5":0}',
  status              text    default 'ingesting', -- ingesting | ready | error
  ingestion_method    text,           -- url_scrape | csv_upload | paste
  pinecone_namespace  text,           -- 'product-{id}'
  created_at          timestamptz default now()
);

-- reviews table
create table reviews (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid references products(id) on delete cascade,
  reviewer_name      text,
  rating             smallint check (rating between 1 and 5),
  review_text        text not null,
  review_date        date,
  verified           boolean default false,
  helpful_count      int default 0,
  pinecone_vector_id text,            -- 'review-{id}'
  created_at         timestamptz default now()
);
```

---

## 6. Edge Function Contracts (API Spec)

### extract-reviews
```
POST /functions/v1/extract-reviews
Body: { mode: "url"|"csv"|"paste", raw_input: string, product_id: uuid }
Response: { reviews: Review[], count: number, extraction_method: "openai_function_calling" }
```

### embed-reviews
```
POST /functions/v1/embed-reviews
Body: { product_id: uuid, namespace: "product-{uuid}", review_ids: uuid[] }
Response: { upserted_count: number, namespace: string, product_status: "ready" }
```

### chat-rag (Streaming SSE)
```
POST /functions/v1/chat-rag
Body: { question: string, product_id: uuid, history: Message[] }
Response: text/event-stream — token-by-token SSE, ends with data: [DONE]
```

---

## 7. Architecture Rules (ADR Outcomes)

### ADR-001: Supabase as Unified Backend
- Chosen because it satisfies: relational DB + file storage + serverless compute + zero cost under one SDK
- Deno Edge Functions: import npm packages via `esm.sh` — not raw npm imports
- Never move to Firebase, PlanetScale, or custom Node without a new ADR

### ADR-002: Full RAG over Simple LLM Call
- Full RAG chosen because: structural scope enforcement, citation support, token cost predictability
- `topK=8` — retrieve 8 review chunks per query; never increase without testing token budget
- Adding 10,000 reviews must not change chat latency or cost

### Hexagonal Architecture
- Core domain logic (RAG retrieval, embedding orchestration) stays inside Edge Functions
- React components call Edge Functions via `supabase.functions.invoke()` only
- OpenAI and Pinecone clients are Outbound Adapters — swappable without touching React

---

## 8. Critical Constraints

| Constraint | Detail |
|---|---|
| **Zero cost** | No paid services — free-tier only always |
| **No user auth** | Publicly accessible, no login |
| **No API keys in browser** | All secrets via `Deno.env.get()` in Edge Functions |
| **Namespace server-side only** | Never resolve from client request payload |
| **Streaming chat** | SSE token-by-token — never polling or full-response callback |
| **No hallucination** | All answers grounded in retrieved review vectors |

---

## 9. What Is Out of Scope (Do Not Build)

- User authentication / login
- Multi-platform tracking per product (one platform per product only)
- Real-time review re-scraping / scheduled jobs
- Paid scraping services (Browserless.io etc.)
- [Review N] inline citation chips (nice-to-have, not in MVP)
- Export to PDF/Markdown
- Sentiment scoring label at ingest time

These are documented "if given more time" items — do not implement during MVP sprint.

---

## 10. Scope Guard Test Cases (Must Pass Before Shipping)

| Query | Expected behaviour |
|---|---|
| "What do Amazon reviews say about this?" | Explicit decline with product + platform name |
| "What's the weather like?" | Explicit decline |
| "Write me a Python script" | Explicit decline |
| "What are the top complaints?" | Grounded answer with [Review N] citations |
| "Summarise the 5-star reviews" | Grounded answer scoped to this product only |
| "What do competitors say?" | Explicit decline |

---

## 11. Before Every Task — Checklist

- [ ] Does this feature exist in the PRD (Section 4 above)?
- [ ] Does this touch the scope guard? If so, test both layers.
- [ ] Am I introducing a new dependency or service? File an ADR first.
- [ ] Are API keys staying server-side only?
- [ ] Does this maintain the Hexagonal architecture boundary?
- [ ] Write the test first (TDD — red → green → refactor).
