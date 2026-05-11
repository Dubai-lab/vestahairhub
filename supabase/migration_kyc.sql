-- ─────────────────────────────────────────────────────────────────────────────
-- KYC Verification System Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add kyc_status column to shops
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'pending';

-- 2. Create kyc_verifications table
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id           UUID        NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,

  -- Step 1: Personal Info
  full_name         TEXT,
  date_of_birth     DATE,
  address           TEXT,
  city              TEXT,
  country           TEXT,

  -- Step 2: ID Document
  id_type           TEXT,         -- 'national_id' | 'passport' | 'drivers_license'
  id_number         TEXT,
  id_expiry_date    DATE,
  id_front_path     TEXT,         -- storage path in kyc-documents bucket
  id_back_path      TEXT,         -- storage path in kyc-documents bucket

  -- Step 3: Face Capture
  face_token        UUID        NOT NULL DEFAULT gen_random_uuid(),
  selfie_path       TEXT,         -- storage path in kyc-selfies bucket
  face_captured_at  TIMESTAMPTZ,

  -- Status & Admin
  status            TEXT        NOT NULL DEFAULT 'draft',
  current_step      INT         NOT NULL DEFAULT 1,
  admin_notes       TEXT,
  submitted_at      TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       UUID        REFERENCES auth.users(id),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One KYC record per seller
CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_seller_unique ON public.kyc_verifications (seller_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Seller: read own record
CREATE POLICY "kyc_seller_select" ON public.kyc_verifications
  FOR SELECT USING (auth.uid() = seller_id);

-- Seller: create own record
CREATE POLICY "kyc_seller_insert" ON public.kyc_verifications
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Seller: update own record while in draft or rejected state
CREATE POLICY "kyc_seller_update" ON public.kyc_verifications
  FOR UPDATE USING (auth.uid() = seller_id AND status IN ('draft', 'rejected'))
  WITH CHECK (auth.uid() = seller_id);

-- Admin: read all submissions
CREATE POLICY "kyc_admin_select" ON public.kyc_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin: approve / reject (update any record)
CREATE POLICY "kyc_admin_update" ON public.kyc_verifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (true);

-- ── Allow admin to update shops.kyc_status ────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'shops_admin_kyc_update' AND tablename = 'shops'
  ) THEN
    CREATE POLICY "shops_admin_kyc_update" ON public.shops
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      ) WITH CHECK (true);
  END IF;
END $$;

-- ── Realtime ──────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_verifications;

-- ── Storage buckets ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-selfies', 'kyc-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Storage: owners can upload to their own folder in kyc-documents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_docs_insert' AND tablename = 'objects') THEN
    CREATE POLICY "kyc_docs_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_docs_select' AND tablename = 'objects') THEN
    CREATE POLICY "kyc_docs_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'kyc-documents' AND (
          auth.uid()::text = (storage.foldername(name))[1]
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_docs_update' AND tablename = 'objects') THEN
    CREATE POLICY "kyc_docs_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Storage: owners can upload selfies to their own folder in kyc-selfies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_selfies_insert' AND tablename = 'objects') THEN
    CREATE POLICY "kyc_selfies_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'kyc-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_selfies_select' AND tablename = 'objects') THEN
    CREATE POLICY "kyc_selfies_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'kyc-selfies' AND (
          auth.uid()::text = (storage.foldername(name))[1]
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_selfies_update' AND tablename = 'objects') THEN
    CREATE POLICY "kyc_selfies_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'kyc-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
