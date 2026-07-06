-- 004: Enable RLS on products + reviews (P3)
-- BREAKING for anonymous access — push ONLY after the auth-enabled frontend and
-- edge functions are deployed. The whole app sits behind login, so there are no
-- anon policies. Edge functions use the service role and bypass RLS; their
-- ownership checks live in application code (_shared/auth.ts).
-- Existing rows keep user_id = NULL and automatically become public demo data.

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews  ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: read own-or-demo; write own only.
CREATE POLICY "select own or demo products" ON products
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);

CREATE POLICY "insert own products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "update own products" ON products
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "delete own products" ON products
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- REVIEWS: scoped via parent product.
CREATE POLICY "select reviews of visible products" ON reviews
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = reviews.product_id
      AND (p.user_id = (SELECT auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "insert reviews for own products" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = reviews.product_id AND p.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "update reviews of own products" ON reviews
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = reviews.product_id AND p.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "delete reviews of own products" ON reviews
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = reviews.product_id AND p.user_id = (SELECT auth.uid())
  ));
