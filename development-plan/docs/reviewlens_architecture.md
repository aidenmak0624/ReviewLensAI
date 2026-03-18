


ReviewLens AI
Architecture & Engineering Document
Review Intelligence Portal  ·  Technical Takeaway Assignment






Aiden Mak  ·  March 16, 2026

1 · System Overview
ReviewLens AI is a web-based Review Intelligence Portal that lets an ORM analyst ingest customer reviews for any tracked product, visualise the data landscape, and interrogate that data through a guardrailed conversational Q&A interface — without the AI ever drifting into general world knowledge or competitor platforms.

1.1  Design Principles
- Retrieval-grounded answers — every chat response is anchored to retrieved review vectors, not LLM prior knowledge
- Hard scope enforcement — the system prompt and retrieval namespace together make out-of-scope answers structurally impossible, not just instructed
- Zero hallucination surface — topK retrieval with metadata filters means the model only sees reviews for the current product
- Free-tier only — Supabase free, Pinecone free, OpenAI free credits, Vercel hobby tier
- No user auth required — publicly accessible URL per assignment spec

1.2  High-Level Data Flow


2 · Technology Stack
All services chosen for free-tier availability and zero ongoing cost.


3 · Database Schema
Two tables in Supabase Postgres. Row Level Security ensures each analyst only sees their own products and reviews. No auth is required for public demo access (RLS disabled for the assignment's no-login constraint, or a shared anonymous role is used).

3.1  products

create table products (
id                  uuid primary key default gen_random_uuid(),
name                text not null,
platform            text,  -- 'amazon' | 'g2' | 'google_maps' | 'yelp' | 'capterra'
source_url          text,  -- original target URL entered by analyst
total_reviews       int  default 0,
average_rating      numeric(3,2) default 0,
rating_distribution jsonb default '{"1":0,"2":0,"3":0,"4":0,"5":0}',
status              text default 'ingesting', -- ingesting | ready | error
ingestion_method    text, -- url_scrape | csv_upload | paste
pinecone_namespace  text, -- 'product-{id}' — scopes all vectors
created_at          timestamptz default now()
);


3.2  reviews

create table reviews (
id                 uuid primary key default gen_random_uuid(),
product_id         uuid references products(id) on delete cascade,
reviewer_name      text,
rating             smallint check (rating between 1 and 5),
review_text        text not null,
review_date        date,
verified           boolean default false,
helpful_count      int default 0,
pinecone_vector_id text,  -- 'review-{id}' — back-links to Pinecone
created_at         timestamptz default now()
);


4 · Ingestion Pipeline
Three ingestion modes converge on the same normalise → embed → upsert flow. The primary path is URL-based; the fallback paths (CSV and paste) are first-class, not workarounds — anti-bot measures on review platforms make them practically essential.

4.1  Ingestion Modes

4.2  extract-reviews Edge Function
OpenAI function-calling with a strict schema tool is the extraction engine for both CSV and paste modes. It handles messy, inconsistently formatted input and always returns a typed array.

// supabase/functions/extract-reviews/index.ts
const REVIEW_TOOL = {
name: 'save_reviews',
parameters: {
type: 'object',
properties: {
reviews: {
type: 'array',
items: {
required: ['reviewer_name', 'rating', 'review_text', 'review_date'],
properties: {
reviewer_name: { type: 'string' },
rating:        { type: 'integer', minimum: 1, maximum: 5 },
review_text:   { type: 'string' },
review_date:   { type: 'string', format: 'date' },
verified:      { type: 'boolean' },
helpful_count: { type: 'integer' }
}
}
}
}
}
};

const completion = await openai.chat.completions.create({
model: 'gpt-4o',
messages: [{ role: 'user', content: rawInput }],
tools: [{ type: 'function', function: REVIEW_TOOL }],
tool_choice: { type: 'function', function: { name: 'save_reviews' } }
});
const reviews = JSON.parse(completion.choices[0].message
.tool_calls[0].function.arguments).reviews;


4.3  embed-reviews Edge Function
After reviews are saved to Postgres, this function embeds each one and upserts into the product's Pinecone namespace. Metadata stored alongside the vector enables citation and filtering.

// Each review becomes a vector in namespace = product.pinecone_namespace
const texts = reviews.map(r =>
`Rating: ${r.rating}/5. Reviewer: ${r.reviewer_name}. ${r.review_text}`
);

const embeddingRes = await openai.embeddings.create({
model: 'text-embedding-3-small',
input: texts  // batched — max 100 per call
});

const vectors = embeddingRes.data.map((e, i) => ({
id:       `review-${reviews[i].id}`,
values:   e.embedding,
metadata: {
product_id:  productId,
rating:      reviews[i].rating,
review_date: reviews[i].review_date,
text:        reviews[i].review_text  // stored for citation in chat
}
}));

await pineconeIndex.namespace(namespace).upsert(vectors);


4.4  Ingestion Summary (Scraping Summary Requirement)
On completion, the product detail page renders a Scraping Summary panel fulfilling the assignment's requirement for 'a clear picture of what was captured.' It includes:
- Total reviews ingested and date range
- Rating distribution bar chart (1–5 stars, percentage + count)
- Sentiment breakdown (positive / neutral / negative derived from rating bands)
- Sample review table with search and star-filter
- Ingestion method badge (URL Scraped / CSV Upload / Pasted) + timestamp
This gives the analyst confidence the data is accurate, complete, and ready for Q&A before they open the chat panel.

5 · RAG Pipeline & Guardrailed Q&A
The chat interface is the assignment's primary deliverable. The RAG architecture makes the scope guard structurally sound — the model only receives review chunks from the current product's Pinecone namespace, so hallucinated cross-platform answers are architecturally blocked, not just instructed away.

5.1  Why Full RAG over a Simple LLM Call

5.2  chat-rag Edge Function

// supabase/functions/chat-rag/index.ts
const { question, productId, productName, platform, namespace, history } = await req.json();

// Step 1: Embed the analyst's question
const qEmbed = await openai.embeddings.create({
model: 'text-embedding-3-small', input: question
});

// Step 2: Retrieve top-8 semantically similar reviews
//         Namespace = 'product-{id}' — ONLY this product's vectors are reachable
const results = await pineconeIndex.namespace(namespace).query({
vector: qEmbed.data[0].embedding,
topK: 8,
includeMetadata: true
});

// Step 3: Build grounded context string with citations
const context = results.matches
.map((m, i) => `[Review ${i+1}] Rating: ${m.metadata.rating}/5 — ${m.metadata.text}`)
.join('\n');

// Step 4: Guardrailed system prompt
const SYSTEM_PROMPT = `
You are ReviewLens AI, a specialist review analyst for the product "${productName}"
tracked on ${platform}.

RULES — you must follow all of these without exception:
1. Answer ONLY using the review context provided below. Never use external knowledge.
2. If a question cannot be answered from the reviews, say:
"I can only answer questions about ${productName}'s ingested reviews.
That information isn't available in the review data."
3. Never discuss other products, platforms, competitors, or general world knowledge.
4. Cite review numbers (e.g. [Review 3]) when making specific claims.
5. If asked about weather, news, coding, or anything unrelated, decline explicitly.

REVIEW CONTEXT:
${context}
`;

// Step 5: Stream GPT-4o response
const stream = await openai.chat.completions.create({
model: 'gpt-4o', stream: true,
messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history,
{ role: 'user', content: question }]
});

