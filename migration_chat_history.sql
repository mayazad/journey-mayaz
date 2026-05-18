-- ============================================================
-- Mayaz OS — Chat History Persistence Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies — users can only read/write their own messages
CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Index for fast per-user chronological retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages(user_id, created_at DESC);

-- 5. Auto-cleanup: keep only the last 200 messages per user
-- This trigger fires on every INSERT and deletes the oldest messages beyond 200
CREATE OR REPLACE FUNCTION public.trim_chat_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.chat_messages
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.chat_messages
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 200
    );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trim_chat_history_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.trim_chat_history();
