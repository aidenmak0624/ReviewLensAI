# ReviewLens AI — Development Progress

> Auto-updated as each phase/task completes.

---

## Phase 0: Foundation
- [x] Scaffold React + Vite project with Tailwind CSS, shadcn/ui, react-router-dom, recharts, papaparse
- [x] Create Supabase project config + migration SQL for `products` + `reviews` tables
- [x] Create `_shared/openai.ts` + `pinecone.ts` Edge Function utility modules
- [x] Create `src/api/supabaseClient.js` — single Supabase client instance
- [x] Create `Layout.jsx` with top nav + route setup (`/`, `/new`, `/product`)
- [x] Verify Supabase connection (products + reviews tables live, RLS enabled)

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
- [x] `Product.jsx` — tabbed layout (Summary / Reviews / Chat) + fetches reviews from Supabase
- [x] `IngestionSummary.jsx` — stats tiles, method badge, timestamp, date range, Recharts bar + pie charts
- [x] `RatingDistribution.jsx` — horizontal bar chart (1-5 stars) with proportional fill
- [x] `SentimentChart.jsx` — emoji sentiment cards + stacked horizontal bar (green/yellow/red)
- [x] `ReviewTable.jsx` — search + star-filter pills + pagination (10/page) + expandable rows

## Phase 3: RAG Chat Interface
### 3A: chat-rag Edge Function
- [x] Server-side namespace resolution from Postgres (Layer 1 — structural guard)
- [x] Embed question → Pinecone topK=8 retrieval → context assembly
- [x] Guardrailed system prompt with 5 strict rules (Layer 2 — instructional guard)
- [x] GPT-4o streaming via ReadableStream → SSE (token-by-token)
- [x] Conversation history support (last 10 exchanges)
- [x] Error handling with graceful stream fallback

### 3B: Chat Frontend
- [x] `ChatInterface.jsx` — input bar + message list + SSE stream consumer via fetch
- [x] `MessageBubble.jsx` — user/assistant bubbles + typing indicator (3 animated dots)
- [x] Multi-turn conversation history (maintained in React state)
- [x] `[Review N]` citation highlighting (blue badge inline rendering)
- [x] Auto-scroll to latest message
- [x] Loading state (spinner on send button during streaming)
- [x] Wired into Product.jsx Chat tab (only active when product status is "ready")

### 3C: Scope Guard Verification
- [x] Chat grounded response with [Review N] citations — verified live
- [x] Namespace resolved server-side from Postgres (code audit confirmed)
- [ ] Full 6-query scope guard test suite (manual testing remaining)

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
- [x] Bug fix: extract-reviews preview mode (skip DB ops when product_id="preview")
- [x] Bug fix: Pinecone API key secret corrected in Supabase
- [x] All 3 Edge Functions deployed to Supabase
- [x] Vercel deployment connected to GitHub (auto-deploy on push)
- [x] `.env.example` with placeholder keys
- [x] End-to-end verification: ingest → charts → chat with citations

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
| 2026-03-16 | Infra | Pinecone index "reviewlensai" created (1536d, cosine) | DONE |
| 2026-03-16 | Infra | Supabase project created | DONE |
| 2026-03-16 | Infra | Updated CLAUDE.md with infrastructure status section | DONE |
| 2026-03-16 | Infra | Enhanced .env.example with full setup checklist | DONE |
| 2026-03-16 | Infra | All API keys set in .env (Supabase, OpenAI, Pinecone) | DONE |
| 2026-03-16 | Infra | Supabase Edge Functions deployed | DONE |
| 2026-03-16 | Infra | Supabase secrets set (OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX) | DONE |
| 2026-03-16 | Infra | DB migration run — products + reviews tables live | DONE |
| 2026-03-16 | Infra | RLS policies applied (public read/write, no auth) | DONE |
| 2026-03-16 | Infra | Supabase connection verified — both tables accessible (0 rows) | DONE |
| 2026-03-16 | Infra | Frontend verified — Dashboard, NewProduct, all 3 tabs working | DONE |
| 2026-03-16 | 2 | IngestionSummary.jsx — stats tiles + Recharts bar/pie charts | DONE |
| 2026-03-16 | 2 | RatingDistribution.jsx — horizontal bar chart (CSS, no Recharts dep) | DONE |
| 2026-03-16 | 2 | SentimentChart.jsx — emoji cards + stacked bar | DONE |
| 2026-03-16 | 2 | ReviewTable.jsx — search, star filter, pagination, expandable rows | DONE |
| 2026-03-16 | 2 | Product.jsx rewired — fetches reviews, renders all 3 tab contents | DONE |
| 2026-03-16 | 2 | Visual verification — all charts + tables rendering with test data | DONE |
| 2026-03-16 | 3A | chat-rag Edge Function — full RAG pipeline with 2-layer scope guard | DONE |
| 2026-03-16 | 3B | ChatInterface.jsx — SSE stream consumer + message history | DONE |
| 2026-03-16 | 3B | MessageBubble.jsx — styled bubbles + citation badges + typing dots | DONE |
| 2026-03-16 | 3B | Product.jsx Chat tab wired to ChatInterface | DONE |
| 2026-03-16 | Deploy | All 3 Edge Functions deployed (extract-reviews, embed-reviews, chat-rag) | DONE |
| 2026-03-16 | Bugfix | extract-reviews: skip DB ops in preview mode (product_id="preview") | DONE |
| 2026-03-16 | Bugfix | Pinecone API key secret corrected in Supabase | DONE |
| 2026-03-16 | E2E | Full pipeline verified: paste → extract → preview → ingest → embed → chat | DONE |
| 2026-03-16 | E2E | Chat RAG verified: grounded response with [Review N] citation badges | DONE |
| 2026-03-16 | Deploy | Vercel connected to GitHub — auto-deploy on push | DONE |