// Step 6: Pipe as Server-Sent Events back to ChatInterface.jsx
const encoder = new TextEncoder();
const readable = new ReadableStream({
async start(controller) {
for await (const chunk of stream) {
const token = chunk.choices[0]?.delta?.content || '';
if (token) controller.enqueue(encoder.encode(`data: ${token}\n\n`));
}
controller.close();
}
});
return new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } });


5.3  Scope Guard — How It Works
The scope guard operates at two independent layers, making it highly robust:


Example guardrail trigger: if a user asks 'What do Amazon reviews say about this product?' while on a G2-sourced product, the model responds: "I can only answer questions about [Product Name]'s ingested reviews from G2. That information isn't available in the review data."

5.4  ChatInterface.jsx — Streaming Consumer
Replaces a polling/callback pattern with a native ReadableStream reader for smooth token-by-token rendering:

// components/chat/ChatInterface.jsx
const resp = await supabase.functions.invoke('chat-rag', {
body: { question, productId, productName, platform, namespace, history: messages }
});

// Stream tokens directly into the last message bubble
const reader = resp.data.getReader();
const decoder = new TextDecoder();
let assistantContent = '';

while (true) {
const { done, value } = await reader.read();
if (done) break;
const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
for (const line of lines) {
assistantContent += line.replace('data: ', '');
setMessages(prev => [  // Update in place — no flicker
...prev.slice(0, -1),
{ role: 'assistant', content: assistantContent }
]);
}
}


