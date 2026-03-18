# ReviewLens AI — Cost Estimation & SaaS Unit Economics

> **Version 1.0 | March 2026 | Aiden (Chin Wei Mak)**

## Purpose

This document models the cloud infrastructure costs of operating ReviewLens AI at various user scales, derives sustainable SaaS pricing tiers, and projects gross margin at each tier. It is the financial input for go-to-market planning and investor conversations.

> **Key Principle:** Every user action in an AI-native SaaS burns real GPU compute. Flat-rate pricing models are existential risks — a power user on a $20/mo plan can cost $200/mo to serve. The hybrid credit model solves this.

---

## Section 1 — Cost Per User Action

### 1.1 LLM Inference Costs (March 2026 Pricing)

| User Action | Token Usage (est.) | Model | Est. Cost |
| --- | --- | --- | --- |
| Standard RAG chat query (10 review context) | 2,500 in / 500 out | Claude Sonnet 4.6 | $0.018 |
| Deep RAG chat query (50 review context) | 12,000 in / 1,000 out | GPT-4o | $0.085 |
| PDF ingestion — text mode (50 pages) | 15,000 in / 2,000 out | GPT-4o | $0.22 |
| PDF ingestion — vision OCR (10 pages, scanned) | 80,000 in / 3,000 out | GPT-4o (vision) | $1.05 |
| Image extraction (1 screenshot) | 2,000 in / 400 out | GPT-4o (vision) | $0.035 |
| CSV bulk embed (500 reviews) | 500 × 512 tokens | text-embedding-3-small | $0.013 |
| AI Insight Report — Worker 1 (Themer) | 15,000 in / 2,000 out | GPT-4o | $0.195 |
| AI Insight Report — Worker 2 (FAQ) | 10,000 in / 1,500 out | GPT-4o | $0.135 |
| AI Insight Report — Worker 3 (Actions) | 8,000 in / 1,000 out | GPT-4o | $0.105 |
| AI Insight Report — total (3 workers) | ~33,000 in / 4,500 out | GPT-4o | ~$0.435 |

### 1.2 Infrastructure Costs (Fixed + Variable)

| Service | Pricing Model | Estimated Monthly Cost |
| --- | --- | --- |
| Supabase (Pro plan) | Flat $25/mo — includes 8GB DB, 100GB storage, Edge Functions | $25/mo flat |
| Pinecone (Starter/Standard) | Pay per pod. 1 p1.x1 pod ≈ 1M vectors | $70/mo per pod |
| Vercel (Pro) | Flat $20/mo — includes main app + landing page | $20/mo flat |
| OpenAI API | Pay-per-token (see 1.1) | Variable — usage based |
| Total fixed infra (no AI) | Supabase + Pinecone + Vercel | ~$115/mo |

---

## Section 2 — Credit System Design

### 2.1 Credit Unit Definition

1 Credit = $0.01 of underlying compute cost (rounded up to nearest credit). This provides a simple, transparent unit that maps directly to infrastructure spend.

| Action | Credits Consumed | Rationale |
| --- | --- | --- |
| Standard chat query (text) | 2 credits ($0.02) | Low-cost Sonnet model, small context |
| Deep chat query (large context) | 9 credits ($0.09) | GPT-4o, large context window |
| PDF ingestion — text mode | 22 credits ($0.22) | Moderate token cost |
| PDF ingestion — vision OCR (scanned) | 105 credits ($1.05) | Vision model expensive — discourage casual use |
| Image extraction | 4 credits ($0.04) | Vision but small payload |
| CSV embed (500 reviews) | 2 credits ($0.02) | Embedding is cheap |
| AI Insight Report | 44 credits ($0.44) | 3 workers, high token count |

### 2.2 Monthly Credit Bundles

| Bundle | Credits | Price / Effective Rate |
| --- | --- | --- |
| Starter Pack | 200 credits | $9.99 — $0.050/credit |
| Growth Pack | 600 credits | $24.99 — $0.042/credit |
| Pro Pack | 2,000 credits | $69.99 — $0.035/credit |
| Enterprise Pack | 10,000 credits | $249.99 — $0.025/credit |

---

## Section 3 — SaaS Pricing Tiers & Margin Model

### 3.1 Tier Definitions

