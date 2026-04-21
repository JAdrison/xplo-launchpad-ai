-- 1. New enum for niche type
CREATE TYPE public.niche_type AS ENUM ('hospedagem', 'saude', 'generico');

-- 2. Add columns to clients
ALTER TABLE public.clients
  ADD COLUMN niche_type public.niche_type,
  ADD COLUMN niche_label text;

-- 3. Add columns to client_profile
ALTER TABLE public.client_profile
  ADD COLUMN profile_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN market_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN whatsapp_number text,
  ADD COLUMN google_my_business text;

-- 4. New table client_swot
CREATE TABLE public.client_swot (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL UNIQUE,
  forcas_internas_tags text[] DEFAULT ARRAY[]::text[],
  forcas_internas_text text,
  fraquezas_internas_tags text[] DEFAULT ARRAY[]::text[],
  fraquezas_internas_text text,
  forcas_ambiente_tags text[] DEFAULT ARRAY[]::text[],
  forcas_ambiente_text text,
  fraquezas_ambiente_tags text[] DEFAULT ARRAY[]::text[],
  fraquezas_ambiente_text text,
  generated_by_ai boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_swot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on client_swot" ON public.client_swot FOR SELECT USING (true);
CREATE POLICY "Allow public insert on client_swot" ON public.client_swot FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on client_swot" ON public.client_swot FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on client_swot" ON public.client_swot FOR DELETE USING (true);

CREATE TRIGGER update_client_swot_updated_at
  BEFORE UPDATE ON public.client_swot
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. New table client_icp
CREATE TABLE public.client_icp (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL UNIQUE,
  bloco1_data jsonb DEFAULT '{}'::jsonb,
  bloco2_data jsonb DEFAULT '{}'::jsonb,
  bloco3_data jsonb DEFAULT '{}'::jsonb,
  generated_icp_text text,
  generated_by_ai boolean DEFAULT false,
  generated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_icp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on client_icp" ON public.client_icp FOR SELECT USING (true);
CREATE POLICY "Allow public insert on client_icp" ON public.client_icp FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on client_icp" ON public.client_icp FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on client_icp" ON public.client_icp FOR DELETE USING (true);

CREATE TRIGGER update_client_icp_updated_at
  BEFORE UPDATE ON public.client_icp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();