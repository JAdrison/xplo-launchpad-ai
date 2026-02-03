-- Criar enum para tipo de token
CREATE TYPE public.token_type AS ENUM ('onboarding');

-- Criar tabela de tokens
CREATE TABLE public.client_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  type token_type NOT NULL DEFAULT 'onboarding',
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indice para busca rapida por token
CREATE INDEX idx_client_tokens_token ON public.client_tokens(token);

-- RLS policies
ALTER TABLE public.client_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on client_tokens" ON public.client_tokens
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on client_tokens" ON public.client_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on client_tokens" ON public.client_tokens
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on client_tokens" ON public.client_tokens
  FOR DELETE USING (true);