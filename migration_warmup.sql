-- ==========================================
-- Mayaz OS — Workout Warmup Migration
-- Run this in your Supabase SQL Editor
-- ==========================================

ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS warmup TEXT;
