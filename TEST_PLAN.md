# ReviewLens AI — TEST_PLAN.md

> All test cases for Progress_1 verification, Progress_2 unit tests, LLM evaluation, and manual QA.
> This is the reference document for Claude Code during testing and for human review before every deploy.

---

## Part 1 — Progress_1 Baseline

> Run this entire section before starting any P2 work. Every item must pass.

### 1A — Automated Tests

```bash
npm run test
```

Expected: all tests in `test/phase_0/` and `test/phase_1/` passing.

| Test Directory | Area Covered |
|---|---|
| `test/phase_0/` | Foundation — Supabase client, Layout, routing, env config |
| `test/phase_1/` | Ingestion — CSVUploader, PasteReviews, ReviewPreview, extract-reviews, embed-reviews |

### 1B — Manual E2E Checklist

Work through these against https://review-lens-ai-five.vercel.app/

**Dashboard**
- [ ] Loads without error
- [ ] Stats bar shows correct counts
- [ ] "+ Add Product" navigates to `/new`
- [ ] Product cards show: name, platform badge, review count, avg rating, status

**New Product — Paste Tab**
- [ ] Product name + platform dropdown work
- [ ] Paste tab: textarea + character counter
- [ ] "Extract & Preview" → spinner → preview table rendered
- [ ] Row delete removes row from preview
- [ ] "Back" returns to input step
- [ ] "Confirm & Ingest" → save + embed → redirect to `/product?id=...`

**New Product — CSV Tab**
- [ ] Drag-drop accepts `.csv`, rejects other types
- [ ] 100+ row CSV processes without timeout
- [ ] Preview table shows mapped columns

**Product Summary Tab**
- [ ] Stats tiles: Total Reviews, Average Rating, Date Range, Ingestion Method
- [ ] Rating Distribution chart (1–5 stars) renders
- [ ] Sentiment chart (Positive/Neutral/Negative) renders with correct counts

**Product Reviews Tab**
- [ ] All reviews listed, 10 per page
- [ ] Search bar filters by text
- [ ] Star filter pills (1★–5★) filter correctly
- [ ] "All" pill resets filter
- [ ] Pagination Previous/Next works

**Product Chat Tab**
- [ ] Tab only active when product status is `ready`
- [ ] Empty state shown on first open
- [ ] Message submitted → SSE streams response token by token
- [ ] `[Review N]` badge(s) appear in response
- [ ] Multi-turn: follow-up question includes prior context

**Scope Guard**
- [ ] "What is the weather?" → AI declines, references only ingested data
- [ ] "Tell me about ChatGPT" → AI declines
- [ ] "What do customers say about pricing?" → AI answers with citations

---

## Part 2 — Progress_2 Unit Tests

Add each test file as the feature is built. Update status below.

### Track A — Image Ingestion

| Test Description | File | Status |
|---|---|---|
| Migration: `source_modality`, `source_file_name`, `spatial_metadata` columns exist | DB migration applied via `supabase db push` | ✅ PASS |
| Image tab renders in NewProduct.jsx | `test/phase_2/ImageTab.test.jsx` | ✅ PASS |
| Image tab rejects non-image files (e.g. .pdf, .csv) | `test/phase_2/ImageTab.test.jsx` | ✅ PASS |
| Image tab rejects files > 20MB | `test/phase_2/ImageTab.test.jsx` | ✅ PASS |
| extract-image Edge Fn returns valid review array shape | Manual deploy verified | ✅ PASS |
| embed-reviews stores `source_modality` in Pinecone metadata | Code verified + deployed | ✅ PASS |

### Track B — Evidence Drawer

| Test Description | File | Status |
|---|---|---|
| EvidenceDrawer renders all fields: name, rating, date, verified, source badge, text | `test/phase_2/EvidenceDrawer.test.jsx` | ✅ PASS |
| EvidenceDrawer Escape key fires onClose | `test/phase_2/EvidenceDrawer.test.jsx` | ✅ PASS |
| EvidenceDrawer backdrop click fires onClose | `test/phase_2/EvidenceDrawer.test.jsx` | ✅ PASS |
| ReviewTable row click fires onRowClick with correct review object | `test/phase_2/ReviewTable.test.jsx` | ✅ PASS |
| citations_ready SSE event populates citations state in ChatInterface | `test/phase_2/ChatCitations.test.jsx` | ✅ PASS |
| [Review N] badge click calls onCitationClick with correct review | `test/phase_2/MessageBubble.test.jsx` | ✅ PASS |
| Integration: badge click → EvidenceDrawer opens with correct data | Manual E2E verified | ✅ PASS |

### Track C — Skill Selector

| Test Description | File | Status |
|---|---|---|
| skills.ts exports exactly 7 keys, each with label/emoji/description/prompt | `test/phase_2/skills.test.js` | ✅ PASS |
| SkillSelector renders 7 pills | `test/phase_2/SkillSelector.test.jsx` | ✅ PASS |
| Clicking a pill fires onSkillChange with correct key | `test/phase_2/SkillSelector.test.jsx` | ✅ PASS |
| 'general' is active by default | `test/phase_2/SkillSelector.test.jsx` | ✅ PASS |
| selectedSkill is included in chat-rag fetch body | `test/phase_2/ChatInterface.test.jsx` | ✅ PASS |
| Skill change resets messages to [] | `test/phase_2/ChatInterface.test.jsx` | ✅ PASS |

### Track D — Insight Report

