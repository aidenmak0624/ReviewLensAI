# ReviewLens AI — PROGRESS_2 Development Tracker

> **Prerequisite:** All Progress_1 tests must be green before starting any task here.
> Run `npm run test` — confirm passing. Then complete the Gate Check below.

---

## ⛩️ Gate Check — Progress_1 Verification

Complete every item and mark `[x]` before writing a single line of P2 code.

**Automated tests**
- [x] `npm run test` → all tests passing (test/phase_0 + test/phase_1) — 116/116 green

**Manual browser verification** — test against https://review-lens-ai-five.vercel.app/

- [x] Dashboard (`/`) loads — stats bar + product card grid visible
- [x] New Product (`/new`) — all 3 tabs functional: URL / CSV / Paste
- [x] CSV ingest end-to-end: upload → preview → confirm → redirect to product page
- [x] Paste ingest end-to-end: paste text → extract → preview → confirm → redirect
- [x] Product Summary tab: stats tiles + rating distribution + sentiment chart render
- [x] Product Reviews tab: search bar, star filter pills, pagination all work
- [x] Product Chat tab: question → SSE stream → `[Review N]` badge rendered in response
- [x] Scope guard: off-topic question → AI declines with correct in-scope message
- [x] Vercel deployment healthy — no build errors in Vercel dashboard

**Gate status:** ✅ VERIFIED 2026-03-17 — all P1 features working, proceeding to P2

---

## Track A — Multimodal Ingestion (Image Support)

> Goal: extend the ingestion pipeline to accept image files (screenshots, photos of reviews).
> PDF support is deferred to P3. Image is the highest-value, lowest-complexity modality to add first.

### A1 — Database Migration
- [ ] Create `supabase/migrations/002_multimodal_columns.sql` with:
  ```sql
  ALTER TABLE reviews ADD COLUMN source_modality TEXT;
  ALTER TABLE reviews ADD COLUMN source_file_name TEXT;
  ALTER TABLE reviews ADD COLUMN spatial_metadata JSONB;
  ALTER TABLE products ADD COLUMN source_url TEXT;
  ```
- [ ] Run `supabase db push` — verify migration applied with zero errors
- [ ] Confirm columns visible in Supabase Table Editor
- [ ] Backfill existing reviews: `UPDATE reviews SET source_modality = 'csv' WHERE source_modality IS NULL`

### A2 — Supabase Storage Bucket
- [ ] Create `reviews-media` bucket in Supabase Storage dashboard (public read)
- [ ] Add `SUPABASE_STORAGE_BUCKET=reviews-media` to `.env` and run `supabase secrets set SUPABASE_STORAGE_BUCKET=reviews-media`
- [ ] Smoke-test: upload a test image via `supabaseClient.storage.from('reviews-media').upload(...)` and confirm public URL works

### A3 — extract-image Edge Function
- [ ] Create `supabase/functions/extract-image/index.ts`
- [ ] Accept POST body: `{ base64Image: string, mimeType: string, productId: string }`
- [ ] Upload original file to Supabase Storage `reviews-media/{productId}/{timestamp}.{ext}` — store public URL
- [ ] POST to OpenAI `/v1/chat/completions`:
  - `model: "gpt-4o"`
  - `content: [{ type: "image_url", image_url: { url: "data:{mimeType};base64,{base64Image}" } }, { type: "text", text: "Extract all customer reviews visible in this image..." }]`
  - System prompt: extract reviewer name, rating (1-5), review text, date. Return JSON array matching review schema.
- [ ] Map GPT-4o response → review objects with `source_modality: 'image'`, `source_file_name: <storage URL>`
- [ ] Always include CORS headers from `_shared/cors.ts`
- [ ] Deploy: `supabase functions deploy extract-image`

### A4 — Frontend: Image Upload Tab in NewProduct.jsx
- [ ] Add 4th tab **"📷 Image"** to the existing URL / CSV / Paste tab group in `NewProduct.jsx`
- [ ] Tab renders an image drag-drop zone:
  - Accepts: `.png`, `.jpg`, `.jpeg`, `.webp` only — validate MIME type
  - Max size: 20MB — show error if exceeded
  - On file select: display thumbnail preview + filename
  - On drop/select: convert to base64 using `FileReader`
