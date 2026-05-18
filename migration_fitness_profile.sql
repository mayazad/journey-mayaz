-- ============================================================
-- Mayaz OS — Fitness Profile + Progressive Overload Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop tables if they exist (ensures clean re-run)
DROP TABLE IF EXISTS public.workout_logs;
DROP TABLE IF EXISTS public.user_fitness_profile;

-- ============================================================
-- TABLE 1: user_fitness_profile
-- ============================================================
CREATE TABLE public.user_fitness_profile (
  user_id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  height_cm              NUMERIC,
  weight_kg              NUMERIC,
  age                    INTEGER,
  sex                    TEXT        CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say')),
  fitness_level          TEXT        CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  primary_goal           TEXT,
  secondary_goals        TEXT[],
  available_equipment    TEXT[],
  training_days_per_week INTEGER,
  experience_years       NUMERIC,
  injuries_limitations   TEXT,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_fitness_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fitness profile"
  ON public.user_fitness_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fitness profile"
  ON public.user_fitness_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness profile"
  ON public.user_fitness_profile FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fitness profile"
  ON public.user_fitness_profile FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 2: workout_logs
-- ============================================================
CREATE TABLE public.workout_logs (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  exercise_name  TEXT        NOT NULL,
  sets_completed INTEGER,
  reps_per_set   TEXT,
  weight_kg      NUMERIC,
  rpe            INTEGER     CHECK (rpe BETWEEN 1 AND 10),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout logs"
  ON public.workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
  ON public.workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
  ON public.workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_workout_logs_user_date
  ON public.workout_logs (user_id, logged_date DESC);

CREATE INDEX idx_workout_logs_exercise
  ON public.workout_logs (user_id, exercise_name, logged_date DESC);
