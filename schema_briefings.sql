-- ============================================================
-- daily_briefings: cache table for AI morning/afternoon briefs
-- Run this in your Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_briefings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  period     text NOT NULL CHECK (period IN ('morning', 'afternoon')),
  markdown   text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date, period)
);

ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own briefings only"
  ON daily_briefings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
