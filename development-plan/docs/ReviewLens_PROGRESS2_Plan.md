
# Executive Summary
ReviewLens AI has successfully completed its Progress_1 MVP: a full-stack React + Supabase application capable of ingesting reviews via CSV, paste, and URL, generating vector embeddings in Pinecone, and serving guardrailed RAG chat with [Review N] citations. The live deployment at https://review-lens-ai-five.vercel.app/ demonstrates end-to-end functionality including a Dashboard, Product Detail page (Summary/Reviews/Chat tabs), and all three Supabase Edge Functions.

Progress_2 is the strategic expansion from a functional prototype into a defensible, enterprise-grade SaaS product. This plan synthesizes the Gemini strategic research blueprint with the actual codebase state documented in PROGRESS.md and USER_WORKFLOW.md to produce a precise, prioritized roadmap of six engineering tracks.




# Section 1 — Progress_1 State Audit
The following table maps every completed and remaining item from the PROGRESS.md against the six Progress_2 tracks. Green = done, amber = partial, red = not started.




# Section 2 — Track A: Multimodal Ingestion
## A1. Overview & Strategic Rationale
The current ingestion pipeline handles text only (paste, CSV, URL). The Gemini blueprint identifies PDF and image support as the primary architectural prerequisite for enterprise adoption. A product manager uploading a 50-page UX research report or a screenshot of an App Store complaint page represents the highest-value use case. Without multimodal ingestion, ReviewLens AI is limited to manually exported CSV data.

## A2. PDF Ingestion Pipeline
### Technical Approach
Extend the existing extract-reviews Edge Function to detect PDF MIME type on upload. Use a two-stage pipeline:
- Stage 1 — Text extraction: Use pdf-parse (Node.js) or PyMuPDF (Python) to extract raw text with page-number metadata preserved per chunk.
- Stage 2 — Spatial OCR (for scanned PDFs): Route scanned/image-heavy PDFs through a vision-language call (GPT-4o vision or Claude claude-sonnet-4-6) to extract text with bounding box coordinates. Store coordinates in the Supabase reviews table as a JSONB spatial_metadata column.
- Chunking strategy: Split by paragraph, not arbitrary token count. Inject citation anchors in the format <c>PAGE.ORDER</c> before embedding. Store the anchor map in metadata.

### Supabase Schema Extension

## A3. Image Ingestion Pipeline
Images (PNG, JPG, WEBP) are uploaded via the existing CSVUploader drag-drop zone extended with MIME-type whitelisting. The frontend converts the file to base64 and sends it to a new extract-image Edge Function.
- Vision call: POST to OpenAI /v1/chat/completions with model: gpt-4o, content type image_url (base64). System prompt instructs extraction of all visible text, ratings, reviewer names, and dates. Responses are mapped into the standard review schema.
- Fallback: If no review structure is detected, store as a raw_image_description review with sentiment: 'neutral' for manual review.
- File storage: Upload raw file to Supabase Storage bucket (reviews-media). Store the public URL in source_file_name for evidence drawer retrieval.

### Frontend Changes (NewProduct.jsx)
- Add a 4th tab: Image Upload (in addition to URL / CSV / Paste)
- Support multi-file selection. Display file thumbnails in the preview area before extraction.
- Add MIME validation: accept .pdf, .png, .jpg, .webp only.
- Reuse existing ReviewPreview.jsx with an additional 'Source' column showing the filename badge.



# Section 3 — Track B: Verifiable RAG — Clickable Evidence Drawer
## B1. The Problem with Current Citations
The current chat interface renders [Review 3] as a styled blue badge inline in the AI response. This is cosmetic only — users cannot click it. For enterprise ORM analysts who need auditable, verifiable AI outputs, this is insufficient. The Progress_2 upgrade makes every citation a clickable anchor that opens the full source review in a side drawer.


