-- ============================================================
-- Mayaz OS — Admin Approval + Per-User Groq API Key Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add status, is_admin, groq_api_key to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS groq_api_key TEXT;

-- 2. Approve yourself + mark as admin (only you exist, so this covers it)
UPDATE public.profiles
  SET status = 'approved', is_admin = true
  WHERE username = 'mayaz';

-- 3. Confirm (should show your row with status=approved, is_admin=true)
SELECT id, username, status, is_admin FROM public.profiles;
