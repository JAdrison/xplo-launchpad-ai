CREATE TABLE IF NOT EXISTS public.client_traffic_plan_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Plano de Demanda',
  generated_text text,
  generated_by_ai boolean DEFAULT false,
  generated_at timestamp with time zone,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_traffic_plan_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on client_traffic_plan_documents" ON public.client_traffic_plan_documents;
CREATE POLICY "Allow public read on client_traffic_plan_documents" ON public.client_traffic_plan_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on client_traffic_plan_documents" ON public.client_traffic_plan_documents;
CREATE POLICY "Allow public insert on client_traffic_plan_documents" ON public.client_traffic_plan_documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on client_traffic_plan_documents" ON public.client_traffic_plan_documents;
CREATE POLICY "Allow public update on client_traffic_plan_documents" ON public.client_traffic_plan_documents FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on client_traffic_plan_documents" ON public.client_traffic_plan_documents;
CREATE POLICY "Allow public delete on client_traffic_plan_documents" ON public.client_traffic_plan_documents FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_ctpd_client ON public.client_traffic_plan_documents(client_id);

DROP TRIGGER IF EXISTS update_ctpd_updated_at ON public.client_traffic_plan_documents;
CREATE TRIGGER update_ctpd_updated_at
BEFORE UPDATE ON public.client_traffic_plan_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();