- [ ] "Extract Reviews" button → POST base64 + mimeType to `extract-image` Edge Function
- [ ] Re-use existing `ReviewPreview.jsx` for extracted results — add a "Source" column showing an image thumbnail badge
- [ ] On confirm: save reviews + redirect to product page (same flow as CSV/paste)
- [ ] Write Vitest test: image tab renders, validates MIME type, rejects non-image files

### A5 — embed-reviews Update
- [ ] In `embed-reviews/index.ts`: store `source_modality` in Pinecone vector metadata alongside existing fields
- [ ] Confirm embed still works end-to-end after change

---

## Track B — Clickable Evidence Drawer

> Goal: every `[Review N]` badge in chat and every row in the Reviews table opens a slide-in panel showing the complete source review.

### B1 — EvidenceDrawer.jsx (New Component)
- [ ] Create `src/components/chat/EvidenceDrawer.jsx`
- [ ] **Layout:** fixed right-side panel, `w-96`, full viewport height, `z-50`
- [ ] **Backdrop:** semi-transparent overlay `z-40`, covers rest of screen
- [ ] **Animation:** Framer Motion — `x: "100%"` (closed) → `x: 0` (open), 300ms ease-out
- [ ] **Content renders:**
  - Header: platform badge + product name
  - Reviewer name (bold) + review date
  - Star rating — visual ★ icons (filled/empty), not just a number
  - Verified badge (green checkmark pill) — shown only if `verified === true`
  - Source badge: `CSV` / `Paste` / `URL` / `Image` — colour-coded pill
  - Helpful count: "👍 N people found this helpful" — shown only if `helpful_count > 0`
  - Full `review_text` — no truncation, line breaks preserved
- [ ] **Close triggers:** × button top-right · backdrop click · Escape key listener
- [ ] Accept props: `{ isOpen: boolean, review: ReviewObject | null, onClose: () => void }`
- [ ] Write Vitest test: renders all fields with mock data, Escape key fires onClose

### B2 — ReviewTable.jsx — Row Click Trigger
- [ ] Add `onRowClick` prop to `ReviewTable.jsx`
- [ ] Make each table row `cursor-pointer` with a hover highlight
- [ ] On row click: call `onRowClick(review)` passing the full review object
- [ ] Wire in `Product.jsx`: `<ReviewTable onRowClick={(r) => { setDrawerReview(r); setDrawerOpen(true); }} />`
- [ ] Write Vitest test: row click fires callback with correct review object

### B3 — Chat Citations → Drawer
- [ ] In `chat-rag/index.ts`: after stream completes, emit a final SSE event:
  ```
  event: citations_ready
  data: [{ reviewNumber, id, reviewer_name, rating, review_text, review_date, verified, helpful_count, source_modality, source_file_name }]
  ```
  Fetch the full review records from Supabase by ID at this point (IDs already known from Pinecone retrieval metadata)
- [ ] In `ChatInterface.jsx`:
  - Add `citations` state: `useState({})` keyed by review number
  - Listen for `citations_ready` SSE event → parse JSON → populate `citations`
  - Add `drawerReview` state and `drawerOpen` boolean state
- [ ] In `MessageBubble.jsx`:
  - Accept `citations` prop and `onCitationClick` callback
  - Replace `[Review N]` text with `<button>` styled as the existing blue badge + `cursor-pointer hover:scale-105`
  - `onClick`: call `onCitationClick(citations[N])` passing the full review object
- [ ] In `Product.jsx`: render `<EvidenceDrawer>` once at page level, pass `drawerReview` + `drawerOpen` + `onClose`
- [ ] Write Vitest test: citations_ready populates state, badge click opens drawer

---

## Track C — AI Skill Selector

> Goal: users can switch between 7 analytical lenses via a pill row above the chat input. Each skill injects a hidden prompt directive that reorients the AI's analysis focus.

### C1 — Skill Library: `_shared/skills.ts`
- [ ] Create `supabase/functions/_shared/skills.ts`
- [ ] Export `SKILL_PROMPTS` object — exactly these 7 keys:

