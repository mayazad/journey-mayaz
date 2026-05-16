-- ============================================================
-- Life OS v2 — New Tables Schema
-- Run this in your Supabase SQL Editor (after schema.sql)
-- ============================================================

-- ── ROADMAPS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roadmaps"   ON public.roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own roadmaps" ON public.roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own roadmaps" ON public.roadmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own roadmaps" ON public.roadmaps FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);

-- ── ROADMAP NODES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmap_nodes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id  UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  notes       TEXT,
  links       JSONB DEFAULT '[]',   -- [{label, url}]
  status      TEXT NOT NULL DEFAULT 'not_started'
              CHECK (status IN ('not_started','in_progress','done','skipped')),
  parent_ids  UUID[] DEFAULT '{}',
  position_x  FLOAT DEFAULT 0,
  position_y  FLOAT DEFAULT 0,
  order_index INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own nodes"   ON public.roadmap_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own nodes" ON public.roadmap_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own nodes" ON public.roadmap_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own nodes" ON public.roadmap_nodes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_roadmap_id ON public.roadmap_nodes(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_user_id ON public.roadmap_nodes(user_id);

-- ── WORKOUT PLANS (weekly recurring) ─────────────────────
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week          TEXT NOT NULL
                       CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  day_type             TEXT NOT NULL,   -- free text: Push, Pull, Legs, Rest, etc.
  target_muscle_groups TEXT[] DEFAULT '{}',
  exercises            JSONB DEFAULT '[]',   -- [{name, sets, reps, notes}]
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own plans"   ON public.workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plans" ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plans" ON public.workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plans" ON public.workout_plans FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON public.workout_plans(user_id);

-- ── WORKOUT LOGS (when actually done) ────────────────────
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id     UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own logs"   ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON public.workout_logs(logged_date);
