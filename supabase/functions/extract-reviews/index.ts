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

/** Maximum number of CSV rows to process per LLM call */
const CHUNK_SIZE = 50;

/** Column name aliases for direct CSV mapping (case-insensitive) */
const COLUMN_ALIASES: Record<string, string[]> = {
  reviewer_name: ["reviewer_name", "reviewer", "name", "author", "user", "username", "user_name"],
  rating: ["rating", "stars", "score", "star_rating", "star"],
  review_text: ["review_text", "review", "text", "comment", "body", "content", "feedback", "description"],
  review_date: ["review_date", "date", "review_date", "created_at", "timestamp", "time", "posted"],
  verified: ["verified", "verified_purchase", "is_verified"],
  helpful_count: ["helpful_count", "helpful", "helpful_votes", "upvotes", "likes", "thumbs_up"],
};

/**
 * Try to map CSV columns directly without LLM.
 * Returns mapped reviews if at least reviewer_name/review_text columns are found.
 * Returns null if columns can't be confidently mapped.
 */
function tryDirectCSVMapping(csvText: string): any[] | null {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return null; // header + at least 1 row

  // Parse header — handle quoted headers
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));

  // Try to map each header to a known field
  const columnMap: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < headers.length; i++) {
      if (aliases.includes(headers[i])) {
        columnMap[field] = i;
        break;
      }
    }
  }

  // Require at least review_text to proceed
  if (columnMap.review_text === undefined) return null;

  // Parse all data rows
  const reviews: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (!cols.length) continue;

    const reviewText = cols[columnMap.review_text]?.trim();
    if (!reviewText) continue;

    const rating = columnMap.rating !== undefined ? parseInt(cols[columnMap.rating]) : 3;
    const verified = columnMap.verified !== undefined ? parseBool(cols[columnMap.verified]) : false;
    const helpful = columnMap.helpful_count !== undefined ? parseInt(cols[columnMap.helpful_count]) || 0 : 0;

    reviews.push({
      reviewer_name: columnMap.reviewer_name !== undefined ? cols[columnMap.reviewer_name]?.trim() || "Anonymous" : "Anonymous",
      rating: isNaN(rating) ? 3 : Math.max(1, Math.min(5, rating)),
      review_text: reviewText,
      review_date: columnMap.review_date !== undefined ? cols[columnMap.review_date]?.trim() || null : null,
      verified,
      helpful_count: helpful,
    });
  }

  return reviews.length > 0 ? reviews : null;
}

/** Parse a single CSV line respecting quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseBool(val: string): boolean {
  const v = val?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Split text into chunks of roughly CHUNK_SIZE CSV rows (for CSV) or by character count */
function chunkInput(rawInput: string, mode: string): string[] {
  if (mode === "csv") {
    const lines = rawInput.split("\n");
    const header = lines[0];
    const dataLines = lines.slice(1).filter((l) => l.trim());

    if (dataLines.length <= CHUNK_SIZE) return [rawInput];

    const chunks: string[] = [];
    for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
      const slice = dataLines.slice(i, i + CHUNK_SIZE);
      chunks.push(header + "\n" + slice.join("\n"));
    }
    return chunks;
  }

  // For paste/url: chunk by character count (~15000 chars per chunk)
  const MAX_CHARS = 15000;
  if (rawInput.length <= MAX_CHARS) return [rawInput];

  const chunks: string[] = [];
  let remaining = rawInput;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHARS) {
      chunks.push(remaining);
      break;
    }
    // Find a good split point (double newline or newline)
    let splitAt = remaining.lastIndexOf("\n\n", MAX_CHARS);
    if (splitAt < MAX_CHARS * 0.5) splitAt = remaining.lastIndexOf("\n", MAX_CHARS);
    if (splitAt < MAX_CHARS * 0.5) splitAt = MAX_CHARS;
    chunks.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trim();
  }
  return chunks;
}

/** Call OpenAI to extract reviews from a single chunk */
async function extractChunk(chunk: string, systemPrompt: string): Promise<any[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: chunk },
    ],
    tools: [REVIEW_TOOL],
    tool_choice: { type: "function", function: { name: "save_reviews" } },
    temperature: 0,
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall) return [];

  const extracted = JSON.parse(toolCall.function.arguments);
  return extracted.reviews || [];
}

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

    let reviews: any[] = [];
    let inputText = raw_input;

    // ── URL mode: fetch the page HTML first ──
    if (mode === "url") {
      const url = raw_input.trim();
      if (!/^https?:\/\//i.test(url)) {
        return new Response(
          JSON.stringify({ error: "INVALID_URL", message: "URL must start with http:// or https://" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Fetching URL: ${url}`);
      try {
        const pageResponse = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
        });

        if (!pageResponse.ok) {
          return new Response(
            JSON.stringify({
              error: "FETCH_FAILED",
              message: `Failed to fetch URL (HTTP ${pageResponse.status}). The site may block automated requests. Try CSV upload or paste instead.`,
            }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const html = await pageResponse.text();

        // Strip scripts, styles, and nav/footer noise to reduce token usage
        const cleaned = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<nav[\s\S]*?<\/nav>/gi, "")
          .replace(/<footer[\s\S]*?<\/footer>/gi, "")
          .replace(/<header[\s\S]*?<\/header>/gi, "")
          .replace(/<[^>]+>/g, " ")           // strip remaining HTML tags
          .replace(/\s{2,}/g, " ")            // collapse whitespace
          .trim();

        if (cleaned.length < 50) {
          return new Response(
            JSON.stringify({
              error: "EMPTY_PAGE",
              message: "The fetched page had no meaningful text content. Reviews may be loaded dynamically. Try CSV upload or paste instead.",
            }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Truncate to ~60k chars to stay within GPT-4o context limits
        inputText = cleaned.length > 60000 ? cleaned.substring(0, 60000) : cleaned;
        console.log(`Fetched ${html.length} chars HTML → ${inputText.length} chars cleaned text`);
      } catch (fetchErr) {
        return new Response(
          JSON.stringify({
            error: "FETCH_ERROR",
            message: `Could not reach URL: ${fetchErr.message}. Try CSV upload or paste instead.`,
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Fast path: try direct CSV column mapping (no LLM needed) ──
    if (mode === "csv") {
      const directMapped = tryDirectCSVMapping(raw_input);
      if (directMapped && directMapped.length > 0) {
        console.log(`Direct CSV mapping: ${directMapped.length} reviews extracted without LLM`);
        reviews = directMapped;
      }
    }

    // ── LLM extraction path (with chunking for large inputs) ──
    if (reviews.length === 0) {
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
          "You are a data extraction assistant. The user will provide text content scraped from a product review page. " +
          "Extract ALL individual customer reviews you can identify. " +
          "Look for patterns like: reviewer names, star ratings (often expressed as '5 stars', 'Rated 4 out of 5', etc.), " +
          "review dates, review body text, verified purchase indicators, and helpful vote counts. " +
          "Ignore navigation text, ads, and non-review content. " +
          "Use the save_reviews function to return the extracted data.";
      }

      const chunks = chunkInput(inputText, mode);
      console.log(`Processing ${chunks.length} chunk(s) via LLM`);

      // Process chunks — sequential to avoid rate limits
      for (const chunk of chunks) {
        const chunkReviews = await extractChunk(chunk, systemPrompt);
        reviews.push(...chunkReviews);
      }
    }

    if (reviews.length === 0) {
      return new Response(
        JSON.stringify({
          error: "EXTRACTION_FAILED",
          message: "No reviews could be extracted — check input format",
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
