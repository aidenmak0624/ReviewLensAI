/**
 * chat-rag Edge Function — RAG retrieval + GPT-4o SSE streaming
 *
 * POST /functions/v1/chat-rag
 * Body: { question: string, product_id: uuid, history: Message[] }
 * Response: text/event-stream — token-by-token SSE, ends with data: [DONE]
 *
 * Two-layer scope guard:
 *   Layer 1 (Structural): namespace resolved server-side from Postgres — never from client
 *   Layer 2 (Instructional): system prompt forces decline for out-of-scope queries
 */

import { corsHeaders } from "../_shared/cors.ts";
import openai from "../_shared/openai.ts";
import { pineconeIndex } from "../_shared/pinecone.ts";
import { supabase } from "../_shared/supabase.ts";
import { SKILL_PROMPTS } from "../_shared/skills.ts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, product_id, history = [], skill = "general" } = await req.json();

    if (!question || !product_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: question, product_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Layer 1: Server-side namespace resolution ──────────────────────
    // NEVER trust client-supplied namespace — always resolve from Postgres
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, platform, pinecone_namespace, total_reviews")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const namespace = product.pinecone_namespace || `product-${product.id}`;
    const productName = product.name;
    const platform = product.platform?.toUpperCase() || "UNKNOWN";

    // ── Step 1: Embed the user's question ──────────────────────────────
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    const questionVector = embeddingResponse.data[0].embedding;

    // ── Step 2: Retrieve top-K review chunks from Pinecone ─────────────
    const queryResponse = await pineconeIndex.namespace(namespace).query({
      vector: questionVector,
      topK: 8,
      includeMetadata: true,
    });

    const retrievedReviews = (queryResponse.matches || []).map((match, idx) => {
      const meta = match.metadata || {};
      return {
        index: idx + 1,
        id: match.id,
        reviewer: meta.reviewer_name || "Anonymous",
        rating: meta.rating || "N/A",
        text: meta.review_text || meta.text || "",
        date: meta.review_date || "",
        score: match.score?.toFixed(3) || "N/A",
      };
    });

    // ── Fetch full review records for citations ──────────────────────
    // Pinecone IDs are formatted as "review-{uuid}" — strip the prefix for Supabase lookup
    const reviewIds = retrievedReviews
      .map((r) => r.id?.replace(/^review-/, "") || "")
      .filter(Boolean);
    let citationReviews: Array<Record<string, unknown>> = [];
    if (reviewIds.length > 0) {
      const { data: fullReviews } = await supabase
        .from("reviews")
        .select(
          "id, reviewer_name, rating, review_text, review_date, verified, helpful_count, source_modality, source_file_name"
        )
        .in("id", reviewIds);

      if (fullReviews) {
        citationReviews = retrievedReviews
          .map((r) => {
            const rawId = r.id?.replace(/^review-/, "");
            const full = fullReviews.find((fr: any) => fr.id === rawId);
            return full ? { reviewNumber: r.index, ...full } : null;
          })
          .filter(Boolean) as Array<Record<string, unknown>>;
      }
    }

    // Build context block for the system prompt
    const contextBlock = retrievedReviews.length > 0
      ? retrievedReviews
          .map(
            (r) =>
              `[Review ${r.index}] (${r.reviewer}, ${r.rating}★, ${r.date}): "${r.text}"`
          )
          .join("\n\n")
      : "No relevant reviews found for this query.";

    // ── Layer 2: Guardrailed system prompt ─────────────────────────────
    // Inject skill directive if a non-general skill is selected
    const skillDirective =
      skill !== "general" && SKILL_PROMPTS[skill]?.prompt
        ? `\n\nACTIVE ANALYSIS SKILL: ${SKILL_PROMPTS[skill].label}\n${SKILL_PROMPTS[skill].prompt}\n`
        : "";

    const systemPrompt = `You are ReviewLens AI, an expert review analyst for ${productName}'s ${platform} reviews.

STRICT RULES — follow these without exception:
1. ONLY use information from the retrieved reviews below. Never use world knowledge, training data, or assumptions.
2. ALWAYS cite specific reviews using [Review N] notation when making claims. Every factual statement must have at least one citation.
3. Be concise, analytical, and helpful. Summarize patterns, highlight key themes, and provide actionable insights when possible.

SCOPE — What is IN-SCOPE vs OUT-OF-SCOPE:
- IN-SCOPE: Any query that mentions or relates to reviews, feedback, comments, ratings, opinions, customer experience, product features, complaints, praise, sentiments, or any aspect of the product that customers might discuss. When in doubt, treat it as in-scope.
- OUT-OF-SCOPE: ONLY decline queries that are truly unrelated to product reviews — for example, weather, sports scores, coding help, math homework, general trivia, or news. For out-of-scope queries, respond EXACTLY with: "I can only answer questions about ${productName}'s ${platform} reviews. That information is not available in the ingested review data."

IMPORTANT — Handling broad or vague queries:
- If the user sends a short, vague, or broad message (like "anything", "hi", "tell me", "reviews", "summary"), treat it as a request for a general overview. Provide a helpful summary of the key themes, sentiments, and notable points from the retrieved reviews.
- NEVER say "I couldn't find relevant reviews" when reviews ARE provided below. The reviews below are ALWAYS relevant — they are the closest matches from the full review database.
- For any query that could reasonably relate to customer feedback, product experience, or user opinions — answer it using the reviews below.

IMPORTANT — Requests for "other reviews" or "different reviews":
- When users ask to "see other reviews", "use different reviews", "show more reviews", "what about other reviews", or similar — this is IN-SCOPE. Do NOT decline these requests.
- Explain that you are showing the top ${retrievedReviews.length} most relevant reviews out of ${product.total_reviews || 0} total, selected by semantic similarity to their query.
- Suggest that rephrasing their question or asking about a specific topic (e.g., a feature, complaint, or theme) will surface different reviews from the database.
- Then provide a summary of the reviews you do have, so the response is still helpful.
${skillDirective}
───── RETRIEVED REVIEWS (${retrievedReviews.length} of ${product.total_reviews || 0} total) ─────
${contextBlock}
─────────────────────────────────────────────────────`;

    // ── Step 3: Build messages array with conversation history ──────────
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (limit to last 10 exchanges to stay within token budget)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add the current question
    messages.push({ role: "user", content: question });

    // ── Step 4: Stream GPT-4o response via SSE ─────────────────────────
    const chatStream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      stream: true,
      temperature: 0.3, // Low temperature for factual, grounded responses
      max_tokens: 1024,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatStream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token: content })}\n\n`)
              );
            }
          }
          // Emit full citation data for the frontend EvidenceDrawer
          if (citationReviews.length > 0) {
            controller.enqueue(
              encoder.encode(
                `event: citations_ready\ndata: ${JSON.stringify(citationReviews)}\n\n`
              )
            );
          }
          // Signal completion
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamError) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error: " + streamError.message })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("chat-rag error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
