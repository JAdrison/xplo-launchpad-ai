-- API Keys table
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT ARRAY['read','write']::text[],
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own api keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own api keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own api keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own api keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Verify function: takes raw key, returns user_id + scopes if valid
CREATE OR REPLACE FUNCTION public.verify_api_key(_raw text)
RETURNS TABLE(user_id uuid, scopes text[], key_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
BEGIN
  v_hash := encode(digest(_raw, 'sha256'), 'hex');
  RETURN QUERY
  SELECT k.user_id, k.scopes, k.id
  FROM public.api_keys k
  WHERE k.key_hash = v_hash
    AND k.revoked_at IS NULL
  LIMIT 1;

  UPDATE public.api_keys SET last_used_at = now()
  WHERE key_hash = v_hash AND revoked_at IS NULL;
END;
$$;

-- Ensure pgcrypto is available for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;