6 · Frontend Component Architecture


6.1  Page Routes

7 · Pinecone Vector Store Design


7.1  Namespace Lifecycle
- Created on first embed-reviews call after product creation (auto-created by Pinecone on first upsert)
- Queried on every chat-rag call with hardcoded namespace = product.pinecone_namespace
- Re-ingestion: deleteAll() on the namespace, then re-upsert — namespace is stateless
- Product deletion: call pineconeIndex.namespace(ns).deleteAll() before deleting Postgres row

7.2  Metadata Filtering (optional enhancement)
Pinecone metadata filters can scope retrieval further without reducing topK pool:

// Example: only retrieve 4-5 star reviews for a positive sentiment question
await pineconeIndex.namespace(namespace).query({
vector: queryEmbedding,
topK: 8,
filter: { rating: { '$gte': 4 } },  // Pinecone filter syntax
includeMetadata: true
});


8 · Deployment & Cost Breakdown

8.1  Deployment Architecture

8.2  Environment Variables
Frontend — .env

VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

Supabase Edge Functions — secrets

supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set PINECONE_API_KEY=...
supabase secrets set PINECONE_INDEX=reviewlens


8.3  Project Structure

reviewlens-ai/
├── src/
│   ├── api/
│   │   └── supabaseClient.js       ← shared Supabase client
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── dashboard/              ← ProductCard, StatsOverview
│   │   ├── ingestion/              ← CSVUploader, PasteReviews, ReviewPreview
│   │   ├── product/                ← RatingDistribution, ReviewTable, SentimentChart
│   │   └── chat/                   ← ChatInterface, MessageBubble
│   └── pages/                      ← Dashboard, NewProduct, Product
├── supabase/
│   ├── functions/
│   │   ├── _shared/                ← openai.ts, pinecone.ts (shared utils)
│   │   ├── extract-reviews/        ← OpenAI fn-calling extraction
│   │   ├── embed-reviews/          ← Pinecone upsert
│   │   └── chat-rag/               ← RAG chain + SSE streaming
│   └── migrations/                 ← products and reviews SQL
├── ai-transcripts/                 ← Claude Code / Cursor session logs
├── README.md
└── .env.example


8.4  Deploy Commands

# 1. Push DB migrations
supabase db push

# 2. Deploy Edge Functions
supabase functions deploy extract-reviews
supabase functions deploy embed-reviews
supabase functions deploy chat-rag

# 3. Set secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set PINECONE_API_KEY=...
supabase secrets set PINECONE_INDEX=reviewlens

# 4. Frontend
npm run build && vercel --prod


9 · Design Decisions & Tradeoffs


9.1  If Given More Time
- URL scraping via a Browserless.io free-tier endpoint (avoids running Playwright in Edge Functions)
- Citation UI — inline [Review 3] links in chat open the source review in a side panel
- Incremental ingestion — re-scrape on a schedule and add only new reviews (delta upsert to Pinecone)
- Sentiment scoring at ingest time (positive/neutral/negative label per review via a lightweight classifier)
- Export — download full Q&A session as PDF or Markdown for analyst reporting



ReviewLens AI  ·  Architecture Document  ·  Aiden Mak

