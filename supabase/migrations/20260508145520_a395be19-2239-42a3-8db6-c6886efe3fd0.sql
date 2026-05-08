
CREATE TABLE public.client_drive_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE,
  drive_folder_id text NOT NULL,
  drive_folder_name text NOT NULL,
  client_number integer,
  drive_folder_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_drive_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_client_drive_folders" ON public.client_drive_folders
  FOR SELECT TO authenticated USING (has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_client_drive_folders" ON public.client_drive_folders
  FOR INSERT TO authenticated WITH CHECK (has_crm_access(auth.uid()));
CREATE POLICY "auth_update_client_drive_folders" ON public.client_drive_folders
  FOR UPDATE TO authenticated USING (has_crm_access(auth.uid())) WITH CHECK (has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_client_drive_folders" ON public.client_drive_folders
  FOR DELETE TO authenticated USING (has_crm_access(auth.uid()));

CREATE TRIGGER update_client_drive_folders_updated_at
  BEFORE UPDATE ON public.client_drive_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
