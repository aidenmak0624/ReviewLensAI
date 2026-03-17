/**
 * generate-insight Edge Function — 3-worker agentic pipeline
 *
 * POST /functions/v1/generate-insight
 * Body: { product_id: string }
 * Response: { themes, faqs, actions }
 *
 * Worker 1 — Themer: Extract MECE themes (max 6)
 * Worker 2 — FAQ Builder: Identify friction points (max 8)
 * Worker 3 — Action Planner: Prioritised actions (max 10)
 */

import { corsHeaders } from "../_shared/cors.ts";
import openai from "../_shared/openai.ts";
import { supabase } from "../_shared/supabase.ts";

interface Theme {
  theme: string;
  summary: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface Action {
  action: string;
  priority: "high" | "med" | "low";
  rationale: string;
}

function parseJSON<T>(text: string): T {
  // Try to extract JSON from the response, handling markdown code blocks
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ||
    text.match(/```\s*([\s\S]*?)```/) ||
    text.match(/(\{[\s\S]*\})/);

  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }
  return JSON.parse(text.trim());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { product_id } = await req.json();

    if (!product_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: product_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate product exists and is ready
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, platform, status")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (product.status !== "ready") {
      return new Response(
        JSON.stringify({ error: "Product is not ready. Reviews must be embedded first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch up to 80 reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("id, reviewer_name, rating, review_text")
      .eq("product_id", product_id)
      .order("created_at", { ascending: false })
      .limit(80);

    if (reviewsError || !reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ error: "No reviews found for this product" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format reviews as numbered list
    const reviewList = reviews
      .map((r, i) => `${i + 1}. [${r.rating}★ - ${r.reviewer_name || "Anonymous"}] ${r.review_text}`)
      .join("\n");

    // ── Worker 1 — Themer ────────────────────────────────────────────────
    const themerResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            'You are a product analyst. Extract the most important MECE themes from these customer reviews. Return ONLY valid JSON: { "themes": [{ "theme": string, "summary": string }] }. Maximum 6 themes. No preamble.',
        },
        {
          role: "user",
          content: `Analyse these ${reviews.length} reviews for ${product.name}:\n\n${reviewList}`,
        },
      ],
    });

    const themerText = themerResponse.choices[0]?.message?.content || "";
    const { themes } = parseJSON<{ themes: Theme[] }>(themerText);

    // ── Worker 2 — FAQ Builder ───────────────────────────────────────────
    // Use up to 60 reviews for FAQ context
    const faqReviewList = reviews
      .slice(0, 60)
      .map((r, i) => `${i + 1}. [${r.rating}★] ${r.review_text}`)
      .join("\n");

    const faqResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            'Based on these reviews and themes, identify the most common user questions and friction points. Return ONLY valid JSON: { "faqs": [{ "question": string, "answer": string }] }. Maximum 8 items.',
        },
        {
          role: "user",
          content: `Themes identified:\n${JSON.stringify(themes, null, 2)}\n\nReviews:\n${faqReviewList}`,
        },
      ],
    });

    const faqText = faqResponse.choices[0]?.message?.content || "";
    const { faqs } = parseJSON<{ faqs: FAQ[] }>(faqText);

    // ── Worker 3 — Action Planner ────────────────────────────────────────
    const actionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            'Translate the themes and FAQs into prioritised product action items. Return ONLY valid JSON: { "actions": [{ "action": string, "priority": "high"|"med"|"low", "rationale": string }] }. Maximum 10 items.',
        },
        {
          role: "user",
          content: `Themes:\n${JSON.stringify(themes, null, 2)}\n\nFAQs:\n${JSON.stringify(faqs, null, 2)}`,
        },
      ],
    });

    const actionText = actionResponse.choices[0]?.message?.content || "";
    const { actions } = parseJSON<{ actions: Action[] }>(actionText);

    return new Response(
      JSON.stringify({ themes, faqs, actions }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-insight error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