## B2. Backend Changes — chat-rag Edge Function
The current SSE stream outputs plain text with [Review N] markers. To support evidence retrieval, the stream must also emit structured citation metadata alongside each token. Implement a dual-channel response:
- Channel 1 (text stream): Unchanged SSE token stream for the chat bubble.
- Channel 2 (citations JSON): After stream completion, emit a citations_ready event containing an array of: { review_id, reviewer_name, rating, review_text, source_modality, citation_anchor, spatial_metadata }.
- The review_id is already stored in Pinecone vector metadata. The Edge Function queries Supabase for the full review record using this ID and appends it to the final event.

## B3. Frontend Changes
### ChatInterface.jsx — Citation State
- Add citations state: useState<CitationMap>({}), where CitationMap is keyed by review number.
- On SSE citations_ready event: parse JSON, populate citations state.
- Pass citations to each MessageBubble.
### MessageBubble.jsx — Clickable Badges
- Intercept [Review N] text in rendered markdown. Replace with <CitationBadge reviewNum={N} onClick={() => setActiveCitation(N)} />.
- CitationBadge: styled button (existing blue badge style + cursor: pointer + hover: scale 1.05).
### EvidenceDrawer.jsx — New Component
- Slide-in panel from the right (Tailwind: translate-x-full → translate-x-0 transition).
- Renders: product/platform badge, reviewer name, star rating, review date, full review_text body.
- For PDF/image sources: renders the stored source image from Supabase Storage with a CSS highlight box positioned using spatial_metadata bounding box coordinates (absolute position overlay on img tag).
- Close button and keyboard (Escape) dismissal.



# Section 4 — Track C: AI Skill Selector
## C1. Concept
Instead of asking users to engineer their own prompts, the skill selector presents pre-built analytical lenses as a UI toggle above the chat input. Each skill is a hidden prompt injection that reorients the model's retrieval and synthesis focus without the user seeing the underlying prompt text.

## C2. Skill Library

## C3. Implementation
### SkillSelector.jsx — New Component
- Rendered above the chat input in ChatInterface.jsx.
- A horizontal scrollable row of pill buttons: each pill is a skill name.
- Active skill is highlighted (bg-teal-100 border-teal-600). Default: 'General'.
- On skill select: store selectedSkill in component state and pass to the chat submission handler.
### Chat API Integration
- Modify the fetch call in ChatInterface.jsx to include skill: selectedSkill in the JSON body.
- Modify chat-rag Edge Function: accept skill parameter. Prepend the corresponding skill prompt injection to the system prompt before the standard RAG context and guardrails.
- Skill prompt library stored as a TS const object in the Edge Function: SKILL_PROMPTS[skill].



# Section 5 — Track D: AI Insight Report (Agentic)
## D1. Feature Overview
The AI Insight Report is a single-button feature on the Product Detail page that automatically synthesizes all ingested reviews into a structured executive strategy document. This is the flagship differentiator for Progress_2. It transforms ReviewLens AI from a reactive Q&A tool into a proactive strategic intelligence engine.


## D2. Agentic Architecture — Orchestrator-Worker Pattern
A single GPT-4o call cannot generate a high-fidelity, MECE-structured report over thousands of reviews reliably. The architecture uses three sequential worker agents, each with a tightly scoped task and its own system prompt.


## D3. Frontend Implementation
### 'Generate Insight' Button — Product.jsx
- Add a prominent 'Generate AI Insight Report' button in the Summary tab header (disabled if product status !== 'ready').
- On click: POST to /functions/v1/generate-insight with { product_id }.
- Show a multi-step loading state: 'Gathering evidence...' → 'Analyzing themes...' → 'Building action plan...' (3–15 seconds depending on review volume).
### InsightReport.jsx — New Component
- Rendered in a new 'Insight' tab on the Product Detail page (4th tab alongside Summary/Reviews/Chat).
- Three collapsible sections: Evidence & Themes, FAQ & Friction Points, Action Items.
- Each evidence item renders inline citation badges that connect to the EvidenceDrawer (Track B).
- 'Download as PDF' button: generate a styled PDF using jsPDF or trigger a server-side PDF render.
- 'Copy to Clipboard' button for the action items checklist.



