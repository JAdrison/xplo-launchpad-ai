
-- 1) Enum job_function
DO $$ BEGIN
  CREATE TYPE public.job_function AS ENUM (
    'gestor_trafego','designer','copywriter','sdr',
    'vendedor','contato_cliente','gestor_projetos','ia_specialist'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Tabela user_job_functions (N:N)
CREATE TABLE IF NOT EXISTS public.user_job_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_function public.job_function NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_function)
);

ALTER TABLE public.user_job_functions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ujf_select_authenticated ON public.user_job_functions;
CREATE POLICY ujf_select_authenticated ON public.user_job_functions
  FOR SELECT TO authenticated
  USING (public.has_crm_access(auth.uid()));

DROP POLICY IF EXISTS ujf_admin_insert ON public.user_job_functions;
CREATE POLICY ujf_admin_insert ON public.user_job_functions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS ujf_admin_update ON public.user_job_functions;
CREATE POLICY ujf_admin_update ON public.user_job_functions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS ujf_admin_delete ON public.user_job_functions;
CREATE POLICY ujf_admin_delete ON public.user_job_functions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_ujf_function ON public.user_job_functions(job_function);
CREATE INDEX IF NOT EXISTS idx_ujf_user ON public.user_job_functions(user_id);

-- 3) Coluna required_function em activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS required_function public.job_function;

-- 4) Trigger: atribuição automática de responsável
CREATE OR REPLACE FUNCTION public.assign_activity_responsible()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
BEGIN
  IF NEW.responsible_id IS NULL AND NEW.required_function IS NOT NULL THEN
    SELECT ujf.user_id INTO v_user
    FROM public.user_job_functions ujf
    JOIN public.user_roles ur ON ur.user_id = ujf.user_id
    WHERE ujf.job_function = NEW.required_function
      AND ur.role IN ('admin','user')
    ORDER BY ujf.created_at ASC
    LIMIT 1;

    IF v_user IS NOT NULL THEN
      NEW.responsible_id := v_user;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_activity_responsible ON public.activities;
CREATE TRIGGER trg_assign_activity_responsible
  BEFORE INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.assign_activity_responsible();
