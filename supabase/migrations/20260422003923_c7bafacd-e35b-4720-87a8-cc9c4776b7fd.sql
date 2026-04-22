CREATE TABLE public.client_icp_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'ICP Principal',
  generated_icp_text text,
  generated_by_ai boolean DEFAULT false,
  generated_at timestamp with time zone,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_icp_documents_client_id ON public.client_icp_documents(client_id);

ALTER TABLE public.client_icp_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on client_icp_documents"
  ON public.client_icp_documents FOR SELECT USING (true);

CREATE POLICY "Allow public insert on client_icp_documents"
  ON public.client_icp_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on client_icp_documents"
  ON public.client_icp_documents FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on client_icp_documents"
  ON public.client_icp_documents FOR DELETE USING (true);

CREATE TRIGGER update_client_icp_documents_updated_at
  BEFORE UPDATE ON public.client_icp_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();