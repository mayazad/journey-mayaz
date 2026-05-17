-- ============================================================
-- Mayaz OS — Username Login + Profile Name Settings Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill existing profiles with their auth emails
UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND p.email IS NULL;

-- 3. Update the handle_new_user trigger to save email on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- 4. Create a public RPC function to resolve username to email (bypassing RLS)
CREATE OR REPLACE FUNCTION public.resolve_username_to_email(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM public.profiles
  WHERE lower(username) = lower(p_username)
  LIMIT 1;
  
  RETURN v_email;
END;
$$;

-- 5. Create a public RPC function to securely let standard users delete their own account (blocking admins)
CREATE OR REPLACE FUNCTION public.delete_own_user()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Ensure caller is not an admin
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Administrators cannot self-delete their accounts to prevent lockout.';
  END IF;

  -- Delete the user from auth.users (cascades automatically to profile and all data)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