| Tier | Price | Included | Overage |
| --- | --- | --- | --- |
| Free | $0/mo | 3 products, 100 reviews/mo, text-only, 50 credits/mo | Upgrade prompt — no overage |
| Starter | $19/mo | 10 products, 1,000 reviews/mo, CSV + paste, 200 credits/mo | $9.99 per +200 credits |
| Pro | $49/mo | 50 products, 10,000 reviews/mo, all modalities, 5 Insight Reports, 800 credits/mo | $24.99 per +600 credits |
| Enterprise | $199/mo | Unlimited, API access, custom skills, 4,000 credits/mo, priority SLA | $69.99 per +2,000 credits |

### 3.2 Gross Margin Model — Typical User Scenario

#### Free User

| Metric | Value |
| --- | --- |
| Revenue | $0 |
| Infra allocation (fixed, per user) | $2.30 (assuming 50 free users sharing fixed costs) |
| Avg AI usage | 10 chat queries/mo + 1 CSV ingest = ~$0.22 |
| Total cost to serve | ~$2.52 |
| Gross margin | -$2.52 (acquisition cost — acceptable for trial conversion) |

#### Starter User ($19/mo)

| Metric | Value |
| --- | --- |
| Revenue | $19.00 |
| Infra allocation (fixed) | $5.75 |
| Avg AI usage | 30 queries + 3 CSV + 1 Insight Report = ~$1.80 |
| Total cost to serve | ~$7.55 |
| Gross profit | $11.45 |
| Gross margin | ~60% |

#### Pro User ($49/mo)

| Metric | Value |
| --- | --- |
| Revenue | $49.00 |
| Infra allocation (fixed) | $11.50 |
| Avg AI usage | 100 queries + 10 CSV + 5 PDF + 5 Insight Reports = ~$6.50 |
| Total cost to serve | ~$18.00 |
| Gross profit | $31.00 |
| Gross margin | ~63% |

#### Enterprise User ($199/mo)

| Metric | Value |
| --- | --- |
| Revenue | $199.00 + avg $50 overage = $249 |
| Infra allocation (fixed) | $23.00 |
| Avg AI usage | 500 queries + 50 CSVs + 20 PDFs + 20 Insight Reports = ~$25 |
| Total cost to serve | ~$48.00 |
| Gross profit | $201.00 |
| Gross margin | ~80% |

---

## Section 4 — Scale Projections

### 4.1 Monthly Recurring Revenue Scenarios

| Scenario | Free | Starter | Pro | Enterprise | Est. MRR |
| --- | --- | --- | --- | --- | --- |
| Early (Month 3) | 100 | 20 | 5 | 1 | $598 |
| Growth (Month 6) | 500 | 80 | 25 | 5 | $3,517 |
| Scale (Month 12) | 2,000 | 300 | 100 | 20 | $17,880 |
| Mature (Month 18) | 5,000 | 800 | 300 | 60 | $53,800 |

### 4.2 Cost Optimization Levers

- **Batch processing:** Use OpenAI Batch API for off-peak ingestion jobs — up to 50% cost reduction on embedding and extraction calls.
- **Model routing:** Route simple queries (scope guard, basic sentiment) to Claude Haiku 4.5 ($0.38/M tokens) vs. GPT-4o ($10/M tokens) — 26x cost reduction on low-complexity tasks.
- **Caching:** Cache identical questions on the same product (Redis/Upstash). Hit rate ~15% at scale — meaningful savings.
- **PDF escalation gate:** Only escalate to vision OCR if text-mode yields < 100 words/page. Reduces vision API calls by ~70% (most PDFs are digitally generated).
- **Pinecone optimization:** Archive inactive namespaces (products not queried in 90+ days) to serverless index at ~60% lower storage cost.

---

## Section 5 — Risk Flags

| Risk | Mitigation |
| --- | --- |
| Power user on Free tier burns disproportionate credits | Hard credit cap on Free (50/mo). No overage — upgrade prompt shown. |
| Vision OCR costs spike with large PDF uploads | File size limit (20MB). Vision escalation gate (< 100 words/page heuristic). Credit cost clearly shown before processing. |
| OpenAI price changes (historically volatile) | Model-agnostic Edge Function design. Swap models without frontend changes. Dual vendor (OpenAI + Anthropic) reduces single-provider risk. |
| Pinecone storage grows unbounded | 90-day archive policy for inactive namespaces. Product deletion includes Pinecone namespace cleanup (currently TODO in Progress_2). |
| Insight Report generates 3x the expected tokens | Set max_tokens caps on each worker agent. If Worker 1 output > 8K tokens, truncate and log — downstream workers use truncated version. |
