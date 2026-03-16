// Embed reviews Edge Function — placeholder
// Will be fully implemented in Phase 1C
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { product_id, namespace, review_ids } = await req.json();

    return new Response(
      JSON.stringify({
        upserted_count: 0,
        namespace,
        product_status: "ready",
        message: "embed-reviews endpoint ready — implementation pending",
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