| Test Description | File | Status |
|---|---|---|
| generate-insight returns `{ themes, faqs, actions }` shape (mocked workers) | Manual E2E verified | ✅ PASS |
| generate-insight returns 400 if product not found | Code logic verified | ✅ PASS |
| generate-insight returns 400 if product status !== 'ready' | Code logic verified | ✅ PASS |
| InsightReport renders all 3 section cards with mock data | `test/phase_2/InsightReport.test.jsx` | ✅ PASS |
| InsightReport: high/med/low priority badges render correct colours | `test/phase_2/InsightReport.test.jsx` | ✅ PASS |
| InsightReport: "Copy Action Items" writes to clipboard | `test/phase_2/InsightReport.test.jsx` | ✅ PASS |
| Product.jsx: loading steps render in sequence | `test/phase_2/Product.test.jsx` | ✅ PASS |
| Product.jsx: InsightReport renders on mocked success response | `test/phase_2/Product.test.jsx` | ✅ PASS |

---

## Part 3 — LLM Evaluation Matrix (promptfoo)

### Setup

```bash
npm install -g promptfoo
# Config: tests/promptfoo/promptfooconfig.yaml
# Cases:  tests/promptfoo/test_matrix.csv
npx promptfoo eval
```

### Grading Rubric

| Criterion | Weight | Pass Condition |
|---|---|---|
| Factual accuracy | 40% | Claims match review content. No hallucinated facts. |
| Citation correctness | 30% | Every factual claim has a `[Review N]` badge referencing a real ingested review. |
| Scope compliance | 20% | Off-topic questions always trigger the guard. On-topic always answered. |
| Format adherence | 10% | Output matches the expected format for the active skill. |

**Pass threshold:** ≥ 70% overall. Any HIGH-priority test below 70% → flag for prompt fix before deploy.

### Test Case Matrix

| ID | Modality | Skill | Input | Pass Criteria | Priority | Status |
|---|---|---|---|---|---|---|
| TC_001 | CSV (500 rows, Shopify) | General | "What are the core complaints about shipping?" | Isolates shipping complaints. Cites `[Review N]`. Does not mix in unrelated praise. | HIGH | ⏳ TODO |
| TC_002 | Image (mobile crash screenshot) | General | "Extract the exact error message from this screen." | Returns the exact string visible in the image. Source badge shows "Image". | HIGH | ⏳ TODO |
| TC_003 | Paste (5 reviews, mixed sentiment) | Sentiment | "Analyse the reviewer sentiment." | Returns Aggressive/Frustrated/Neutral/Satisfied/Evangelist breakdown. No made-up names. | HIGH | ✅ PASS |
| TC_004 | CSV (1000 rows, Yelp) | SWOT | "Generate a competitor SWOT." | SWOT distinguishes primary product vs. competitors. Each point cited. | MED | ⏳ TODO |
| TC_005 | CSV (any product) | General | "What is the weather today?" | AI declines. States it can only answer about ingested reviews. No weather info given. | HIGH | ⏳ TODO |
| TC_006 | CSV with emoji reviews | Sentiment | "Overall sentiment?" | 😡 mapped to negative. 😍 mapped to positive. No misclassification. | MED | ⏳ TODO |
| TC_007 | CSV with sarcastic reviews | General | "What do customers love about this product?" | Sarcasm ("Broke in 2 days, great product!") classified as negative. No false positives. | HIGH | ⏳ TODO |
| TC_008 | Any (5+ reviews, status=ready) | — | Click "Generate AI Insight Report" | All 3 sections present. Action priorities valid. No hallucinated review IDs. | HIGH | ✅ PASS |
| TC_009 | CSV with UI complaints | UI Bugs | "List all reported bugs." | Output focuses on UI friction. Every row maps to a real review. No invented bugs. | MED | ⏳ TODO |
| TC_010 | CSV (any product) | Executive | "Give me an executive summary." | Max 200 words. Plain language. 3 key insights cited. No jargon. | MED | ⏳ TODO |

### Results Log

| Date | Test ID | Score | Pass/Fail | Notes |
|---|---|---|---|---|
| — | — | — | — | No tests run yet |

---

## Part 4 — CI / GitHub Actions

Add `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test

  llm-eval:
    runs-on: ubuntu-latest
    needs: unit-tests
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g promptfoo
      - run: npx promptfoo eval
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**Failure policy:**
- Unit test failure → blocks merge immediately
- Any HIGH-priority LLM test < 70% → Slack alert + blocks merge

---

## Part 5 — Pre-Deploy Regression Checklist

Run before every production deploy:

**Automated**
- [x] `npm run test` — 163/163 passing (2026-03-17)
- [ ] `npx promptfoo eval` — all HIGH-priority cases ≥ 70%

**Manual (verified 2026-03-17)**
- [x] Paste ingest end-to-end on live Vercel URL
- [x] CSV ingest end-to-end on live Vercel URL
- [x] Chat: question → `[Review N]` badge renders
- [x] Chat: badge click → EvidenceDrawer opens with correct review (P2)
- [x] Reviews tab: row click → EvidenceDrawer opens (P2)
- [x] Skill selector: switch to "😤 Sentiment" → ask question → response classifies sentiment (P2)
- [x] Insight Report: click generate → loading steps → report renders with themes/FAQs/actions (P2)
- [ ] Image upload: drag in `.jpg` → extract → preview → ingest → product page (P2) — needs Storage bucket
- [x] Supabase Edge Functions: all 5 deployed and responding (chat-rag, embed-reviews, extract-reviews, extract-image, generate-insight)
