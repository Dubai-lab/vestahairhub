-- Migration: Product Media (images + video)
-- Run this in Supabase SQL Editor after schema.sql

-- 1. Add video_url column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Create the product-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-media',
  'product-media',
  true,
  104857600,  -- 100 MB
  ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS: sellers can upload to their own shop folder
CREATE POLICY "Sellers can upload product media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-media'
  AND (storage.foldername(name))[1] = 'shops'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.shops WHERE seller_id = auth.uid()
  )
);

-- 4. Sellers can delete their own media
CREATE POLICY "Sellers can delete their product media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-media'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.shops WHERE seller_id = auth.uid()
  )
);

-- 5. Everyone can view (bucket is public, but policy ensures SELECT works)
CREATE POLICY "Anyone can view product media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-media');