| Stack | React + Vite · Tailwind CSS · shadcn/ui |
| --- | --- |
| Backend | Supabase (Postgres · Auth · Storage · Edge Functions) |
| Vector Store | Pinecone (namespace-per-product) |
| LLM | OpenAI GPT-4o (chat) · text-embedding-3-small (embeddings) |
| Ingestion | URL target + CSV fallback · OpenAI function-calling extraction |
| RAG | Full retrieval-augmented generation — no hallucinated context |
| Guardrails | System-prompt scope enforcement + hard refusal on out-of-scope queries |
| Hosting | Vercel (frontend) · Supabase Cloud (backend, free tier) |
| Cost | Zero — all free-tier services |

| ① Analyst enters URL (or uploads CSV / pastes text)
         ↓
② extract-reviews Edge Fn  →  OpenAI fn-calling  →  structured Review[]
         ↓
③ embed-reviews Edge Fn  →  text-embedding-3-small  →  Pinecone upsert
         ↓
④ Product page  →  rating charts, sentiment breakdown, review table
         ↓
⑤ Analyst types question  →  embed query  →  Pinecone topK=8 retrieval
         ↓
⑥ chat-rag Edge Fn  →  guardrailed prompt + chunks  →  GPT-4o stream
         ↓
⑦ SSE stream  →  ChatInterface token-by-token render |
| --- |

| Layer | Technology | Free Tier | Justification |
| --- | --- | --- | --- |
| Frontend | React + Vite | n/a | Fast HMR, tree-shaking, first-class TS support |
| UI | Tailwind CSS + shadcn/ui | Open source | Unstyled primitives — no design debt, full control |
| Database | Supabase Postgres | 500 MB, 2 projects | Relational + RLS + Storage + Edge Functions in one service |
| File Storage | Supabase Storage | 1 GB | CSV upload storage; signed URLs for secure access |
| Serverless | Supabase Edge Functions | 500K invocations/mo | Runs Deno; handles extraction, embedding, RAG chat |
| Vector Store | Pinecone | 2 GB, 1 index | Namespace-per-product isolation; same stack as Golden Fork |
| LLM | OpenAI GPT-4o | Free trial credits | Best instruction-following for guardrail compliance |
| Embeddings | text-embedding-3-small | Included in credits | 1536-dim, fast, low cost — sufficient for review-scale RAG |
| Hosting | Vercel | Hobby tier, unlimited | Zero-config Vite deploy; preview URLs per branch |
| Charts | Recharts | Open source | Composable React charts; no bundle bloat |

| Mode | Trigger | Notes |
| --- | --- | --- |
| URL Scrape | Analyst pastes product page URL | Playwright (headless) in Edge Function fetches page HTML; parser extracts review JSON-LD or DOM nodes. Falls back gracefully if blocked. |
| CSV Upload | Analyst drops a .csv file | Papa.parse in browser; columns mapped to Review schema via OpenAI function-calling. Handles any column naming convention. |
| Paste Text | Analyst pastes raw copied reviews | Raw text sent to extract-reviews Edge Function; OpenAI function-calling structures it. Most resilient — works even when scraping and CSV fail. |

| Simple LLM Call | Full RAG (this architecture) |
| --- | --- |
| Model answers from prior training knowledge | Model only sees retrieved review chunks — zero prior knowledge surface |
| Scope guard is instructional only — can be bypassed | Namespace isolation makes cross-product answers structurally impossible |
| No citation — analyst can't verify claims | Retrieved chunks stored in metadata — citations shown inline |
| Full review corpus in every prompt → expensive | topK=8 retrieval → minimal token usage, fast responses |
| Answers degrade for large datasets | Scales to unlimited reviews — retrieval quality stays constant |

| # | Layer | Mechanism |
| --- | --- | --- |
| 1 | Structural | Pinecone namespace isolation — the retrieval query is hardcoded to the product's namespace. The model never receives context from another product, so it literally cannot answer cross-product questions with any grounding. |
| 2 | Instructional | System prompt Rule 2 gives the model an explicit, verbatim decline script for out-of-scope questions, making the refusal message consistent and professional. |
| 3 | Conversational history | Full chat history is passed on each turn, so prior scope violations cannot sneak back in via follow-up phrasing. |