---

## Files Created/Modified

```
Phase 1:
src/components/ingestion/
├── CSVUploader.jsx          ← drag-drop CSV with Papa.parse
├── PasteReviews.jsx         ← textarea with character count
├── ReviewPreview.jsx        ← editable review table + confirm button
src/pages/
├── NewProduct.jsx           ← rewritten with 3-step flow + state mgmt
supabase/functions/
├── extract-reviews/index.ts ← full OpenAI fn-calling extraction
├── embed-reviews/index.ts   ← batch embedding + Pinecone upsert

Phase 2:
src/components/product/
├── IngestionSummary.jsx     ← stats tiles + Recharts bar & pie charts
├── RatingDistribution.jsx   ← horizontal bar chart (standalone, CSS)
├── SentimentChart.jsx       ← emoji sentiment cards + stacked bar
├── ReviewTable.jsx          ← search + star-filter + pagination
src/pages/
├── Product.jsx              ← rewired with all tab content + review fetching

Phase 3:
src/components/chat/
├── ChatInterface.jsx        ← SSE stream consumer + message list + input
├── MessageBubble.jsx        ← user/assistant bubbles + [Review N] citations
supabase/functions/
├── chat-rag/index.ts        ← full RAG pipeline (embed → retrieve → stream)
src/pages/
├── Product.jsx              ← Chat tab wired to ChatInterface
```

---

## User Workflow — How to Use ReviewLens AI

### Step 1: Dashboard (Landing Page)
**Page:** `/`
The dashboard shows aggregate stats (total products, reviews, average rating) and a grid of product cards. Each card displays the product name, platform badge (G2, Amazon, etc.), review count, rating, and status. Click "+ Add Product" or a product card to navigate.

### Step 2: Add New Product
**Page:** `/new`
1. Enter a **Product Name** (e.g., "Notion") and select the **Platform** (G2, Amazon, Google Maps, Yelp, Capterra)
2. Choose an ingestion method via tabs:
   - **URL** — paste a review page URL (may be blocked by anti-bot measures)
   - **CSV Upload** — drag & drop or browse for a .csv file (any column format — AI maps automatically)
   - **Paste Text** — paste raw review text in any format
3. Click **"Extract & Preview Reviews"** — the AI (OpenAI GPT-4o) extracts structured review data

### Step 3: Review Preview
After extraction, a preview table appears showing:
- Reviewer name, star rating (visual stars), date, review text
- Delete button (trash icon) to remove incorrect rows
- Click **"Confirm & Ingest N Reviews"** to save

### Step 4: Ingestion Processing
The system automatically:
1. Creates the product record in Supabase
2. Inserts all reviews into the reviews table
3. Computes rating distribution and average rating
4. Generates vector embeddings (text-embedding-3-small)
5. Upserts vectors to Pinecone (namespace: `product-{id}`)
6. Sets product status to "ready"
7. Redirects to the product page

### Step 5: Product Detail — Summary Tab
**Page:** `/product?id={uuid}`
The Summary tab shows:
- **Stats tiles:** Total Reviews, Average Rating (with star), Date Range, Ingestion Method + timestamp
- **Rating Distribution:** Horizontal bar chart (5★ to 1★) with counts
- **Sentiment Breakdown:** Pie chart (Recharts) + emoji cards (Positive/Neutral/Negative) + stacked bar

### Step 6: Product Detail — Reviews Tab
Searchable, filterable review table:
- **Search bar** — filters by review text content
- **Star filter pills** — click 1★–5★ to filter by rating, "All" to reset
- **Paginated table** — 10 reviews per page, Previous/Next navigation
- **Expandable rows** — click long reviews to expand full text

### Step 7: Product Detail — Chat Tab (RAG Q&A)
The guardrailed conversational AI interface:
- Type a question about the product's reviews (e.g., "What are the top complaints?")
- The AI retrieves the 8 most relevant review chunks from Pinecone
- GPT-4o generates a streaming response, grounded ONLY in the retrieved reviews
- **[Review N] citation badges** appear inline for every factual claim
- Multi-turn conversation — follow-up questions maintain context
- **Scope guard:** Questions about other platforms, competitors, or off-topic subjects are explicitly declined

### Architecture Flow
```
User Input → extract-reviews (OpenAI fn-calling) → Supabase Postgres
                                                      ↓
                                              embed-reviews (OpenAI embeddings → Pinecone)
                                                      ↓
User Question → chat-rag (embed question → Pinecone topK=8 → GPT-4o SSE stream) → Chat UI
```