```typescript
export const SKILL_PROMPTS: Record<string, { label: string; emoji: string; description: string; prompt: string }> = {
  general:            { label: "General",   emoji: "💬", description: "Open-ended analysis",                       prompt: "" },
  feature_extraction: { label: "Features",  emoji: "🔧", description: "Identify requested & praised features",     prompt: "Focus on extracting features..." },
  ui_bug_detection:   { label: "UI Bugs",   emoji: "🐛", description: "Surface interface friction & broken flows", prompt: "Identify mentions of interface friction..." },
  sentiment_analysis: { label: "Sentiment", emoji: "😤", description: "Classify reviewer tone",                    prompt: "Classify each sentiment as: Aggressive / Frustrated / Neutral / Satisfied / Evangelist..." },
  competitor_swot:    { label: "SWOT",      emoji: "⚔️", description: "Build SWOT from competitor mentions",       prompt: "Compare the primary product against any competitors mentioned..." },
  pricing_complaints: { label: "Pricing",   emoji: "💰", description: "Isolate cost & value mentions",             prompt: "Focus only on mentions of price, cost, value, expensive, cheap, or refund..." },
  executive_summary:  { label: "Executive", emoji: "📋", description: "Top 3 insights, plain language",            prompt: "Summarise the top 3 insights in plain language. Max 200 words. No jargon..." },
};
```

- [ ] Write Vitest test: all 7 keys present, each has `label`, `emoji`, `description`, `prompt`

### C2 — SkillSelector.jsx (New Component)
- [ ] Create `src/components/chat/SkillSelector.jsx`
- [ ] Renders a horizontally scrollable pill row (overflow-x: auto, no scrollbar visible)
- [ ] One pill per skill. Each pill shows `{emoji} {label}`
- [ ] Active pill: `bg-teal-100 border border-teal-600 text-teal-800 font-medium`
- [ ] Inactive pill: `bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200`
- [ ] Default active: `general`
- [ ] Props: `{ selectedSkill: string, onSkillChange: (key: string) => void }`
- [ ] Write Vitest test: all 7 pills render, clicking a pill fires `onSkillChange` with correct key

### C3 — ChatInterface.jsx Integration
- [ ] Import and render `<SkillSelector>` above the message input bar
- [ ] Add `selectedSkill` state, default `'general'`
- [ ] On skill change: reset conversation messages to `[]` (fresh context) + update `selectedSkill`
- [ ] Include `skill: selectedSkill` in the fetch body sent to `chat-rag`
- [ ] Write Vitest test: `selectedSkill` is included in the fetch payload body

### C4 — chat-rag Edge Function: Skill Injection
- [ ] Import `SKILL_PROMPTS` from `_shared/skills.ts`
- [ ] Accept `skill` from request body (default: `'general'`)
- [ ] If `skill !== 'general'` and `SKILL_PROMPTS[skill]` exists: prepend `SKILL_PROMPTS[skill].prompt` to the system prompt **after** the guardrail header but **before** the RAG context
- [ ] Deploy: `supabase functions deploy chat-rag`
- [ ] Manual test: select "🐛 UI Bugs" → ask "What are the issues?" → confirm response focuses on UI friction

---

## Track D — AI Insight Report

> Goal: one button generates a structured executive strategy document — themes, FAQs, and prioritised action items — all derived from the ingested review data via a 3-worker agentic pipeline.

### D1 — generate-insight Edge Function (Orchestrator)
- [ ] Create `supabase/functions/generate-insight/index.ts`
- [ ] Accept POST body: `{ product_id: string }`
- [ ] Validate: product exists in Supabase + `status === 'ready'`; return 400 otherwise
- [ ] Fetch up to 80 reviews from Supabase for this product (ordered by created_at desc): `id, reviewer_name, rating, review_text`
- [ ] **Worker 1 — Themer:**
  - Input: all review texts formatted as a numbered list
  - System prompt: *"You are a product analyst. Extract the most important MECE themes from these customer reviews. Return ONLY valid JSON: `{ \"themes\": [{ \"theme\": string, \"summary\": string }] }`. Maximum 6 themes. No preamble."*
  - Parse JSON response → `themes[]`
- [ ] **Worker 2 — FAQ Builder:**
  - Input: Worker 1 themes (stringified) + up to 60 review texts
  - System prompt: *"Based on these reviews and themes, identify the most common user questions and friction points. Return ONLY valid JSON: `{ \"faqs\": [{ \"question\": string, \"answer\": string }] }`. Maximum 8 items."*
  - Parse JSON response → `faqs[]`
