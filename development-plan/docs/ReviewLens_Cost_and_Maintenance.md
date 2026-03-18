# ReviewLens AI — Cost Estimation & Maintenance Plan

> **Version 1.0 | March 2026 | Aiden (Chin Wei Mak)**

## Purpose

This document records the current infrastructure costs of ReviewLens AI, projects costs at scale, documents known technical debt, and outlines the P3 feature roadmap and ongoing maintenance schedule. It serves as both a financial reference and a handoff document.

---

## Section 1 — Current Infrastructure Costs

All services are currently running on free/hobby tiers. The total monthly cost at current usage is effectively $0 — appropriate for an MVP/portfolio stage application.

### 1.1 Monthly Fixed Costs (Current)

| Service | Plan | Included | Monthly Cost |
| --- | --- | --- | --- |
| Supabase | Free (Nano) | 500MB DB, 1GB Storage, 500K Edge Fn calls | $0 |
| Pinecone | Free (Starter) | 1 index, 2GB storage, ~500K vectors | $0 |
| Vercel (main app) | Hobby | 100GB bandwidth, unlimited deployments | $0 |
| Vercel (landing page) | Hobby | 100GB bandwidth, separate project | $0 |
| OpenAI API | Pay-as-you-go | No minimum — billed per token | Variable |
| Total fixed | — | — | $0/mo |

### 1.2 OpenAI API — Actual Usage Costs

OpenAI is the only real cost driver at current scale. Based on observed usage during development and testing:

| Action | Approx. Tokens | Model | Est. Cost |
| --- | --- | --- | --- |
| CSV ingest (100 reviews) | ~8,000 in / 2,000 out | GPT-4o | ~$0.11 |
| Image extraction (1 screenshot) | ~2,000 in / 400 out | GPT-4o vision | ~$0.035 |
| URL scrape + extract (20 reviews) | ~5,000 in / 1,000 out | GPT-4o | ~$0.065 |
| RAG chat query (standard) | ~2,500 in / 500 out | GPT-4o | ~$0.035 |
| Embed 100 reviews | ~51,200 tokens | text-embedding-3-small | ~$0.001 |
| AI Insight Report (3 workers) | ~33,000 in / 4,500 out | GPT-4o | ~$0.435 |
| promptfoo eval (6 test cases) | ~15,000 tokens total | GPT-4o | ~$0.20 |

> **Current Reality:** During the entire P1 + P2 development cycle including all testing, the estimated total OpenAI spend is under $5. At portfolio/demo scale with occasional users, expect $2–10/month in API costs.

---

## Section 2 — Scaling Cost Projections

### 2.1 When Free Tiers Run Out

| Service | Free Tier Limit | Upgrade Cost |
| --- | --- | --- |
| Supabase DB | 500MB database | Pro $25/mo — 8GB DB |
| Supabase Storage | 1GB file storage | Included in Pro, then $0.021/GB |
| Supabase Edge Functions | 500K invocations/mo | Included in Pro |
| Pinecone | ~500K vectors / 2GB | Starter $70/mo — 5GB+ |
| Vercel | 100GB bandwidth/mo | Pro $20/mo — 1TB bandwidth |
| OpenAI | No free tier — pay-as-you-go | Scales linearly with usage |

### 2.2 Monthly Cost by User Scale

| Scenario | Users | Queries/mo | Est. OpenAI | Total Est. |
| --- | --- | --- | --- | --- |
| Current (dev/demo) | 1–5 | ~50 | ~$2 | ~$2/mo |
| Early traction | 10–20 | ~500 | ~$18 | ~$18/mo |
| Small production | 50–100 | ~2,000 | ~$70 | ~$120/mo |
| Growth stage | 500+ | ~20,000 | ~$700 | ~$850/mo |

Note: 'Total Est.' includes OpenAI API + Supabase Pro ($25) + Pinecone Standard ($70) + Vercel Pro ($20) once free tiers are exceeded. Fixed infra cost = $115/mo baseline at production scale.

### 2.3 Cost Optimisation Levers

- **Batch API:** Use OpenAI Batch API for off-peak ingestion — up to 50% cost reduction on embedding and extraction calls.
- **Model routing:** Route simple scope-guard checks to Claude Haiku 4.5 ($0.38/M tokens) vs GPT-4o ($10/M tokens) — 26x cheaper for low-complexity tasks.
- **Response caching:** Cache identical questions on the same product (Upstash Redis) — estimated 15% hit rate at scale.
- **PDF escalation gate:** Only use GPT-4o vision OCR if text-mode yields < 100 words/page — reduces vision calls by ~70%.
- **Pinecone archiving:** Archive namespaces for products not queried in 90+ days to serverless index at ~60% lower storage cost.

---

## Section 3 — Known Technical Debt

The following items are known limitations accepted during MVP development. They are documented here for transparency and future resolution.

