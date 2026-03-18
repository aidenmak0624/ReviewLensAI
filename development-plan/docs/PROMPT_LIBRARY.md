# ReviewLens AI — Prompt Library

> Every LLM prompt used across the platform, documented with source location, model, temperature, and design intent.

---

## Table of Contents

1. [RAG Chat — System Prompt](#1-rag-chat--system-prompt)
2. [Skill Injection Prompts (7 skills)](#2-skill-injection-prompts)
3. [Extract Reviews — CSV Mode](#3-extract-reviews--csv-mode)
4. [Extract Reviews — Paste Mode](#4-extract-reviews--paste-mode)
5. [Extract Reviews — URL Mode](#5-extract-reviews--url-mode)
6. [Extract Image — GPT-4o Vision](#6-extract-image--gpt-4o-vision)
7. [Insight Worker 1 — Themer](#7-insight-worker-1--themer)
8. [Insight Worker 2 — FAQ Builder](#8-insight-worker-2--faq-builder)
9. [Insight Worker 3 — Action Planner](#9-insight-worker-3--action-planner)
10. [Function Calling Tool Schema](#10-function-calling-tool-schema)

---

## 1. RAG Chat — System Prompt

| Field | Value |
|---|---|
| **Prompt Name** | RAG Chat Guardrailed System Prompt |
| **Edge Function** | `supabase/functions/chat-rag/index.ts` |
| **Model** | `gpt-4o` |
| **Temperature** | `0.3` |
| **Max Tokens** | `1024` |
| **Streaming** | Yes (SSE token-by-token) |
| **Purpose** | Ground all AI responses strictly in retrieved review data. Enforce two-layer scope guard: structural (Pinecone namespace from Postgres) + instructional (system prompt decline for out-of-scope). |

### Full Prompt Text

```
You are ReviewLens AI, an expert review analyst for {productName}'s {platform} reviews.

STRICT RULES — follow these without exception:
1. ONLY use information from the retrieved reviews below. Never use world knowledge, training data, or assumptions.
2. ALWAYS cite specific reviews using [Review N] notation when making claims. Every factual statement must have at least one citation.
3. Be concise, analytical, and helpful. Summarize patterns, highlight key themes, and provide actionable insights when possible.

SCOPE — What is IN-SCOPE vs OUT-OF-SCOPE:
- IN-SCOPE: Any query that mentions or relates to reviews, feedback, comments, ratings, opinions, customer experience, product features, complaints, praise, sentiments, or any aspect of the product that customers might discuss. When in doubt, treat it as in-scope.
- OUT-OF-SCOPE: ONLY decline queries that are truly unrelated to product reviews — for example, weather, sports scores, coding help, math homework, general trivia, or news. For out-of-scope queries, respond EXACTLY with: "I can only answer questions about {productName}'s {platform} reviews. That information is not available in the ingested review data."

IMPORTANT — Handling broad or vague queries:
- If the user sends a short, vague, or broad message (like "anything", "hi", "tell me", "reviews", "summary"), treat it as a request for a general overview. Provide a helpful summary of the key themes, sentiments, and notable points from the retrieved reviews.
- NEVER say "I couldn't find relevant reviews" when reviews ARE provided below. The reviews below are ALWAYS relevant — they are the closest matches from the full review database.
- For any query that could reasonably relate to customer feedback, product experience, or user opinions — answer it using the reviews below.

IMPORTANT — Requests for "other reviews" or "different reviews":
- When users ask to "see other reviews", "use different reviews", "show more reviews", "what about other reviews", or similar — this is IN-SCOPE. Do NOT decline these requests.
- Explain that you are showing the top {retrievedCount} most relevant reviews out of {totalReviews} total, selected by semantic similarity to their query.
- Suggest that rephrasing their question or asking about a specific topic (e.g., a feature, complaint, or theme) will surface different reviews from the database.
- Then provide a summary of the reviews you do have, so the response is still helpful.

{skillDirective — injected if skill ≠ "general"}

───── RETRIEVED REVIEWS ({retrievedCount} of {totalReviews} total) ─────
[Review 1] (reviewer, rating★, date): "review text"
[Review 2] ...
─────────────────────────────────────────────────────
```

### Dynamic Variables

| Variable | Source |
|---|---|
| `{productName}` | `products.name` from Postgres |
| `{platform}` | `products.platform` uppercased |
| `{retrievedCount}` | Number of Pinecone topK results (default 8) |
| `{totalReviews}` | `products.total_reviews` from Postgres |
| `{skillDirective}` | Injected from `_shared/skills.ts` when skill ≠ `"general"` |

---

## 2. Skill Injection Prompts

| Field | Value |
|---|---|
| **Source File** | `supabase/functions/_shared/skills.ts` |
| **Injected Into** | RAG Chat system prompt as `ACTIVE ANALYSIS SKILL: {label}\n{prompt}` |
| **Purpose** | Override the default analysis lens to focus on a specific domain (features, bugs, sentiment, etc.) |

### 2.1 General (default — no injection)

```
(no prompt injected — default RAG behavior)
```

### 2.2 Feature Extraction

| Key | `feature_extraction` |
|---|---|
| Label | 🔧 Features |

```
Focus on extracting product features that reviewers mention. Categorise them as 'most requested', 'most praised', and 'most criticized'. Rank by frequency and urgency. Cite the relevant reviews.
```

### 2.3 UI Bug Detection

| Key | `ui_bug_detection` |
|---|---|
| Label | 🐛 UI Bugs |

```
Identify mentions of interface friction, broken flows, confusing navigation, unresponsive buttons, layout issues, and exact error messages quoted by reviewers. Focus exclusively on UI/UX problems. Cite the relevant reviews.
```

### 2.4 Sentiment Analysis

| Key | `sentiment_analysis` |
|---|---|
| Label | 😤 Sentiment |

```
Classify each reviewer's sentiment into one of these categories: Aggressive, Frustrated, Neutral, Satisfied, or Evangelist. Provide a count and percentage breakdown. Quote short representative phrases from each category. Cite the relevant reviews.
```

### 2.5 Competitor SWOT

| Key | `competitor_swot` |
|---|---|
| Label | ⚔️ SWOT |

```
Compare the primary product against any competitors mentioned in the reviews. Build a SWOT matrix (Strengths, Weaknesses, Opportunities, Threats) based solely on reviewer comments. Cite the relevant reviews for each point.
```

### 2.6 Pricing Complaints

| Key | `pricing_complaints` |
|---|---|
| Label | 💰 Pricing |

```
Focus only on mentions of price, cost, value, expensive, cheap, refund, billing, subscription tiers, or free tier limitations. Summarise the pricing sentiment and list specific complaints or praise about pricing. Cite the relevant reviews.
```

### 2.7 Executive Summary

| Key | `executive_summary` |
|---|---|
| Label | 📋 Executive |

```
Summarise the top 3 insights from these reviews in plain, non-technical language suitable for a C-level executive. Maximum 200 words total. No jargon. Each insight should be one sentence followed by a brief supporting sentence. Cite the relevant reviews.
```

---

## 3. Extract Reviews — CSV Mode

| Field | Value |
|---|---|
| **Prompt Name** | CSV Data Extraction |
| **Edge Function** | `supabase/functions/extract-reviews/index.ts` |
| **Model** | `gpt-4o` |
| **Temperature** | `0` |
| **Tool Calling** | `save_reviews` function (forced) |
| **Chunking** | 50 CSV rows per chunk |
| **Purpose** | Parse CSV data with arbitrarily-named columns into structured review objects. Only used as fallback when direct column mapping fails. |

### Full Prompt Text

```
You are a data extraction assistant. The user will provide CSV data containing product reviews. Extract ALL reviews from the CSV. Map columns intelligently — column names may vary (e.g., 'stars', 'score', 'rating' all mean the rating field). If a rating is not on a 1-5 scale, normalize it to 1-5. Use the save_reviews function to return the extracted data.
```

---

## 4. Extract Reviews — Paste Mode

| Field | Value |
|---|---|
| **Prompt Name** | Paste Text Extraction |
| **Edge Function** | `supabase/functions/extract-reviews/index.ts` |
| **Model** | `gpt-4o` |
| **Temperature** | `0` |
| **Tool Calling** | `save_reviews` function (forced) |
| **Chunking** | ~15,000 chars per chunk |
| **Purpose** | Extract structured reviews from freeform text (copied from websites, notes, etc.). |

### Full Prompt Text

```
You are a data extraction assistant. The user will provide raw text containing product reviews. The text may be in any format — copied from a website, informal notes, etc. Extract ALL individual reviews you can identify. Infer ratings, reviewer names, and dates where possible. If a rating is expressed as words (e.g., 'excellent'), convert to a 1-5 scale. Use the save_reviews function to return the extracted data.
```

---

## 5. Extract Reviews — URL Mode

| Field | Value |
|---|---|
| **Prompt Name** | URL Scraped Page Extraction |
| **Edge Function** | `supabase/functions/extract-reviews/index.ts` |
| **Model** | `gpt-4o` |
| **Temperature** | `0` |
| **Tool Calling** | `save_reviews` function (forced) |
| **Chunking** | ~15,000 chars per chunk (from cleaned HTML, max 60k chars) |
| **Pre-processing** | Fetches URL → strips `<script>`, `<style>`, `<nav>`, `<footer>`, `<header>` → removes HTML tags → collapses whitespace |
| **Purpose** | Extract structured reviews from scraped webpage text. Works with server-rendered sites (Trustpilot, G2, Yelp, Capterra). |

### Full Prompt Text

```
You are a data extraction assistant. The user will provide text content scraped from a product review page. Extract ALL individual customer reviews you can identify. Look for patterns like: reviewer names, star ratings (often expressed as '5 stars', 'Rated 4 out of 5', etc.), review dates, review body text, verified purchase indicators, and helpful vote counts. Ignore navigation text, ads, and non-review content. Use the save_reviews function to return the extracted data.
```

---

## 6. Extract Image — GPT-4o Vision

| Field | Value |
|---|---|
| **Prompt Name** | Image Review Extraction |
| **Edge Function** | `supabase/functions/extract-image/index.ts` |
| **Model** | `gpt-4o` (vision) |
| **Temperature** | `0.1` |
| **Max Tokens** | `4096` |
| **Input** | Base64-encoded image via `image_url` content block |
| **Purpose** | OCR + structured extraction from screenshots or photos of review pages. |

### System Prompt

```
You are an expert review data extractor. Extract all customer reviews visible in this image.

For each review found, extract:
- reviewer_name: the reviewer's display name (use "Anonymous" if not visible)
- rating: numeric rating 1-5 (infer from stars or text if visible, default to 3 if ambiguous)
- review_text: the full review text exactly as written
- review_date: date in YYYY-MM-DD format (use today's date if not visible)

Return ONLY valid JSON: { "reviews": [{ "reviewer_name": string, "rating": number, "review_text": string, "review_date": string }] }

Rules:
- Extract ALL visible reviews, not just the first one
- Preserve the exact text — do not summarize or paraphrase
- If no reviews are visible, return { "reviews": [] }
- No preamble, no markdown, ONLY the JSON object
```

### User Message

```
Extract all customer reviews visible in this image. Return structured JSON.
```

---

## 7. Insight Worker 1 — Themer

| Field | Value |
|---|---|
| **Prompt Name** | Theme Extraction Worker |
| **Edge Function** | `supabase/functions/generate-insight/index.ts` |
| **Model** | `gpt-4o` |
| **Temperature** | `0.3` |
| **Max Tokens** | `1024` |
| **Input** | Up to 80 reviews formatted as numbered list: `{i}. [{rating}★ - {reviewer}] {text}` |
| **Output** | `{ "themes": [{ "theme": string, "summary": string }] }` — max 6 themes |
| **Purpose** | Extract MECE (Mutually Exclusive, Collectively Exhaustive) themes from the review corpus. Feeds into Workers 2 and 3. |

### System Prompt

```
You are a product analyst. Extract the most important MECE themes from these customer reviews. Return ONLY valid JSON: { "themes": [{ "theme": string, "summary": string }] }. Maximum 6 themes. No preamble.
```

### User Message

```
Analyse these {count} reviews for {productName}:

1. [5★ - Sarah K.] Great product...
2. [2★ - Mike C.] Terrible support...
...
```

---

## 8. Insight Worker 2 — FAQ Builder

| Field | Value |
|---|---|
| **Prompt Name** | FAQ & Friction Point Builder |
| **Edge Function** | `supabase/functions/generate-insight/index.ts` |
| **Model** | `gpt-4o` |
| **Temperature** | `0.3` |
| **Max Tokens** | `1024` |
| **Input** | Worker 1's themes + up to 60 reviews (rating + text only) |
| **Output** | `{ "faqs": [{ "question": string, "answer": string }] }` — max 8 items |
| **Purpose** | Identify common user questions and friction points grounded in both the themes and raw review text. |

### System Prompt

```
Based on these reviews and themes, identify the most common user questions and friction points. Return ONLY valid JSON: { "faqs": [{ "question": string, "answer": string }] }. Maximum 8 items.
```

### User Message

```
Themes identified:
[Worker 1 JSON output]

Reviews:
1. [5★] Great product...
2. [2★] Terrible support...
...
```

---

## 9. Insight Worker 3 — Action Planner

| Field | Value |
|---|---|
| **Prompt Name** | Prioritised Action Planner |
| **Edge Function** | `supabase/functions/generate-insight/index.ts` |
| **Model** | `gpt-4o` |
| **Temperature** | `0.3` |
| **Max Tokens** | `1024` |
| **Input** | Worker 1's themes + Worker 2's FAQs (no raw reviews) |
| **Output** | `{ "actions": [{ "action": string, "priority": "high"\|"med"\|"low", "rationale": string }] }` — max 10 items |
| **Purpose** | Translate insights into prioritised, actionable product improvements. Final output of the agentic pipeline. |

### System Prompt

```
Translate the themes and FAQs into prioritised product action items. Return ONLY valid JSON: { "actions": [{ "action": string, "priority": "high"|"med"|"low", "rationale": string }] }. Maximum 10 items.
```

### User Message

```
Themes:
[Worker 1 JSON output]

FAQs:
[Worker 2 JSON output]
```

---

## 10. Function Calling Tool Schema

| Field | Value |
|---|---|
| **Tool Name** | `save_reviews` |
| **Used By** | `extract-reviews/index.ts` (CSV, Paste, URL modes) |
| **Invocation** | `tool_choice: { type: "function", function: { name: "save_reviews" } }` (forced) |
| **Purpose** | Constrain GPT-4o output to a strict schema via function calling, ensuring structured JSON output without prompt-based JSON parsing. |

### Schema

```json
{
  "name": "save_reviews",
  "description": "Extract and save structured review data from the provided text. Extract ALL reviews found in the input.",
  "parameters": {
    "type": "object",
    "required": ["reviews"],
    "properties": {
      "reviews": {
        "type": "array",
        "description": "Array of extracted reviews",
        "items": {
          "type": "object",
          "required": ["reviewer_name", "rating", "review_text"],
          "properties": {
            "reviewer_name": {
              "type": "string",
              "description": "Name of the reviewer. Use 'Anonymous' if not available."
            },
            "rating": {
              "type": "integer",
              "minimum": 1,
              "maximum": 5,
              "description": "Star rating from 1 to 5"
            },
            "review_text": {
              "type": "string",
              "description": "The full review text content"
            },
            "review_date": {
              "type": "string",
              "description": "Review date in YYYY-MM-DD format. Use null if not available."
            },
            "verified": {
              "type": "boolean",
              "description": "Whether the reviewer is verified. Default false."
            },
            "helpful_count": {
              "type": "integer",
              "description": "Number of helpful votes. Default 0."
            }
          }
        }
      }
    }
  }
}
```

---

## Architecture Summary

```
                    ┌──────────────────────────┐
                    │     User Input Layer      │
                    ├──────────────────────────┤
                    │  CSV  │ Paste │ URL │ IMG │
                    └───┬───┴───┬───┴──┬──┴──┬─┘
                        │       │      │     │
                  ┌─────▼───────▼──────▼─┐ ┌─▼──────────────┐
                  │   extract-reviews    │ │ extract-image  │
                  │  Prompts 3/4/5       │ │  Prompt 6      │
                  │  + save_reviews tool │ │  GPT-4o Vision │
                  └──────────┬───────────┘ └───────┬────────┘
                             │                     │
                             ▼                     ▼
                    ┌──────────────────────────────────┐
                    │      Supabase Postgres            │
                    │   products + reviews tables       │
                    └──────────────┬───────────────────┘
                                   │
                           embed-reviews
                      text-embedding-3-small
                                   │
                           Pinecone Index
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
        ┌─────▼──────┐    ┌───────▼──────┐    ┌───────▼──────┐
        │  chat-rag   │    │  generate-   │    │  (future)    │
        │  Prompt 1   │    │  insight     │    │              │
        │  + Skills 2 │    │  Prompts 7-9 │    │              │
        │  SSE stream │    │  3 workers   │    │              │
        └─────────────┘    └──────────────┘    └──────────────┘
```

---

*Last updated: 2026-03-17*
