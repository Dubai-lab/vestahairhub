-- ============================================================
-- VestaHairHub — Messaging V3 Fixes
-- Run AFTER migration_messaging_v2.sql
-- ============================================================

-- ─── 1. Backfill buyer/seller names from profiles ─────────
-- Fills in names for conversations created before the v2 migration
UPDATE public.conversations c
SET buyer_name = (SELECT full_name FROM public.profiles WHERE id = c.buyer_id)
WHERE buyer_name IS NULL OR buyer_name = 'Customer';

UPDATE public.conversations c
SET seller_name = (SELECT full_name FROM public.profiles WHERE id = c.seller_id)
WHERE seller_name IS NULL OR seller_name = 'Seller';

-- ─── 2. Remove duplicate conversations ────────────────────
-- Keep the oldest conversation per (buyer, seller, shop) trio
-- Move messages from duplicates to the original first
DO $$
DECLARE
  dup RECORD;
  keeper_id UUID;
BEGIN
  FOR dup IN (
    SELECT buyer_id, seller_id, shop_id
    FROM public.conversations
    GROUP BY buyer_id, seller_id, shop_id
    HAVING COUNT(*) > 1
  ) LOOP
    -- The conversation to keep (oldest)
    SELECT id INTO keeper_id
    FROM public.conversations
    WHERE buyer_id = dup.buyer_id AND seller_id = dup.seller_id AND shop_id = dup.shop_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- Move messages from duplicates to the keeper
    UPDATE public.messages
    SET conversation_id = keeper_id
    WHERE conversation_id IN (
      SELECT id FROM public.conversations
      WHERE buyer_id = dup.buyer_id AND seller_id = dup.seller_id AND shop_id = dup.shop_id
        AND id != keeper_id
    );

    -- Delete the duplicate conversations
    DELETE FROM public.conversations
    WHERE buyer_id = dup.buyer_id AND seller_id = dup.seller_id AND shop_id = dup.shop_id
      AND id != keeper_id;
  END LOOP;
END;
$$;

-- ─── 3. Unique constraint to prevent future duplicates ─────
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS unique_buyer_seller_shop;

ALTER TABLE public.conversations
  ADD CONSTRAINT unique_buyer_seller_shop UNIQUE (buyer_id, seller_id, shop_id);