| Component | Responsibility |
| --- | --- |
| Layout.jsx | Top nav with product switcher + route Outlet |
| Dashboard.jsx | Product grid overview — stats tiles, product cards, New Product CTA |
| ProductCard.jsx | Per-product card: name, platform badge, review count, avg rating, status |
| StatsOverview.jsx | Aggregate tiles across all products |
| NewProduct.jsx | Three-tab ingestion form: URL / CSV Upload / Paste |
| CSVUploader.jsx | Drag-drop zone → Papa.parse → ReviewPreview |
| PasteReviews.jsx | Textarea → extract-reviews Edge Fn → ReviewPreview |
| ReviewPreview.jsx | Editable table of parsed rows before final save |
| Product.jsx | Detail page: tabs for Summary, Reviews table, Charts, Chat |
| IngestionSummary.jsx | Scraping summary panel — method badge, stats, completeness indicator |
| RatingDistribution.jsx | Star-level progress bars with counts and percentages |
| SentimentChart.jsx | Recharts horizontal BarChart — positive / neutral / negative bands |
| ReviewTable.jsx | Full-text search + star filter + pagination over reviews |
| ChatInterface.jsx | Chat panel — input, streaming message bubbles, scope-guard notices |
| MessageBubble.jsx | Single message: role avatar, content with citation highlights, timestamp |

| Route | Page |
| --- | --- |
| / | Dashboard — product grid + aggregate stats |
| /new | NewProduct — URL / CSV / paste ingestion tabs |
| /product?id=:uuid | Product detail — summary + review table + charts + chat |

| Setting | Value & Rationale |
| --- | --- |
| Index name | reviewlens  (single shared index — stays within free 1-index limit) |
| Dimension | 1536  (text-embedding-3-small output dimension) |
| Metric | cosine  (standard for semantic similarity) |
| Namespace pattern | product-{uuid}  — one namespace per product, complete isolation |
| Vector ID | review-{uuid}  — maps back to Postgres reviews.id for deduplication |
| Metadata fields | product_id (string), rating (int 1–5), review_date (string), text (string for citation) |
| topK — chat | 8  (sufficient context for most questions; keeps prompt tokens low) |
| topK — summary | 50  (used for analytics-level summarisation calls, optional) |

| Service | What Runs There | Free Tier Used |
| --- | --- | --- |
| Vercel | React + Vite frontend (static build) | Hobby — unlimited bandwidth, custom domain, preview deploys |
| Supabase Cloud | Postgres DB + Storage + Edge Functions | Free — 500 MB DB, 1 GB storage, 500K fn invocations/mo |
| Pinecone | Serverless vector index | Free — 2 GB storage, 1 index, unlimited queries |
| OpenAI | GPT-4o completions + embeddings | Free trial credits ($5–18 depending on account age) |

| Decision | Chosen Approach | Alternative & Why Not |
| --- | --- | --- |
| Scraping strategy | URL target + CSV/paste fallback | Puppeteer/Playwright scraping — anti-bot measures on G2/Amazon make this unreliable; CSV is more resilient for a prototype |
| Scope enforcement | Pinecone namespace isolation + system prompt | System prompt alone — purely instructional guards can be manipulated; namespace isolation is structural and cannot be bypassed |
| Embedding model | text-embedding-3-small | text-embedding-3-large — 3x more expensive, marginal quality gain for review-length text |
| Edge vs client RAG | RAG in Supabase Edge Function | Client-side RAG — would expose API keys in the browser; Edge Function keeps keys server-side |
| Vector store | Pinecone (namespace per product) | Supabase pgvector — simpler, but Pinecone's namespace isolation is cleaner for multi-product scoping |
| Streaming | SSE via ReadableStream | Polling or WebSocket — SSE is lighter, requires no persistent connection, and works over standard HTTP |
| No auth | Public routes, no login | Supabase Auth — assignment explicitly requires no login; RLS policies still added for production-readiness signal |