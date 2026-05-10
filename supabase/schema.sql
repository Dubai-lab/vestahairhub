-- ============================================================
-- VestaHairHub — Supabase Schema + RLS Policies
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'buyer'
                  CHECK (role IN ('buyer', 'seller', 'admin')),
  phone       TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- A user can always read their own profile
CREATE POLICY "profiles: user can select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Sellers are publicly discoverable (marketplace)
CREATE POLICY "profiles: public can view sellers"
  ON public.profiles FOR SELECT
  USING (role = 'seller');

-- A user can insert their own profile row (created by trigger, but fallback)
CREATE POLICY "profiles: user can insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- A user can update only their own profile
CREATE POLICY "profiles: user can update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── is_admin() helper — MUST be SECURITY DEFINER ─────────────
-- Without SECURITY DEFINER this bypasses nothing and silently
-- returns false when profiles RLS is enabled.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── Auto-create profile on signup ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── updated_at helper ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── CATEGORIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "categories: public read"
  ON public.categories FOR SELECT
  USING (true);

-- Only admins can manage
CREATE POLICY "categories: admin manage"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- Seed data
INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('Hair',          'hair',          'Natural hair, wigs, weaves, braids and extensions', '💇'),
  ('Nails',         'nails',         'Nail products, press-ons, gels and accessories',    '💅'),
  ('Hair Products', 'hair-products', 'Hair care, oils, creams and treatment products',    '🧴'),
  ('Eyelashes',     'eyelashes',     'Mink, synthetic and strip lashes',                  '👁️')
ON CONFLICT (slug) DO NOTHING;

-- ─── SHOPS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shops (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url    TEXT,
  banner_url  TEXT,
  theme_color TEXT NOT NULL DEFAULT '#C8851A',
  country     TEXT,
  city        TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended', 'pending')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Anyone can browse active shops
CREATE POLICY "shops: public read active"
  ON public.shops FOR SELECT
  USING (status = 'active');

-- Sellers can always see their own shop (even if pending/suspended)
CREATE POLICY "shops: seller read own"
  ON public.shops FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can create their own shop
CREATE POLICY "shops: seller insert own"
  ON public.shops FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own shop
CREATE POLICY "shops: seller update own"
  ON public.shops FOR UPDATE
  USING (auth.uid() = seller_id);

-- Admins have full access
CREATE POLICY "shops: admin all"
  ON public.shops FOR ALL
  USING (public.is_admin());

CREATE OR REPLACE TRIGGER shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── SHOP PAYMENT METHODS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_payment_methods (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  method_type    TEXT NOT NULL CHECK (method_type IN ('mtn_momo', 'opay', 'bank_transfer')),
  account_name   TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shop_payment_methods ENABLE ROW LEVEL SECURITY;

-- Buyers can see payment methods of active shops (needed at checkout)
CREATE POLICY "shop_payment_methods: buyer reads active shop methods"
  ON public.shop_payment_methods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE id = shop_id AND status = 'active'
    )
  );

-- Sellers manage their own shop's methods
CREATE POLICY "shop_payment_methods: seller manage own"
  ON public.shop_payment_methods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE id = shop_id AND seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE id = shop_id AND seller_id = auth.uid()
    )
  );

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id       UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES public.categories(id),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_price NUMERIC(12, 2),
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images        TEXT[] NOT NULL DEFAULT '{}',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'draft', 'out_of_stock')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, slug)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public: only active products
CREATE POLICY "products: public read active"
  ON public.products FOR SELECT
  USING (status = 'active');

-- Sellers see all their own products (incl. drafts)
CREATE POLICY "products: seller read own"
  ON public.products FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND seller_id = auth.uid())
  );

CREATE POLICY "products: seller insert own"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND seller_id = auth.uid())
  );

CREATE POLICY "products: seller update own"
  ON public.products FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND seller_id = auth.uid())
  );

CREATE POLICY "products: seller delete own"
  ON public.products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND seller_id = auth.uid())
  );

CREATE OR REPLACE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ORDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_id           UUID NOT NULL REFERENCES public.shops(id),
  status            TEXT NOT NULL DEFAULT 'pending_payment'
                        CHECK (status IN (
                          'pending_payment', 'payment_submitted',
                          'payment_confirmed', 'processing',
                          'shipped', 'delivered', 'cancelled'
                        )),
  total_amount      NUMERIC(12, 2) NOT NULL,
  payment_method    TEXT,
  payment_reference TEXT,
  payment_proof_url TEXT,
  shipping_name     TEXT,
  shipping_phone    TEXT,
  shipping_address  TEXT,
  shipping_city     TEXT,
  shipping_country  TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers see their own orders
CREATE POLICY "orders: buyer read own"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id);

-- Buyers create orders
CREATE POLICY "orders: buyer insert"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Buyers can only update status to 'payment_submitted' (submit payment proof)
CREATE POLICY "orders: buyer submit payment"
  ON public.orders FOR UPDATE
  USING (auth.uid() = buyer_id)
  WITH CHECK (status = 'payment_submitted');

-- Sellers see all orders for their shop
CREATE POLICY "orders: seller read own shop"
  ON public.orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND seller_id = auth.uid())
  );

-- Sellers update order status (confirm, ship, deliver, cancel)
CREATE POLICY "orders: seller update own shop"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND seller_id = auth.uid())
  );

-- Admins see everything
CREATE POLICY "orders: admin all"
  ON public.orders FOR ALL
  USING (public.is_admin());

CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id),
  product_name  TEXT NOT NULL,
  product_image TEXT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12, 2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Buyers read items of their own orders
CREATE POLICY "order_items: buyer read own"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
  );

-- Buyers insert items when creating an order
CREATE POLICY "order_items: buyer insert own"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
  );

-- Sellers read items of orders in their shop
CREATE POLICY "order_items: seller read own shop"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.shops s ON s.id = o.shop_id
      WHERE o.id = order_id AND s.seller_id = auth.uid()
    )
  );

-- ─── REVIEWS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (buyer_id, product_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "reviews: public read"
  ON public.reviews FOR SELECT
  USING (true);

-- Buyers write, edit, delete their own reviews
CREATE POLICY "reviews: buyer insert own"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "reviews: buyer update own"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = buyer_id);

CREATE POLICY "reviews: buyer delete own"
  ON public.reviews FOR DELETE
  USING (auth.uid() = buyer_id);

-- ─── STORAGE BUCKETS ─────────────────────────────────────────
-- Run these in the Supabase Dashboard → Storage, or uncomment if using CLI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('shop-assets', 'shop-assets', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);
