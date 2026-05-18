-- ============================================================
-- Mayaz OS — Add 'mode' column to chat_messages
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add the mode column (defaults to 'general' for all existing rows)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'general'
    CHECK (mode IN ('general', 'coach'));

-- Add an index for fast per-user-per-mode queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_mode_created
  ON public.chat_messages(user_id, mode, created_at DESC);
