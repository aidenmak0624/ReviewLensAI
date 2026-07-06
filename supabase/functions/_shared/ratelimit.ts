import { corsHeaders } from "./cors.ts";
import { supabase } from "./supabase.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

/** Per-user daily quotas. Day boundary is UTC midnight (computed in Postgres). */
export const LIMITS = { chat: 50, ingest: 5, insight: 10 } as const;
export type UsageAction = keyof typeof LIMITS;

const LABELS: Record<UsageAction, string> = {
  chat: "chat questions",
  ingest: "product ingestions",
  insight: "insight reports",
};

/**
 * Atomically increments the user's daily counter via the increment_usage RPC.
 * Returns a 429 Response when over limit, null when the request may proceed.
 * Fails CLOSED on RPC errors — the limiter exists to protect OpenAI spend, so
 * an unverifiable quota must not be treated as an open one.
 */
export async function enforceRateLimit(
  userId: string,
  action: UsageAction
): Promise<Response | null> {
  const limit = LIMITS[action];
  const { data: count, error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_action: action,
  });

  if (error || typeof count !== "number") {
    console.error("increment_usage RPC failed:", error?.message);
    return new Response(
      JSON.stringify({
        error: "RATE_LIMIT_ERROR",
        message: "Could not verify your daily quota. Please try again.",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }

  if (count > limit) {
    return new Response(
      JSON.stringify({
        error: "RATE_LIMITED",
        message: `Daily limit reached (${limit} ${LABELS[action]}/day). Your quota resets tomorrow (UTC).`,
        limit,
        remaining: 0,
      }),
      { status: 429, headers: jsonHeaders }
    );
  }

  return null;
}
