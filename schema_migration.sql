-- ============================================================
-- Life OS — Schema Migration: Remove hardcoded CHECK constraints
-- Run this in your Supabase SQL Editor
-- This allows any custom value for day_type and task type
-- ============================================================

-- Drop the constraint on workouts.day_type so users can enter anything
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_day_type_check;

-- Drop the constraint on academic_tasks.type so users can enter anything
ALTER TABLE public.academic_tasks DROP CONSTRAINT IF EXISTS academic_tasks_type_check;

-- Drop the constraint on account_metadata.auth_method so users can enter anything
ALTER TABLE public.account_metadata DROP CONSTRAINT IF EXISTS account_metadata_auth_method_check;
