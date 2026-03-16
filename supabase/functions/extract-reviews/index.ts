// Extract reviews Edge Function — placeholder
// Will be fully implemented in Phase 1B
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mode, raw_input, product_id } = await req.json();

    return new Response(
      JSON.stringify({
        reviews: [],
        count: 0,
        extraction_method: "openai_function_calling",
        message: "extract-reviews endpoint ready — implementation pending",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
