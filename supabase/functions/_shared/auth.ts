import { corsHeaders } from "./cors.ts";
import { supabase } from "./supabase.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

export interface AuthedUser {
  id: string;
  email?: string;
}

/**
 * Extract the Bearer token and validate it against Supabase Auth.
 * Returns either the authenticated user or a ready-made 401 Response.
 * A request carrying the raw anon key as Bearer fails this check by design.
 */
export async function requireUser(
  req: Request
): Promise<
  | { user: AuthedUser; errorResponse: null }
  | { user: null; errorResponse: Response }
> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { user: null, errorResponse: unauthorized() };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { user: null, errorResponse: unauthorized() };
  return { user: { id: data.user.id, email: data.user.email }, errorResponse: null };
}

function unauthorized(): Response {
  return new Response(
    JSON.stringify({
      error: "UNAUTHORIZED",
      message: "Please sign in to use ReviewLens AI.",
    }),
    { status: 401, headers: jsonHeaders }
  );
}

/** Read access: owner OR public demo product (user_id null). */
export function canReadProduct(
  product: { user_id: string | null },
  userId: string
): boolean {
  return product.user_id === null || product.user_id === userId;
}

/** Write/ingest access: owner only — demo products are read-only. */
export function ownsProduct(
  product: { user_id: string | null },
  userId: string
): boolean {
  return product.user_id === userId;
}

export function forbidden(
  message = "You don't have access to this product."
): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN", message }), {
    status: 403,
    headers: jsonHeaders,
  });
}