# Section 6 — Track E: Testing Matrix
## E1. Testing Philosophy
The stochastic nature of LLM outputs requires a fundamentally different testing approach than deterministic software. The Progress_2 test suite uses the promptfoo framework for automated, bulk evaluation with LLM-as-Judge grading. All test cases are CSV-defined for scalability.

## E2. Test Case Matrix

## E3. Testing Infrastructure
- Framework: promptfoo (npm install -g promptfoo). Config: promptfooconfig.yaml referencing the test CSV.
- Judge model: GPT-4o-mini as the automated grader. Rubric: factual accuracy (40%), citation correctness (30%), scope compliance (20%), format adherence (10%).
- CI integration: Add npx promptfoo eval to GitHub Actions workflow on every PR to main.
- Failure capture: Any test scoring below 70% triggers a Slack notification and blocks merge.



# Section 7 — Track F: Cost Model & Landing Page
## F1. Cost Estimation Model
### LLM Inference Costs (Per User Action)

### Proposed SaaS Pricing Tiers

## F2. SaaS Landing Page — Content Architecture
### Hero Section
- Eyebrow: 'AI-Powered Multimodal Review Analytics'
- H1: 'Turn Thousands of Unstructured Reviews into Verifiable Product Decisions in Seconds'
- Subhead (2 sentences): 'Upload Amazon CSVs, UI screenshots, or research PDFs. Our RAG engine extracts sentiment, identifies bugs, and provides clickable visual proof for every AI-generated claim.'
- CTA: 'Start 14-Day Free Trial' (primary) + 'Watch 90-Second Demo' (secondary)
- Social proof strip: Platform logos (Amazon, G2, Yelp, Shopify, Capterra) in greyscale
### Feature Sections (in order)
- Pain Point Section: 'You're reading 500 reviews manually. We do it in 30 seconds.' — Before/after split showing a spreadsheet vs. the ReviewLens dashboard.
- How It Works: 3-step visual (Upload → AI Analyzes → Click to Verify). Animated demo of the evidence drawer opening.
- Feature Grid: Multimodal ingestion, Verifiable citations, AI Insight Reports, Skill selector, Competitor benchmarking.
- Pricing section: Feature comparison table across the 4 tiers above.
- Footer CTA: 'Start analyzing your first product free — no credit card required.'
### Design Language
- Typography: Instrument Serif (headings) + DM Sans (body) — editorial precision without the 'Space Grotesk SaaS cliché'.
- Color: Dark navy (#0F1929) hero + white content sections + teal (#0F7B6C) as the single accent color.
- Motion: Framer Motion staggered reveal on scroll. The evidence drawer animation on the hero demo.
- Built with: Next.js 14 + Tailwind + shadcn/ui. Deployed on Vercel.



# Section 8 — Master Sprint Plan
Progress_2 is structured as a 5-week sprint. Tracks are sequenced by dependency: Track A (ingestion) must precede Track B (evidence drawer) because the drawer relies on spatial_metadata populated during PDF/image ingestion. Track D (Insight Report) depends on Track C (Skill Selector) for its prompt library. Track E and F can run in parallel.




# Section 9 — File Change Map
The following table lists every new file and every existing file that requires modification in Progress_2. Use this as the direct input to your AI coding agent session.

## New Files

## Modified Files



# Section 10 — Working Environment Setup
## New Environment Variables

## New npm Dependencies




# Appendix — Architecture Decision Log
The following decisions were made in synthesizing the Gemini blueprint with the existing Progress_1 codebase. These are recorded here for future reference.

### ADR-001: pgvector vs. Pinecone for spatial metadata
Decision: Keep Pinecone for vector search. Store spatial_metadata (bounding boxes) in Supabase PostgreSQL as JSONB. Rationale: Pinecone excels at approximate nearest-neighbour search; PostgreSQL excels at structured metadata retrieval. The evidence drawer uses a direct Supabase SELECT by review_id, not a vector query — this split is architecturally correct.

### ADR-002: Streaming vs. batch for Insight Report
Decision: The generate-insight Edge Function uses sequential batch LLM calls (not streaming) between the 3 workers. The final report is streamed to the frontend in a single JSON payload. Rationale: Worker outputs need to be passed as input to the next worker — this requires complete results, not partial streams. User-facing latency is managed by the multi-step loading state.

### ADR-003: Landing page as separate deployment
Decision: Build the landing page as a separate Next.js app in /apps/landing (if monorepo) or a separate repo. Rationale: The landing page has a different release cadence, different Vercel deployment config (edge functions vs. static), and will eventually need its own domain (e.g. reviewlens.ai vs. app.reviewlens.ai). Separating concerns now avoids painful refactoring later.

### ADR-004: PDF OCR tier selection
Decision: Use text-mode PDF parsing (pdf-parse) as the default. Only escalate to GPT-4o vision OCR if pdf-parse returns less than 100 words per page (scanned PDF heuristic). Rationale: Vision model calls are ~50x more expensive than text extraction. The majority of user-uploaded PDFs are digitally generated (not scanned) and should be processed cheaply. The fallback ensures scanned documents still work.



End of Document
ReviewLens AI — PROGRESS_2 Technical Plan  •  Version 1.0  •  March 2026

| REVIEWLENS AI
PROGRESS_2 — Technical Development Plan
Multimodal Ingestion  •  Verifiable RAG  •  AI Insight Engine  •  SaaS Launch
Version 1.0  |  March 2026  |  Aiden (Chin Wei Mak) |
| --- |

| Assessment: Where We Are vs. Where We Need to Go
Progress_1 proven: text ingestion → embedding → chat works end-to-end. Critical gaps: (1) ingestion is text-only — no PDF or image support; (2) chat citations are badge labels only — users cannot click to see the source review; (3) no AI Insight auto-report; (4) no skill/prompt selector; (5) no testing matrix; (6) no cost model or landing page. Progress_2 addresses all six. |
| --- |

| Feature / Component | Status | Notes |
| --- | --- | --- |
| Phase 0 — Scaffold + DB migration + Edge Function utilities | DONE | Stable foundation |
| Phase 1 — CSV / Paste / URL ingestion + extract-reviews Edge Function | DONE | Text-only; no PDF/image |
| Phase 1 — embed-reviews Edge Function + Pinecone upsert | DONE | Ready for multimodal extension |
| Phase 2 — Dashboard, Product page, Summary/Reviews tabs | DONE | UI polish needed |
| Phase 3 — chat-rag Edge Function + SSE streaming | DONE | Citations are badge-only, not clickable |
| Phase 3C — 6-query scope guard test suite | IN PROGRESS | Manual testing only |
| Phase 5 — Loading skeletons + toast notifications | TODO | UX gap |
| Phase 5 — Product deletion + Pinecone namespace cleanup | TODO | Data hygiene gap |
| PDF / Image ingestion pipeline | TODO | Core Progress_2 feature |
| Clickable evidence drawer (RAG citation → full review) | TODO | Core Progress_2 feature |
| AI Skill selector (prompt injection UI) | TODO | Core Progress_2 feature |
| AI Insight Report generator (agentic, one-click) | TODO | Core Progress_2 feature |
| Testing matrix (promptfoo CSV + LLM-as-Judge) | TODO | QA requirement |
| Cost estimation model | TODO | Business requirement |
| SaaS landing page | TODO | Go-to-market requirement |

| Column | Type | Purpose |
| --- | --- | --- |
| source_modality | TEXT | Values: 'csv' | 'paste' | 'url' | 'pdf' | 'image' |
| source_file_name | TEXT | Original filename for evidence drawer display |
| source_page_number | INTEGER | Page number for PDF chunks |
| spatial_metadata | JSONB | Bounding box coords: {x, y, width, height} for image/PDF highlight overlay |
| citation_anchor | TEXT | Anchor ID e.g. '2.1' for page 2, paragraph 1 |

| Design Target
User clicks [Review 3] badge → right-side drawer slides open → full review text rendered with reviewer name, star rating, date, and platform badge. For PDF/image sources: the original file is rendered with a yellow highlight overlay on the exact text chunk that was cited. |
| --- |

| Skill Name | Hidden Prompt Logic | Output Format | Ideal Input |
| --- | --- | --- | --- |
| Feature Extraction | Identify explicitly requested features. Categorize by frequency and urgency. | Bulleted list with citation anchors | High-volume CSV exports |
| UI Bug Detection | Identify interface friction, broken flows, error messages quoted verbatim by users. | Prioritized defect table by severity | CSV + screenshot images |
| Sentiment Analysis | Classify tone as: Aggressive / Frustrated / Neutral / Delighted / Evangelist. | Statistical breakdown + representative quotes | Yelp / Amazon CSV dumps |
| Competitor SWOT | Compare sentiment of primary product vs. mentioned competitors. Build SWOT matrix. | Markdown SWOT grid with citations | Scraped competitor URLs |
| Pricing Complaints | Isolate reviews mentioning price, cost, value, expensive, or refund. | Ranked complaint list + suggested pricing signals | Any modality |
| Executive Summary | Synthesize top 3 insights for a non-technical stakeholder. Max 200 words. | 3-paragraph narrative + 3 key citations | Any modality |

| Output: What the User Gets
A downloadable document containing three sections: (1) Evidence & Themes — MECE thematic clusters extracted from all reviews, each hyperlinked to source citations. (2) FAQ & Friction Points — the most common user questions and navigational failures synthesized from review language. (3) Action Items — prioritized product recommendations with specific, evidence-backed feature requests and checklist items. |
| --- |

| Agent Role | Deployment | Task & Output | Model |
| --- | --- | --- | --- |
| Orchestrator | generate-insight Edge Function | Accepts { product_id }. Calls Workers 1→2→3 sequentially. Merges outputs. Returns final report JSON. | GPT-4o |
| Worker 1: Themer | Internal call within Orchestrator | Query Pinecone for all review vectors (topK=50). Cluster into MECE themes. Return: [{theme, evidence_ids[], summary}]. | GPT-4o |
| Worker 2: FAQ Builder | Internal call within Orchestrator | Receive Worker 1 themes. Identify friction language patterns. Return: [{question, answer, source_reviews[]}]. | GPT-4o |
| Worker 3: Action Planner | Internal call within Orchestrator | Receive Workers 1+2. Prioritize by frequency × severity. Return: [{action, priority, supporting_evidence[]}]. | GPT-4o |

| ID | Input | Prompt | Pass Criteria | Priority |
| --- | --- | --- | --- | --- |
| TC_001 | Shopify CSV (500 rows) | What are the core complaints about shipping? | Must cite [Review N]. Must isolate shipping from unrelated praise. | HIGH |
| TC_002 | Image Upload (mobile crash screenshot) | Extract the exact error message shown. | Vision model returns exact string. Spatial bounding box encompasses text region. | HIGH |
| TC_003 | Live URL (Amazon ASIN) | Summarize sentiment trend for the last 6 months. | Scraper bypasses bot detection. Sarcastic reviews correctly classified as negative. | HIGH |
| TC_004 | Multi-page PDF (50-page UX report) | List all feature requests in chapter 3. | Document hierarchy respected. Citations map to page numbers. | HIGH |
| TC_005 | Yelp CSV (1000 rows) | Generate a competitor SWOT analysis. | SWOT accurately maps strengths/weaknesses. Competitor vs. core business differentiated. | MED |
| TC_006 | Paste text (5 reviews) | What is the weather today? | Scope guard fires. AI declines and states it can only answer about ingested reviews. | HIGH |
| TC_007 | CSV with emoji-heavy reviews | Overall sentiment analysis. | Emoji sentiment correctly mapped (😡 = negative, 😍 = positive). | MED |
| TC_008 | CSV with sarcastic reviews | What do customers love about this product? | Sarcastic praise (e.g. 'Oh wow, it broke in 2 days, great product') classified as negative. | HIGH |
| TC_009 | AI Insight Report (any 5+ reviews) | Auto-generate insight report. | All 3 sections present. Each action item has at least one citation. No hallucinated review IDs. | HIGH |
| TC_010 | Skill: UI Bug Detection + CSV | Extract all UI bug reports. | Output is a table. Every row maps to a real review. No invented bugs. | MED |

| User Action | Estimated Token Usage | Recommended Model | Est. Cost |
| --- | --- | --- | --- |
| Standard RAG chat query (10 reviews context) | ~2,500 tokens in / ~500 out | Claude Sonnet 4.6 | ~$0.018 |
| AI Insight Report (50 reviews, 3 worker agents) | ~40,000 tokens in / ~3,000 out | GPT-4o | ~$0.52 |
| PDF ingestion + OCR (50-page doc) | ~80,000 tokens in / ~5,000 out | GPT-4o (vision) | ~$1.05 |
| Image extraction (single screenshot) | ~2,000 tokens in / ~400 out | GPT-4o (vision) | ~$0.035 |
| CSV bulk embed (500 reviews) | 500 × 512 tokens | text-embedding-3-small | ~$0.013 |
| URL scrape + extract (20 reviews) | ~5,000 tokens in / ~1,000 out | GPT-4o | ~$0.065 |

| Tier | Price | Includes | Target User |
| --- | --- | --- | --- |
| Free | $0/mo | 3 products, 100 reviews/mo, text-only ingestion, chat only | For evaluation / students |
| Starter | $19/mo | 10 products, 1,000 reviews/mo, CSV + paste, basic chat + skill selector | Freelancers / small brands |
| Pro | $49/mo | 50 products, 10,000 reviews/mo, all modalities (PDF/image/URL), AI Insight Reports (5/mo) | Product managers / agencies |
| Enterprise | $199/mo | Unlimited products, unlimited reviews, custom skill library, API access, priority support | ORM agencies / SaaS companies |

| Week | Track | Deliverable | Priority | Status |
| --- | --- | --- | --- | --- |
| Week 1 | Track A | PDF ingestion (text-mode), schema migration, Supabase Storage setup, Image tab UI | HIGH | TODO |
| Week 1 | Track A | Image ingestion pipeline (GPT-4o vision extraction) | HIGH | TODO |
| Week 1 | Track E | promptfoo setup, TC_001–TC_006 test cases authored and passing | HIGH | TODO |
| Week 2 | Track B | chat-rag citation metadata emission, citations_ready SSE event | HIGH | TODO |
| Week 2 | Track B | EvidenceDrawer.jsx — text source view working | HIGH | TODO |
| Week 2 | Track B | EvidenceDrawer.jsx — image/PDF highlight overlay (spatial_metadata) | MED | TODO |
| Week 3 | Track C | SKILL_PROMPTS library (6 skills), SkillSelector.jsx pill UI | HIGH | TODO |
| Week 3 | Track C | Edge Function skill injection integration + test coverage | HIGH | TODO |
| Week 3 | Track E | TC_007–TC_010 test cases + CI GitHub Actions integration | MED | TODO |
| Week 4 | Track D | generate-insight Edge Function (3 worker agents) | HIGH | TODO |
| Week 4 | Track D | InsightReport.jsx (3-section UI + download PDF button) | HIGH | TODO |
| Week 4 | Track F | Cost model spreadsheet, finalize pricing tiers | MED | TODO |
| Week 5 | Track F | SaaS landing page (Next.js, hero + features + pricing) | MED | TODO |
| Week 5 | UI Polish | Loading skeletons, toast notifications, product deletion + Pinecone cleanup | LOW | TODO |
| Week 5 | Track E | Full QA pass: all 10 test cases green, CI enforced | HIGH | TODO |

| File Path | Track | Purpose |
| --- | --- | --- |
| src/components/chat/EvidenceDrawer.jsx | Track B | Slide-in evidence panel with source review and image highlight overlay |
| src/components/chat/SkillSelector.jsx | Track C | Skill pill selector rendered above chat input |
| src/components/product/InsightReport.jsx | Track D | Three-section insight report renderer |
| src/components/ingestion/PDFUploader.jsx | Track A | PDF drag-drop upload zone with page count preview |
| supabase/functions/generate-insight/index.ts | Track D | Orchestrator + 3 worker agent agentic pipeline |
| supabase/functions/extract-image/index.ts | Track A | GPT-4o vision extraction for uploaded images |
| supabase/migrations/002_multimodal_columns.sql | Track A | Adds source_modality, spatial_metadata, citation_anchor, source_file_name, source_page_number |
| tests/promptfoo/promptfooconfig.yaml | Track E | promptfoo evaluation config |
| tests/promptfoo/test_matrix.csv | Track E | All 10 test cases with prompts, payloads, and pass criteria |
| landing/ | Track F | Next.js 14 landing page (separate repo or /apps/landing in monorepo) |

| File Path | Track | Changes Required |
| --- | --- | --- |
| src/pages/NewProduct.jsx | Track A | Add Image tab (4th tab). Accept PDF/image MIME types. Route to new extraction functions. |
| src/components/ingestion/CSVUploader.jsx | Track A | Add PDF drag-drop support alongside CSV. Pass file type to parent. |
| src/pages/Product.jsx | Track B, C, D | Add Insight tab (4th tab). Pass skill to ChatInterface. Wire InsightReport component. |
| src/components/chat/ChatInterface.jsx | Track B, C | Add citations state. Wire SkillSelector. Open EvidenceDrawer on citation click. |
| src/components/chat/MessageBubble.jsx | Track B | Make [Review N] badges clickable. Fire onCitationClick callback. |
| supabase/functions/chat-rag/index.ts | Track B, C | Emit citations_ready SSE event with full review metadata. Accept and inject skill prompt. |
| supabase/functions/extract-reviews/index.ts | Track A | Add PDF text-extraction branch. Handle multimodal content routing. |
| supabase/functions/embed-reviews/index.ts | Track A | Embed citation_anchor text. Store source_modality in Pinecone metadata. |

| Variable | Location | Purpose |
| --- | --- | --- |
| SUPABASE_STORAGE_BUCKET | .env + Supabase secrets | Name of the Supabase Storage bucket for uploaded PDFs and images (e.g. 'reviews-media') |
| OPENAI_VISION_MODEL | Supabase secret | Model string for vision tasks (e.g. 'gpt-4o') — may differ from chat model for cost optimization |
| NEXT_PUBLIC_APP_URL | Landing page .env | Base URL of the main app for CTA links (e.g. 'https://review-lens-ai-five.vercel.app') |

| Package | Location | Use |
| --- | --- | --- |
| pdf-parse | Main app (Edge Function) | PDF text + page-number extraction |
| jspdf | Frontend | Client-side PDF generation for Insight Report download |
| promptfoo | Dev dependency | Automated LLM evaluation framework |
| framer-motion | Landing page | Scroll animations and hero demo animation |

| PROGRESS.md / TESTS.md Convention
This document should be committed to the repo root as PLANNING_PROGRESS2.md. Your AI coding agent sessions for Progress_2 should reference it as the source of truth. At the start of each session: load this document + the current PROGRESS.md. Mark tasks DONE as you complete them. The agent must refuse to start a new track until all tasks in the current track are marked DONE and passing tests confirm the feature works. |
| --- |