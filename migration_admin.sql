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

-- 4. Enable Admins to bypass standard RLS SELECT & UPDATE limits without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- Drop standard conflicting policies if existing
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;

-- Allow admins to see all profiles (for listing pending registrations)
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Allow admins to update status/approvals of standard profiles
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());
