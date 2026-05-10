-- ─────────────────────────────────────────────────────────────────────────────
-- Admin Panel: user banning, reports table, admin RLS policies
-- Run once in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend profiles with ban fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned      boolean      DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason  text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at      timestamptz;

-- 2. Reports table (user-submitted fraud/scam reports)
CREATE TABLE IF NOT EXISTS reports (
  id                 uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id        uuid         REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id   uuid         REFERENCES profiles(id) ON DELETE SET NULL,
  reported_shop_id   uuid         REFERENCES shops(id)    ON DELETE SET NULL,
  reported_order_id  uuid         REFERENCES orders(id)   ON DELETE SET NULL,
  reason             text         NOT NULL,
  details            text,
  evidence_url       text,
  status             text         DEFAULT 'pending'
                                  CHECK (status IN ('pending','investigating','resolved','dismissed')),
  admin_notes        text,
  created_at         timestamptz  DEFAULT now(),
  resolved_at        timestamptz,
  resolved_by        uuid         REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 3. Helper function — avoids RLS recursion when checking admin role
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 4. RLS policies — admin can read/write everything

-- Profiles
DROP POLICY IF EXISTS "admin_select_profiles"  ON profiles;
CREATE POLICY "admin_select_profiles"  ON profiles FOR SELECT
  USING (auth_is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "admin_update_profiles"  ON profiles;
CREATE POLICY "admin_update_profiles"  ON profiles FOR UPDATE
  USING (auth_is_admin() OR id = auth.uid());

-- Shops
DROP POLICY IF EXISTS "admin_select_shops"     ON shops;
CREATE POLICY "admin_select_shops"     ON shops FOR SELECT
  USING (auth_is_admin() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "admin_update_shops"     ON shops;
CREATE POLICY "admin_update_shops"     ON shops FOR UPDATE
  USING (auth_is_admin() OR seller_id = auth.uid());

-- Orders
DROP POLICY IF EXISTS "admin_select_orders"    ON orders;
CREATE POLICY "admin_select_orders"    ON orders FOR SELECT
  USING (
    auth_is_admin()
    OR buyer_id = auth.uid()
    OR shop_id IN (SELECT id FROM shops WHERE seller_id = auth.uid())
  );

-- Order items
DROP POLICY IF EXISTS "admin_select_order_items" ON order_items;
CREATE POLICY "admin_select_order_items" ON order_items FOR SELECT
  USING (
    auth_is_admin()
    OR order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
    OR order_id IN (
      SELECT o.id FROM orders o
      JOIN shops s ON o.shop_id = s.id
      WHERE s.seller_id = auth.uid()
    )
  );

-- Products
DROP POLICY IF EXISTS "admin_select_products"  ON products;
CREATE POLICY "admin_select_products"  ON products FOR SELECT
  USING (auth_is_admin() OR status = 'active' OR shop_id IN (SELECT id FROM shops WHERE seller_id = auth.uid()));

DROP POLICY IF EXISTS "admin_update_products"  ON products;
CREATE POLICY "admin_update_products"  ON products FOR UPDATE
  USING (auth_is_admin() OR shop_id IN (SELECT id FROM shops WHERE seller_id = auth.uid()));

DROP POLICY IF EXISTS "admin_delete_products"  ON products;
CREATE POLICY "admin_delete_products"  ON products FOR DELETE
  USING (auth_is_admin() OR shop_id IN (SELECT id FROM shops WHERE seller_id = auth.uid()));

-- Reviews
DROP POLICY IF EXISTS "admin_select_reviews"   ON reviews;
CREATE POLICY "admin_select_reviews"   ON reviews FOR SELECT
  USING (auth_is_admin() OR buyer_id = auth.uid());

DROP POLICY IF EXISTS "admin_delete_reviews"   ON reviews;
CREATE POLICY "admin_delete_reviews"   ON reviews FOR DELETE
  USING (auth_is_admin() OR buyer_id = auth.uid());

-- Reports (anyone logged in can create; admin reads/updates all)
DROP POLICY IF EXISTS "insert_reports"         ON reports;
CREATE POLICY "insert_reports"         ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

DROP POLICY IF EXISTS "admin_select_reports"   ON reports;
CREATE POLICY "admin_select_reports"   ON reports FOR SELECT
  USING (auth_is_admin() OR reporter_id = auth.uid());

DROP POLICY IF EXISTS "admin_update_reports"   ON reports;
CREATE POLICY "admin_update_reports"   ON reports FOR UPDATE
  USING (auth_is_admin());