| Item | Description | Impact | Priority |
| --- | --- | --- | --- |
| URL scraper — page 1 only | Scraper fetches only the first page of results. Trustpilot has 387 reviews but only 68 extracted. | Low — CSV/paste covers full corpus | P3 |
| No user authentication | RLS is public read/write. No login required. Any user can see all products. | Medium — fine for demo, not for multi-tenant SaaS | P3 |
| PDF ingestion not implemented | PDF support deferred from P2. Only image upload currently works. | Low — image covers screenshots | P3 |
| 5 test timeouts in NewProduct | Pre-existing Vitest timeout failures in NewProduct rendering tests. Unrelated to P2 features. | Low — all feature tests pass | P3 |
| No Pinecone namespace cleanup | Deleting a product from the UI does not delete its Pinecone namespace. Vectors accumulate. | Low at current scale | P3 |
| No rate limiting on Edge Functions | Edge Functions have no per-user rate limiting. A single user could exhaust API quota. | Medium at scale | P3 |
| Landing page — no analytics | No conversion tracking or user behaviour analytics on the landing page. | Low | P3 |

---

## Section 4 — P3 Feature Roadmap

The following features are planned for Progress_3. They are prioritised by impact vs. complexity.

### 4.1 High Priority

| Feature | Description | Effort |
| --- | --- | --- |
| User authentication | Supabase Auth — email/password + Google OAuth. Each user sees only their own products. | Medium — 2–3 days |
| PDF ingestion | pdf-parse for text-mode PDFs. GPT-4o vision fallback for scanned PDFs. Citation anchors per page. | Medium — 2–3 days |
| URL scraper pagination | Fetch pages 1–5 for supported platforms (Trustpilot, G2, Capterra). Combine HTML before GPT-4o. | Small — 1 day |
| Pinecone namespace cleanup | On product delete: call Pinecone deleteNamespace API to remove all vectors for that product. | Small — 2 hours |

### 4.2 Medium Priority

| Feature | Description | Effort |
| --- | --- | --- |
| Multi-product comparison | Select 2–3 products and compare sentiment, themes, and ratings side by side. | Large — 4–5 days |
| Slack / email alerts | Webhook integration — alert when a new batch of reviews drops average rating below threshold. | Medium — 2 days |
| Rate limiting | Upstash Redis rate limiter on Edge Functions — max N requests per user per minute. | Small — 1 day |
| Landing page analytics | PostHog or Vercel Analytics for conversion tracking on the landing page. | Small — half day |

### 4.3 Nice to Have

| Feature | Description | Effort |
| --- | --- | --- |
| CSV export of insight report | Download the AI Insight Report as a formatted CSV in addition to PDF. | Small — 1 day |
| Scheduled re-ingestion | Cron job to re-scrape a URL weekly and surface new reviews automatically. | Large — 3–4 days |
| 90-second demo video | Screen recording of the full workflow for the landing page hero section. | Small — half day |
| Custom skill builder | Let users write their own skill prompt and save it for reuse. | Medium — 2 days |

---

## Section 5 — Maintenance Schedule

### 5.1 Routine Checks

| Frequency | Task | Where to Check |
| --- | --- | --- |
| Weekly | Check Supabase dashboard — DB size, Edge Function errors, Storage usage | supabase.com/dashboard |
| Weekly | Check Vercel dashboard — build status, error rate, bandwidth usage | vercel.com/dashboard |
| Weekly | Check Pinecone dashboard — vector count, index health | app.pinecone.io |
| Monthly | Review OpenAI API usage and costs | platform.openai.com/usage |
| Monthly | Run npm audit in both root and apps/landing — check for vulnerabilities | Terminal: npm audit |
| Monthly | Run npm run test — confirm all tests still passing after any dependency updates | Terminal |
| Quarterly | Update dependencies: npm update in root and apps/landing | Terminal |
| Quarterly | Review and clean up inactive Pinecone namespaces (products not queried in 90+ days) | Pinecone dashboard |
| As needed | Redeploy Edge Functions after any supabase/functions/ changes | supabase functions deploy |

### 5.2 Emergency Procedures

#### App is down / Edge Function errors

- Check Supabase Edge Function logs: supabase.com/dashboard — Edge Functions — Logs
- Check if API keys expired: Supabase dashboard — Settings — API — check key rotation
- Check Vercel deployment status: vercel.com — your project — Deployments

#### OpenAI costs spiking unexpectedly

- Check platform.openai.com/usage for breakdown by model and endpoint
- Set a spend limit at platform.openai.com/account/limits
- Review recent Edge Function logs for unusual call patterns

#### Pinecone index full

- Delete unused namespaces: identify products with 0 recent queries
- Upgrade Pinecone plan if needed: app.pinecone.io — Billing

---

## Section 6 — Summary

| Item | Value |
| --- | --- |
| Current monthly cost | ~$0–5 (OpenAI API only, usage-based) |
| Break-even scale | ~10–20 active users before any paid plan needed |
| First paid upgrade | Supabase Pro ($25/mo) when DB approaches 400MB |
| Production baseline cost | $115/mo fixed (Supabase + Pinecone + Vercel) + variable OpenAI |
| Gross margin at Pro tier ($49/mo) | ~63% |
| Open technical debt items | 7 items — all low/medium impact, none blocking |
| P3 estimated effort | ~15–20 dev days for all high + medium priority features |
| Test coverage | 168/173 unit tests passing + 6/6 LLM eval (promptfoo) |

> **Bottom Line:** ReviewLens AI is production-ready for demo and early-user scale at near-zero cost. The architecture is designed to scale — moving to paid tiers is a deliberate upgrade decision, not an emergency, and gross margins remain healthy (60–80%) across all pricing tiers.
