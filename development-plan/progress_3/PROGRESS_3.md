# PROGRESS_3 — Auth + Per-User Rate Limiting

> Started 2026-07-06. Goal: publish the app for external testers with account
> isolation and OpenAI cost guardrails.
>
> Product decisions: email+password auth (Supabase Auth, open signup) · per-user
> daily quotas (chat 50 / ingest 5 / insight 10, UTC reset, HTTP 429 over limit) ·
> pre-existing ownerless data stays as public read-only demo products · whole app
> behind login.

## Phase 0 — Pre-work

- [x] Fix 13 pre-existing failing tests (localStorage shim in `test/setup.js`, fetch mocks in `NewProduct_ingestion.test.jsx`, `/g2\.com/i` → `/trustpilot\.com/i` matchers) — suite 173/173
- [x] README corrections (test counts, promptfoo path `LLMtests/promptfoo/`, `STORAGE_BUCKET` env var name)

## Phase 1 — Database

- [x] `003_auth_ownership_usage.sql` — `products.user_id` (NULL = demo), `usage_counters` table, `increment_usage()` SECURITY DEFINER RPC, `REVOKE EXECUTE` from client roles
- [x] `004_enable_rls.sql` — RLS on products/reviews: SELECT own-or-demo, write own-only (reviews scoped via parent product)

## Phase 2 — Edge Functions

- [x] `_shared/auth.ts` — `requireUser` (Bearer JWT → `auth.getUser`), `canReadProduct` (owner-or-demo), `ownsProduct`, `forbidden`
- [x] `_shared/ratelimit.ts` — `LIMITS {chat:50, ingest:5, insight:10}`, `enforceRateLimit` via RPC, fails closed, 429 with friendly message
- [x] `chat-rag` — requireUser + canReadProduct + chat quota (before first OpenAI call)
- [x] `extract-reviews` — requireUser + ownsProduct (non-preview) + ingest quota (before URL fetch / LLM loop)
- [x] `extract-image` — requireUser + ownsProduct (non-preview) + ingest quota (before storage upload / vision call)
- [x] `generate-insight` — requireUser + canReadProduct + insight quota (after readiness guard, before Worker 1)
- [x] `embed-reviews` — requireUser + strict ownsProduct + **security fix**: namespace resolved server-side from the product row (was client-supplied), reviews query scoped with `.eq("product_id", ...)`

## Phase 3 — Frontend

- [x] `src/context/AuthContext.jsx` — AuthProvider, useAuth, getAccessToken (single module = single test mock)
- [x] `src/components/RequireAuth.jsx` — hydration spinner (no redirect flash), redirect to /login
- [x] `src/pages/Login.jsx` — signin/signup toggle, error banner, handles confirmation on/off
- [x] `src/App.jsx` — AuthProvider wrapper, /login route, RequireAuth around the Layout route
- [x] `src/components/Layout.jsx` — user email + Sign out in navbar
- [x] `src/pages/NewProduct.jsx` — `user_id` stamped on insert, user token in 2 fetch headers, `errBody.message` plumbing, namespace removed from embed-reviews body
- [x] `src/pages/Product.jsx` — user token on generate-insight, `errBody.message` plumbing
- [x] `src/components/chat/ChatInterface.jsx` — user-scoped localStorage keys, user token, 429/401 special-case messages
- [x] `src/pages/Dashboard.jsx` — Demo badge on NULL-owner products

## Phase 4 — Tests (188/188 green)

- [x] AuthContext mock block added to 8 affected existing test files
- [x] `routing.test.jsx` — supabase.auth mock (vi.hoisted) + signed-out redirect case + /login route case
- [x] `test/progress_3/Login.test.jsx` (7 tests)
- [x] `test/progress_3/RequireAuth.test.jsx` (3 tests)
- [x] `test/progress_3/RateLimit429.test.jsx` (3 tests — chat bubble, ingestion banner, insight error card)

## Phase 5 — Deploy (ORDER MATTERS — see plan §3.5)

- [ ] Supabase dashboard: Email provider on, "Confirm email" OFF (user action)
- [ ] `supabase db push` — 003 only (additive, safe)
- [ ] Local browser verification (login flow, no redirect flash, sign out)
- [ ] Commit + push → Vercel frontend deploy
- [ ] `supabase functions deploy` × 5 (chat-rag, extract-reviews, extract-image, generate-insight, embed-reviews)
- [ ] `supabase db push` — 004 (RLS on; NEVER before the frontend ships)
- [ ] Two-account smoke test (demo visibility, ownership isolation, anon-key 401, 6th ingestion → 429)
- [ ] Check `LLMtests/promptfoo/promptfooconfig.yaml` — update Authorization to a test-user JWT if it uses the anon key
