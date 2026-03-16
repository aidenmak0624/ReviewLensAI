import { corsHeaders } from "../_shared/cors.ts";
import openai from "../_shared/openai.ts";
import { supabase } from "../_shared/supabase.ts";

const REVIEW_TOOL = {
  type: "function" as const,
  function: {
    name: "save_reviews",
    description:
      "Extract and save structured review data from the provided text. Extract ALL reviews found in the input.",
    parameters: {
      type: "object",
      required: ["reviews"],
      properties: {
        reviews: {
          type: "array",
          description: "Array of extracted reviews",
          items: {
            type: "object",
            required: ["reviewer_name", "rating", "review_text"],
            properties: {
              reviewer_name: {
                type: "string",
                description:
                  "Name of the reviewer. Use 'Anonymous' if not available.",
              },
              rating: {
                type: "integer",
                minimum: 1,
                maximum: 5,
                description: "Star rating from 1 to 5",
              },
              review_text: {
                type: "string",
                description: "The full review text content",
              },
              review_date: {
                type: "string",
                description:
                  "Review date in YYYY-MM-DD format. Use null if not available.",
              },
              verified: {
                type: "boolean",
                description: "Whether the reviewer is verified. Default false.",
              },
              helpful_count: {
                type: "integer",
                description: "Number of helpful votes. Default 0.",
              },
            },
          },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mode, raw_input, product_id } = await req.json();

    // Validate inputs
    if (!["url", "csv", "paste"].includes(mode)) {
      return new Response(
        JSON.stringify({ error: "INVALID_MODE", message: "mode must be one of: url, csv, paste" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!raw_input || raw_input.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "EMPTY_INPUT", message: "raw_input is required and cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: "MISSING_PRODUCT_ID", message: "product_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt based on mode
    let systemPrompt = "";
    if (mode === "csv") {
      systemPrompt =
        "You are a data extraction assistant. The user will provide CSV data containing product reviews. " +
        "Extract ALL reviews from the CSV. Map columns intelligently — column names may vary " +
        "(e.g., 'stars', 'score', 'rating' all mean the rating field). " +
        "If a rating is not on a 1-5 scale, normalize it to 1-5. " +
        "Use the save_reviews function to return the extracted data.";
    } else if (mode === "paste") {
      systemPrompt =
        "You are a data extraction assistant. The user will provide raw text containing product reviews. " +
        "The text may be in any format — copied from a website, informal notes, etc. " +
        "Extract ALL individual reviews you can identify. Infer ratings, reviewer names, and dates where possible. " +
        "If a rating is expressed as words (e.g., 'excellent'), convert to a 1-5 scale. " +
        "Use the save_reviews function to return the extracted data.";
    } else {
      systemPrompt =
        "You are a data extraction assistant. The user will provide HTML or text content from a review page. " +
        "Extract ALL individual reviews you can identify from this content. " +
        "Use the save_reviews function to return the extracted data.";
    }

    // Call OpenAI with function-calling
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: raw_input },
      ],
      tools: [REVIEW_TOOL],
      tool_choice: { type: "function", function: { name: "save_reviews" } },
      temperature: 0,
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({
          error: "EXTRACTION_FAILED",
          message: "OpenAI function-calling returned no results — check input format",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    const reviews = extracted.reviews || [];

    if (reviews.length === 0) {
      return new Response(
        JSON.stringify({
          error: "EXTRACTION_FAILED",
          message: "OpenAI function-calling returned zero reviews — check input format",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If product_id is "preview", skip DB operations — just return extracted reviews
    // The frontend will handle DB insertion in the confirm step
    if (product_id === "preview") {
      return new Response(
        JSON.stringify({
          reviews,
          review_ids: [],
          count: reviews.length,
          extraction_method: "openai_function_calling",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert reviews into Postgres (only when a real product_id is provided)
    const reviewRows = reviews.map((r: any) => ({
      product_id,
      reviewer_name: r.reviewer_name || "Anonymous",
      rating: Math.max(1, Math.min(5, r.rating || 3)),
      review_text: r.review_text,
      review_date: r.review_date || null,
      verified: r.verified || false,
      helpful_count: r.helpful_count || 0,
    }));

    const { data: insertedReviews, error: insertError } = await supabase
      .from("reviews")
      .insert(reviewRows)
      .select("id");

    if (insertError) {
      throw new Error(`Failed to insert reviews: ${insertError.message}`);
    }

    // Compute rating distribution and stats
    const ratingDist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    let totalRating = 0;
    for (const r of reviewRows) {
      ratingDist[String(r.rating)] = (ratingDist[String(r.rating)] || 0) + 1;
      totalRating += r.rating;
    }
    const avgRating = reviewRows.length > 0 ? totalRating / reviewRows.length : 0;

    // Determine ingestion method
    const ingestionMethod = mode === "csv" ? "csv_upload" : mode === "paste" ? "paste" : "url_scrape";

    // Update product with stats
    const { error: updateError } = await supabase
      .from("products")
      .update({
        total_reviews: reviewRows.length,
        average_rating: parseFloat(avgRating.toFixed(2)),
        rating_distribution: ratingDist,
        ingestion_method: ingestionMethod,
        pinecone_namespace: `product-${product_id}`,
      })
      .eq("id", product_id);

    if (updateError) {
      throw new Error(`Failed to update product: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        reviews,
        review_ids: insertedReviews?.map((r: any) => r.id) || [],
        count: reviews.length,
        extraction_method: "openai_function_calling",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-reviews error:", error);
    return new Response(
      JSON.stringify({
        error: "LLM_ERROR",
        message: error.message || "Upstream error — retry after 30 seconds",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
