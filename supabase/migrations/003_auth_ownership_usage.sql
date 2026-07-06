-- 003: Auth ownership + per-user usage counters (P3)
-- Purely additive — safe to push while the pre-auth frontend is still live.
-- products.user_id NULL = public demo product (readable by all, writable by none).

ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Per-user, per-day usage counters (day boundary: UTC midnight)
CREATE TABLE IF NOT EXISTS usage_counters (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action  text NOT NULL CHECK (action IN ('chat', 'ingest', 'insight')),
  day     date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count   int  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action, day)
);

ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Users may read their own usage (future quota UI); only the service role writes.
CREATE POLICY "read own usage" ON usage_counters
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- Atomic increment-and-return, called ONLY by service-role edge functions.
-- Single-statement upsert takes a row lock, so concurrent calls cannot race;
-- rejected over-limit requests may increment past the limit, which is harmless
-- because the check is `count > limit`.
CREATE OR REPLACE FUNCTION increment_usage(p_user_id uuid, p_action text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO usage_counters (user_id, action, day, count)
  VALUES (p_user_id, p_action, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, action, day)
  DO UPDATE SET count = usage_counters.count + 1
  RETURNING count;
$$;

-- Clients must not be able to burn other users' quota by calling the RPC with
-- an arbitrary uuid. Service-role bypasses grants, so this costs nothing.
REVOKE EXECUTE ON FUNCTION increment_usage(uuid, text) FROM public, anon, authenticated;
