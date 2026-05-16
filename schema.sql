-- ============================================================
-- Life OS — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: learning_modules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'planned'
                  CHECK (status IN ('planned', 'in-progress', 'completed')),
  roadmap_data  JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning modules"
  ON public.learning_modules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning modules"
  ON public.learning_modules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning modules"
  ON public.learning_modules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning modules"
  ON public.learning_modules FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 2: workouts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_type              TEXT NOT NULL
                          CHECK (day_type IN ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Rest', 'Cardio')),
  exercises             JSONB NOT NULL DEFAULT '[]',
  target_muscle_groups  TEXT[] NOT NULL DEFAULT '{}',
  scheduled_date        DATE NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 3: academic_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.academic_tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'assignment'
                CHECK (type IN ('assignment', 'presentation', 'hackathon', 'exam', 'project', 'other')),
  due_date    TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in-progress', 'submitted', 'completed', 'overdue')),
  notes       TEXT
);

ALTER TABLE public.academic_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own academic tasks"
  ON public.academic_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own academic tasks"
  ON public.academic_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own academic tasks"
  ON public.academic_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own academic tasks"
  ON public.academic_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 4: account_metadata
-- Tracks email usage across services — NO passwords stored
-- ============================================================
CREATE TABLE IF NOT EXISTS public.account_metadata (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name  TEXT NOT NULL,
  email_used    TEXT NOT NULL,
  auth_method   TEXT NOT NULL DEFAULT 'Standalone'
                  CHECK (auth_method IN ('Google OAuth', 'GitHub OAuth', 'Standalone', 'Magic Link', 'Other')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.account_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own account metadata"
  ON public.account_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own account metadata"
  ON public.account_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own account metadata"
  ON public.account_metadata FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own account metadata"
  ON public.account_metadata FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_learning_modules_user_id ON public.learning_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_scheduled_date ON public.workouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_academic_tasks_user_id ON public.academic_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_tasks_due_date ON public.academic_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_account_metadata_user_id ON public.account_metadata(user_id);
