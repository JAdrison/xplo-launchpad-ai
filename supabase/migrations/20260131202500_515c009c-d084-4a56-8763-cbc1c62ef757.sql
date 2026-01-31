-- Create enum for client status
CREATE TYPE public.client_status AS ENUM ('draft', 'ppp_in_progress', 'ppp_completed', 'offer_generated', 'assets_generated', 'archived');

-- Create enum for sales model
CREATE TYPE public.sales_model AS ENUM ('b2b', 'b2c', 'recurring', 'project', 'hybrid');

-- Create enum for awareness level
CREATE TYPE public.awareness_level AS ENUM ('cold', 'warm', 'hot');

-- Create enum for asset type
CREATE TYPE public.asset_type AS ENUM ('landing_page', 'static_ad', 'video_ad');

-- Create enum for LP variant
CREATE TYPE public.lp_variant AS ENUM ('direct', 'consultive', 'aggressive');

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  niche TEXT,
  notes TEXT,
  status client_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create client_profile table (product info from PPP step 1)
CREATE TABLE public.client_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  product_name TEXT,
  product_description TEXT,
  average_ticket TEXT,
  sales_model sales_model,
  region TEXT,
  differentiators TEXT[], -- array of differentiators
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ICPs table (up to 3 per client)
CREATE TABLE public.icps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  segment TEXT,
  characteristics TEXT,
  awareness_level awareness_level DEFAULT 'cold',
  current_situation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT max_3_icps CHECK (sort_order >= 0 AND sort_order < 3)
);

-- Create ICP pains table
CREATE TABLE public.icp_pains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_id UUID REFERENCES public.icps(id) ON DELETE CASCADE NOT NULL,
  main_pain TEXT,
  daily_impacts TEXT[], -- array of impacts
  consequence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create client_promise table (PPP step 4)
CREATE TABLE public.client_promise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  promise_text TEXT,
  generated_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create offers_hormozi table
CREATE TABLE public.offers_hormozi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  promise TEXT,
  unique_mechanism TEXT,
  proof TEXT,
  risk_reversal TEXT,
  value_stack JSONB, -- flexible structure for stack items
  guarantee TEXT,
  main_cta TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create landing_pages table
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  offer_id UUID REFERENCES public.offers_hormozi(id) ON DELETE SET NULL,
  variant lp_variant NOT NULL,
  sections JSONB NOT NULL DEFAULT '{}', -- hero, problem, mechanism, proof, offer, guarantee, faq, cta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  offer_id UUID REFERENCES public.offers_hormozi(id) ON DELETE SET NULL,
  asset_type asset_type NOT NULL,
  ad_angle TEXT, -- direct, educational, question_box
  headline TEXT,
  body_text TEXT,
  cta TEXT,
  script JSONB, -- for video ads: hook, problem, promise, proof, cta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create versions table for history tracking
CREATE TABLE public.versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL, -- 'profile', 'icp', 'pain', 'promise', 'offer', 'landing_page', 'ad'
  entity_id UUID NOT NULL,
  content JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'ai'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_updated ON public.clients(updated_at DESC);
CREATE INDEX idx_icps_client ON public.icps(client_id);
CREATE INDEX idx_pains_icp ON public.icp_pains(icp_id);
CREATE INDEX idx_offers_client ON public.offers_hormozi(client_id);
CREATE INDEX idx_lps_client ON public.landing_pages(client_id);
CREATE INDEX idx_ads_client ON public.ads(client_id);
CREATE INDEX idx_versions_client ON public.versions(client_id);
CREATE INDEX idx_versions_entity ON public.versions(entity_type, entity_id);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_profile_updated_at
  BEFORE UPDATE ON public.client_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_icps_updated_at
  BEFORE UPDATE ON public.icps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_icp_pains_updated_at
  BEFORE UPDATE ON public.icp_pains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_promise_updated_at
  BEFORE UPDATE ON public.client_promise
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_hormozi_updated_at
  BEFORE UPDATE ON public.offers_hormozi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();