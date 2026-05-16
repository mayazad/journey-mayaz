-- ============================================================
-- Life OS — Vector Search Schema (Future-proofing)
-- Run AFTER enabling the pgvector extension in Supabase:
--   Settings → Extensions → vector → Enable
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.documents (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  metadata   JSONB,
  embedding  vector(384),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- IVFFlat index for fast approximate nearest-neighbour search
-- Run this AFTER inserting at least a few rows of data.
-- CREATE INDEX ON public.documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
