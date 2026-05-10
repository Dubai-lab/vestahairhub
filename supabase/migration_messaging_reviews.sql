-- ============================================================
-- VestaHairHub — Messaging, WhatsApp & Reviews Migration
-- Run in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ─── 1. WhatsApp number on shops ─────────────────────────────
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- ─── 2. Extend profiles RLS so chat partners can see names ───
-- Without this, sellers can't see buyer names in chat and
-- buyer names can't appear on reviews.
CREATE POLICY "profiles: authenticated users can view"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- ─── 3. CONVERSATIONS ────────────────────────────────────────
-- One thread per buyer–seller pair. Product context comes from
-- the first message, not the table (keeps threads unified even
-- when a buyer asks about multiple products from the same seller).
CREATE TABLE IF NOT EXISTS public.conversations (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id              UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id           UUID REFERENCES public.products(id) ON DELETE SET NULL,
  last_message_preview TEXT,
  last_message_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (buyer_id, seller_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Participants (buyer or seller) can read their conversations
CREATE POLICY "conversations: participants can read"
  ON public.conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Only the buyer starts a conversation
CREATE POLICY "conversations: buyer can create"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Participants can update (last_message_at updated by trigger)
CREATE POLICY "conversations: participants can update"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE OR REPLACE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 4. MESSAGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants in the conversation can read messages
CREATE POLICY "messages: participants can read"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Participants can send messages (sender_id must be themselves)
CREATE POLICY "messages: participants can insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Participants can mark messages as read
CREATE POLICY "messages: participants can update is_read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ─── 5. Trigger: keep conversation last_message_preview fresh ─
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_preview = LEFT(NEW.content, 120),
    last_message_at      = NEW.created_at,
    updated_at           = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_update_conversation ON public.messages;
CREATE TRIGGER messages_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- ─── 6. Enable Realtime on messages + conversations ───────────
-- Run these if not already done:
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ─── 7. Reviews already exist in schema.sql ──────────────────
-- Nothing to add — reviews table + RLS is complete in schema.sql.
-- Just verify the UNIQUE(buyer_id, product_id) constraint exists.