- [ ] **Worker 3 — Action Planner:**
  - Input: Worker 1 themes + Worker 2 FAQs (both stringified)
  - System prompt: *"Translate the themes and FAQs into prioritised product action items. Return ONLY valid JSON: `{ \"actions\": [{ \"action\": string, \"priority\": \"high\"|\"med\"|\"low\", \"rationale\": string }] }`. Maximum 10 items."*
  - Parse JSON response → `actions[]`
- [ ] Return: `{ themes, faqs, actions }` with `Content-Type: application/json`
- [ ] Full error handling: if any worker fails, return `{ error: "..." }` with status 500
- [ ] Deploy: `supabase functions deploy generate-insight`

### D2 — InsightReport.jsx (New Component)
- [ ] Create `src/components/product/InsightReport.jsx`
- [ ] Accept props: `{ data: { themes, faqs, actions } }`
- [ ] **Section 1 — Evidence & Themes:**
  - Collapsible card (open by default)
  - Each theme: bold title + summary paragraph
  - Border-left accent in teal
- [ ] **Section 2 — FAQ & Friction Points:**
  - Collapsible card (open by default)
  - Each FAQ: question in bold → answer below in gray
  - Numbered list styling
- [ ] **Section 3 — Action Items:**
  - Collapsible card (open by default)
  - Each action: priority badge + action text + rationale in small gray text
  - Priority badge colours: 🔴 `high` (red pill) · 🟡 `med` (amber pill) · ⚪ `low` (gray pill)
- [ ] **Export bar** (sticky bottom of component):
  - "📋 Copy Action Items" → copies `[HIGH] action\n[MED] action\n...` to clipboard
  - "⬇️ Download PDF" → `jsPDF` renders all 3 sections into a formatted `.pdf` file
- [ ] Write Vitest test: renders all 3 sections with mock data, action priority badges correct

### D3 — Product.jsx: Insight Tab
- [ ] Add **4th tab** "✨ Insight" to the existing Summary / Reviews / Chat tab bar in `Product.jsx`
- [ ] Tab content:
  - If report not yet generated: show a centered "Generate AI Insight Report" button (large, teal, disabled if `product.status !== 'ready'`)
  - On click: POST to `/functions/v1/generate-insight` with `{ product_id }`
  - **3-step loading state** (sequential, each ~3–10s):
    - Step 1: spinner + "Gathering evidence from reviews…"
    - Step 2: spinner + "Analysing themes…"
    - Step 3: spinner + "Building action plan…"
    - (Simulate steps via response timing — single API call, show steps for UX)
  - On success: render `<InsightReport data={reportData} />`
  - On error: red error banner + "Retry" button
  - If report already generated: show `<InsightReport>` directly (cache in `useState`)
- [ ] Write Vitest test: loading states render in sequence, `InsightReport` renders on mock success

---

## Progress Log

| Date | Track | Task Completed | Status |
|------|-------|----------------|--------|
| — | Gate | Progress_1 verification | ⏳ PENDING |

> Format for new entries: `YYYY-MM-DD | Track X | Short description | DONE`

---

## File Change Summary

**New files (create from scratch):**
```
src/components/chat/EvidenceDrawer.jsx
src/components/chat/SkillSelector.jsx
src/components/product/InsightReport.jsx
supabase/functions/extract-image/index.ts
supabase/functions/generate-insight/index.ts
supabase/functions/_shared/skills.ts
supabase/migrations/002_multimodal_columns.sql
```

**Modified files (extend existing):**
```
src/pages/NewProduct.jsx              add Image tab (Track A)
src/pages/Product.jsx                 add Insight tab + EvidenceDrawer wiring (Track B, D)
src/components/chat/ChatInterface.jsx add citations state + SkillSelector (Track B, C)
src/components/chat/MessageBubble.jsx make [Review N] badges clickable (Track B)
src/components/product/ReviewTable.jsx add onRowClick prop (Track B)
supabase/functions/chat-rag/index.ts  citations_ready event + skill injection (Track B, C)
supabase/functions/embed-reviews/index.ts store source_modality in Pinecone metadata (Track A)
```
