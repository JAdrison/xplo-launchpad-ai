-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_pains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_promise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers_hormozi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

-- Since this is a single-workspace internal tool with no login requirement,
-- we create public access policies for all tables

-- Clients policies
CREATE POLICY "Allow public read on clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert on clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on clients" ON public.clients FOR DELETE USING (true);

-- Client profile policies
CREATE POLICY "Allow public read on client_profile" ON public.client_profile FOR SELECT USING (true);
CREATE POLICY "Allow public insert on client_profile" ON public.client_profile FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on client_profile" ON public.client_profile FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on client_profile" ON public.client_profile FOR DELETE USING (true);

-- ICPs policies
CREATE POLICY "Allow public read on icps" ON public.icps FOR SELECT USING (true);
CREATE POLICY "Allow public insert on icps" ON public.icps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on icps" ON public.icps FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on icps" ON public.icps FOR DELETE USING (true);

-- ICP pains policies
CREATE POLICY "Allow public read on icp_pains" ON public.icp_pains FOR SELECT USING (true);
CREATE POLICY "Allow public insert on icp_pains" ON public.icp_pains FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on icp_pains" ON public.icp_pains FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on icp_pains" ON public.icp_pains FOR DELETE USING (true);

-- Client promise policies
CREATE POLICY "Allow public read on client_promise" ON public.client_promise FOR SELECT USING (true);
CREATE POLICY "Allow public insert on client_promise" ON public.client_promise FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on client_promise" ON public.client_promise FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on client_promise" ON public.client_promise FOR DELETE USING (true);

-- Offers policies
CREATE POLICY "Allow public read on offers_hormozi" ON public.offers_hormozi FOR SELECT USING (true);
CREATE POLICY "Allow public insert on offers_hormozi" ON public.offers_hormozi FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on offers_hormozi" ON public.offers_hormozi FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on offers_hormozi" ON public.offers_hormozi FOR DELETE USING (true);

-- Landing pages policies
CREATE POLICY "Allow public read on landing_pages" ON public.landing_pages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on landing_pages" ON public.landing_pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on landing_pages" ON public.landing_pages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on landing_pages" ON public.landing_pages FOR DELETE USING (true);

-- Ads policies
CREATE POLICY "Allow public read on ads" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ads" ON public.ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on ads" ON public.ads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on ads" ON public.ads FOR DELETE USING (true);

-- Versions policies
CREATE POLICY "Allow public read on versions" ON public.versions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on versions" ON public.versions FOR INSERT WITH CHECK (true);

-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;