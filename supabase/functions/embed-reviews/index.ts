import { corsHeaders } from "../_shared/cors.ts";
import openai from "../_shared/openai.ts";
import { supabase } from "../_shared/supabase.ts";
import { pineconeIndex } from "../_shared/pinecone.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { product_id, namespace, review_ids } = await req.json();

    if (!product_id || !namespace || !review_ids?.length) {
      return new Response(
        JSON.stringify({
          error: "INVALID_INPUT",
          message: "product_id, namespace, and review_ids are required",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch reviews from Postgres
    const { data: reviews, error: fetchError } = await supabase
      .from("reviews")
      .select("id, reviewer_name, rating, review_text, review_date")
      .in("id", review_ids);

    if (fetchError) {
      throw new Error(`Failed to fetch reviews: ${fetchError.message}`);
    }

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({
          error: "NO_REVIEWS",
          message: "No reviews found for the given IDs",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build text representations for embedding
    const texts = reviews.map(
      (r: any) =>
        `Rating: ${r.rating}/5. Reviewer: ${r.reviewer_name || "Anonymous"}. ${r.review_text}`
    );

    // Batch embed — chunk at 100 per OpenAI call
    const allVectors: any[] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchReviews = reviews.slice(i, i + BATCH_SIZE);

      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
      });

      for (let j = 0; j < embeddingRes.data.length; j++) {
        const review = batchReviews[j];
        allVectors.push({
          id: `review-${review.id}`,
          values: embeddingRes.data[j].embedding,
          metadata: {
            product_id,
            rating: review.rating,
            review_date: review.review_date || "",
            text: review.review_text,
            reviewer_name: review.reviewer_name || "Anonymous",
          },
        });
      }
    }

    // Upsert to Pinecone namespace — max 100 per call
    for (let i = 0; i < allVectors.length; i += BATCH_SIZE) {
      const batch = allVectors.slice(i, i + BATCH_SIZE);
      await pineconeIndex.namespace(namespace).upsert(batch);
    }

    // Update pinecone_vector_id on each review row
    const updates = reviews.map((r: any) =>
      supabase
        .from("reviews")
        .update({ pinecone_vector_id: `review-${r.id}` })
        .eq("id", r.id)
    );
    await Promise.all(updates);

    // Set product status to ready
    const { error: statusError } = await supabase
      .from("products")
      .update({ status: "ready" })
      .eq("id", product_id);

    if (statusError) {
      throw new Error(`Failed to update product status: ${statusError.message}`);
    }

    return new Response(
      JSON.stringify({
        upserted_count: allVectors.length,
        namespace,
        product_status: "ready",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("embed-reviews error:", error);

    // Try to set product status to error
    try {
      const { product_id: pid } = await req.clone().json().catch(() => ({}));
      if (pid) {
        await supabase
          .from("products")
          .update({ status: "error" })
          .eq("id", pid);
      }
    } catch (_) {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({
        error: "EMBED_ERROR",
        message: error.message || "Failed to embed reviews",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
