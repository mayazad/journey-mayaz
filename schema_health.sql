-- ============================================================
-- Mayaz OS — Health Schema (Diet + Sleep)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── MEAL LOGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_name    TEXT NOT NULL,
  meal_type    TEXT NOT NULL DEFAULT 'snack'
                 CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories     INT DEFAULT 0,
  protein_g    FLOAT DEFAULT 0,
  carbs_g      FLOAT DEFAULT 0,
  fat_g        FLOAT DEFAULT 0,
  raw_input    TEXT,
  source       TEXT DEFAULT 'ai_estimated',  -- 'ai_estimated' | 'ai+database'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own meals"   ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meals" ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own meals" ON public.meal_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON public.meal_logs(user_id, logged_date);

-- ── SLEEP LOGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  bedtime        TEXT NOT NULL,       -- "23:00"
  wake_time      TEXT NOT NULL,       -- "07:00"
  duration_hours FLOAT,
  quality        INT DEFAULT 3 CHECK (quality BETWEEN 1 AND 5),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sleep_date)
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sleep"   ON public.sleep_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sleep" ON public.sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sleep" ON public.sleep_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sleep" ON public.sleep_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs(user_id, sleep_date);
