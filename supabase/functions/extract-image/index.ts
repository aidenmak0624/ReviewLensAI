/**
 * extract-image Edge Function — GPT-4o Vision extraction
 *
 * POST /functions/v1/extract-image
 * Body: { base64Image: string, mimeType: string, productId: string }
 * Response: { reviews: ReviewObject[] }
 *
 * Accepts a base64-encoded image (screenshot or photo of reviews),
 * uploads original to Supabase Storage, then uses GPT-4o vision
 * to extract structured review data.
 */

import { corsHeaders } from "../_shared/cors.ts";
import openai from "../_shared/openai.ts";
import { supabase } from "../_shared/supabase.ts";

interface ExtractedReview {
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { base64Image, mimeType, productId } = await req.json();

    if (!base64Image || !mimeType || !productId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: base64Image, mimeType, productId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate MIME type
    const allowedMimes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowedMimes.includes(mimeType)) {
      return new Response(
        JSON.stringify({
          error: `Unsupported image type: ${mimeType}. Allowed: png, jpg, jpeg, webp`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Upload original image to Supabase Storage ──────────────────
    const ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
    const timestamp = Date.now();
    const storagePath = `${productId}/${timestamp}.${ext}`;
    const bucket = Deno.env.get("STORAGE_BUCKET") || "reviews-media";

    // Decode base64 to Uint8Array for upload
    const binaryStr = atob(base64Image);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes, {
        contentType: mimeType,
        upsert: false,
      });

    let storageUrl = "";
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath);
      storageUrl = publicUrlData?.publicUrl || "";
    } else {
      console.warn("Storage upload failed (non-blocking):", uploadError.message);
    }

    // ── GPT-4o Vision extraction ──────────────────────────────────
    const systemPrompt = `You are an expert review data extractor. Extract all customer reviews visible in this image.

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
- No preamble, no markdown, ONLY the JSON object`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: "Extract all customer reviews visible in this image. Return structured JSON.",
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const rawContent = response.choices?.[0]?.message?.content || "";

    // Parse JSON — handle potential markdown code blocks
    let parsed: { reviews: ExtractedReview[] };
    try {
      const jsonStr = rawContent
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Failed to parse GPT-4o response as JSON",
          raw: rawContent,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Map to review objects with source metadata
    const reviews = (parsed.reviews || []).map((r: ExtractedReview) => ({
      reviewer_name: r.reviewer_name || "Anonymous",
      rating: Math.min(5, Math.max(1, Math.round(r.rating || 3))),
      review_text: r.review_text || "",
      review_date: r.review_date || new Date().toISOString().split("T")[0],
      source_modality: "image",
      source_file_name: storageUrl || storagePath,
    }));

    return new Response(JSON.stringify({ reviews }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-image error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
