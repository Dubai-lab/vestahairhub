-- ============================================================
-- VestaHairHub — Messaging V2 Fixes
-- Run AFTER migration_messaging_reviews.sql
-- ============================================================

-- ─── 1. Denormalize buyer/seller names on conversations ───────
-- Eliminates profile-join RLS failures. Names are written at
-- conversation creation time and never need to be fetched again.
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS buyer_name  TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS seller_name TEXT;

-- ─── 2. Rich message types on messages ────────────────────────
-- message_type: 'text' | 'product_inquiry' | 'image'
-- attachment_url: image URL (product image or uploaded photo)
-- attachment_meta: JSONB {product_id, product_name, product_price}
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type    TEXT NOT NULL DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url  TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_meta JSONB;

-- ─── 3. Unread counts on conversations (fast badge queries) ───
-- Seller's view of how many unread messages there are from buyer
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS unread_seller INT NOT NULL DEFAULT 0;
-- Buyer's view of how many unread messages from seller
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS unread_buyer  INT NOT NULL DEFAULT 0;

-- ─── 4. Trigger: auto-increment unread on new message ─────────
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update last message preview + at
  UPDATE public.conversations
  SET
    last_message_preview = LEFT(NEW.content, 120),
    last_message_at      = NEW.created_at,
    updated_at           = NOW(),
    -- Increment the RECEIVER's unread count
    unread_seller = CASE
      WHEN (SELECT seller_id FROM public.conversations WHERE id = NEW.conversation_id) != NEW.sender_id
      THEN unread_seller + 1
      ELSE unread_seller
    END,
    unread_buyer = CASE
      WHEN (SELECT buyer_id FROM public.conversations WHERE id = NEW.conversation_id) != NEW.sender_id
      THEN unread_buyer + 1
      ELSE unread_buyer
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Replace old trigger with new one
DROP TRIGGER IF EXISTS messages_update_conversation ON public.messages;
CREATE TRIGGER messages_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- ─── 5. Chat media storage bucket ────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media', 'chat-media', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload chat media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Anyone can view chat media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chat-media');
