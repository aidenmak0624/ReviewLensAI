# ReviewLens AI — Development Progress

> Auto-updated as each phase/task completes.

---

## Phase 0: Foundation
- [x] Scaffold React + Vite project with Tailwind CSS, shadcn/ui, react-router-dom, recharts, papaparse
- [x] Create Supabase project config + migration SQL for `products` + `reviews` tables
- [x] Create `_shared/openai.ts` + `pinecone.ts` Edge Function utility modules
- [x] Create `src/api/supabaseClient.js` — single Supabase client instance
- [x] Create `Layout.jsx` with top nav + route setup (`/`, `/new`, `/product`)
- [ ] Verify Vercel deployment with blank app

## Phase 1: Ingestion Module
### 1A: NewProduct Page UI
- [x] `NewProduct.jsx` — product name + platform dropdown + three-tab layout (URL / CSV / Paste)
- [x] `CSVUploader.jsx` — drag-drop zone with papaparse, file validation, clear button
- [x] `PasteReviews.jsx` — textarea input with character count
- [x] `ReviewPreview.jsx` — editable table with star display, row delete, confirm button

### 1B: extract-reviews Edge Function
- [x] `POST /functions/v1/extract-reviews` — CSV mode (OpenAI fn-calling with save_reviews tool)
- [x] Paste mode (OpenAI fn-calling on raw text)
- [x] URL mode (HTML content → fn-calling, graceful fallback)
- [x] Insert Product + Reviews into Postgres, compute rating_distribution + average_rating

### 1C: embed-reviews Edge Function
- [x] `POST /functions/v1/embed-reviews` — batch embed via text-embedding-3-small + Pinecone upsert
- [x] Update `pinecone_vector_id` per review + set `product.status = 'ready'`
- [x] Error handling: sets product status to 'error' on failure

### 1D: Frontend Integration
- [x] Wire Extract → Preview → Confirm → Save to DB → Embed → redirect to product page
- [x] Loading states (spinner during extraction, saving overlay during ingestion)
- [x] Error banner with message display
- [x] Step flow: input → preview (with back button) → saving → redirect

## Phase 2: Product Detail Page
- [x] `Product.jsx` — tabbed layout (Summary / Reviews / Chat)
- [ ] `IngestionSummary.jsx` — method badge, timestamp, total reviews, date range
- [ ] `RatingDistribution.jsx` — horizontal bar chart (1-5 stars) with Recharts
- [ ] `SentimentChart.jsx` — positive/neutral/negative stacked bar
- [ ] `ReviewTable.jsx` — search + star-filter + pagination

## Phase 3: RAG Chat Interface
### 3A: chat-rag Edge Function
- [ ] Server-side namespace resolution from Postgres
- [ ] Embed question → Pinecone topK=8 retrieval → context assembly
- [ ] Guardrailed system prompt with 5 rules
- [ ] GPT-4o streaming via ReadableStream → SSE

### 3B: Chat Frontend
- [ ] `ChatInterface.jsx` — input bar + message list + SSE stream consumer
- [ ] `MessageBubble.jsx` — user/assistant styling + typing indicator
- [ ] Multi-turn conversation history
- [ ] `[Review N]` citation highlighting

### 3C: Scope Guard Verification
- [ ] Test all 6 scope guard queries from CLAUDE.md §10
- [ ] Verify namespace resolved server-side only

## Phase 4: Dashboard
- [x] `Dashboard.jsx` — product grid + "Add Product" CTA
- [x] `StatsOverview.jsx` — aggregate tiles (total products, reviews, avg rating)
- [x] `ProductCard.jsx` — name, platform badge, review count, rating, status
- [x] Empty state with illustration + CTA

## Phase 5: Polish & Deploy
- [x] Responsive design (mobile-friendly) — built into components from start
- [ ] Loading skeletons + toast notifications
- [ ] Product deletion with Pinecone namespace cleanup
- [x] Error handling in Edge Functions (extract-reviews, embed-reviews)
- [ ] Final deployment: `supabase db push` → deploy functions → `vercel --prod`
- [x] `.env.example` with placeholder keys

---

## Progress Log

| Date | Phase | Task | Status |
|------|-------|------|--------|
| 2026-03-16 | 0 | Scaffold React + Vite + Tailwind CSS + dependencies | DONE |
| 2026-03-16 | 0 | Database migration SQL (products + reviews) | DONE |
| 2026-03-16 | 0 | Edge Function shared utilities (openai, pinecone, supabase, cors) | DONE |
| 2026-03-16 | 0 | Supabase client + .env.example | DONE |
| 2026-03-16 | 0 | Layout + routing (/, /new, /product) | DONE |
| 2026-03-16 | 0 | PostCSS + Tailwind v4 config | DONE |
| 2026-03-16 | 0 | Test suite: 56 tests across 8 files — all passing | DONE |
| 2026-03-16 | 1A | CSVUploader.jsx — drag-drop, file validation, Papa.parse, clear | DONE |
| 2026-03-16 | 1A | PasteReviews.jsx — textarea with character count | DONE |
| 2026-03-16 | 1A | ReviewPreview.jsx — table with stars, row delete, confirm button | DONE |
| 2026-03-16 | 1B | extract-reviews Edge Function — full OpenAI fn-calling pipeline | DONE |
| 2026-03-16 | 1B | CSV/paste/URL modes with intelligent column mapping | DONE |
| 2026-03-16 | 1B | Postgres insert + rating stats computation | DONE |
| 2026-03-16 | 1C | embed-reviews Edge Function — batch embed + Pinecone upsert | DONE |
| 2026-03-16 | 1C | pinecone_vector_id update + product status management | DONE |
| 2026-03-16 | 1D | NewProduct.jsx full rewrite — 3-step flow with state management | DONE |
| 2026-03-16 | 1D | Extract → Preview → Confirm → Embed → redirect pipeline | DONE |
| 2026-03-16 | 1 | All 56 tests passing after Phase 1 changes | DONE |
| 2026-03-16 | 4 | Dashboard.jsx with StatsOverview + ProductCard + empty state | DONE |
| 2026-03-16 | 2 | Product.jsx with tabbed layout (Summary/Reviews/Chat) | DONE |

---

## Files Created/Modified in Phase 1

```
src/components/ingestion/
├── CSVUploader.jsx          ← drag-drop CSV with Papa.parse
├── PasteReviews.jsx         ← textarea with character count
├── ReviewPreview.jsx        ← editable review table + confirm button
src/pages/
├── NewProduct.jsx           ← rewritten with 3-step flow + state mgmt
supabase/functions/
├── extract-reviews/index.ts ← full OpenAI fn-calling extraction
├── embed-reviews/index.ts   ← batch embedding + Pinecone upsert
```
