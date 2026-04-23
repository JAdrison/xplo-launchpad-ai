
-- ===== ENUMS =====
CREATE TYPE public.crm_column_type AS ENUM ('normal', 'won', 'lost');
CREATE TYPE public.crm_deal_status AS ENUM ('active', 'won', 'lost');
CREATE TYPE public.crm_activity_type AS ENUM ('lembrete', 'mensagem', 'ligacao', 'email');
CREATE TYPE public.crm_activity_status AS ENUM ('pending', 'completed');
CREATE TYPE public.crm_event_type AS ENUM (
  'created', 'moved', 'tag_added', 'tag_removed',
  'activity_created', 'activity_completed',
  'value_changed', 'responsible_changed',
  'status_changed', 'note_added', 'custom_field_changed'
);
CREATE TYPE public.crm_custom_field_type AS ENUM ('text', 'number', 'select', 'multi_select', 'date', 'checkbox');
CREATE TYPE public.crm_entity_type AS ENUM ('deal', 'client');

-- ===== HELPER: is authorized CRM user (admin or user, not pending) =====
CREATE OR REPLACE FUNCTION public.has_crm_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','user')
  )
$$;

-- ===== TABLES =====
CREATE TABLE public.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#8B5CF6',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pipeline_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8B5CF6',
  sort_order integer NOT NULL DEFAULT 0,
  column_type public.crm_column_type NOT NULL DEFAULT 'normal',
  automation_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.column_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid NOT NULL REFERENCES public.pipeline_columns(id) ON DELETE CASCADE,
  activity_type public.crm_activity_type NOT NULL,
  subject text NOT NULL,
  description text,
  days_after_entry integer NOT NULL DEFAULT 0,
  default_duration_minutes integer,
  default_responsible_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8B5CF6',
  pipeline_id uuid REFERENCES public.pipelines(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE RESTRICT,
  column_id uuid NOT NULL REFERENCES public.pipeline_columns(id) ON DELETE RESTRICT,
  name text NOT NULL,
  value_cents bigint NOT NULL DEFAULT 0,
  status public.crm_deal_status NOT NULL DEFAULT 'active',
  responsible_id uuid,
  entered_current_column_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  closed_reason text,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_tags (
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (deal_id, tag_id)
);

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type public.crm_activity_type NOT NULL,
  subject text NOT NULL,
  description text,
  scheduled_at timestamptz,
  duration_minutes integer,
  responsible_id uuid,
  status public.crm_activity_status NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_generated boolean NOT NULL DEFAULT false,
  source_automation_id uuid REFERENCES public.column_automations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  event_type public.crm_event_type NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.crm_entity_type NOT NULL,
  name text NOT NULL,
  field_type public.crm_custom_field_type NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.activity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.crm_activity_type NOT NULL,
  default_subject text,
  default_description text,
  default_duration_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== INDEXES =====
CREATE INDEX idx_pipeline_columns_pipeline ON public.pipeline_columns(pipeline_id, sort_order);
CREATE INDEX idx_column_automations_column ON public.column_automations(column_id, sort_order);
CREATE INDEX idx_deals_pipeline_column ON public.deals(pipeline_id, column_id, sort_order);
CREATE INDEX idx_deals_client ON public.deals(client_id);
CREATE INDEX idx_activities_deal ON public.activities(deal_id);
CREATE INDEX idx_activities_status_scheduled ON public.activities(status, scheduled_at);
CREATE INDEX idx_notes_deal ON public.notes(deal_id);
CREATE INDEX idx_deal_history_deal ON public.deal_history(deal_id, created_at DESC);

-- ===== TIMESTAMPS TRIGGERS =====
CREATE TRIGGER tr_pipelines_upd BEFORE UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_pipeline_columns_upd BEFORE UPDATE ON public.pipeline_columns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_deals_upd BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_activities_upd BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== APPLY COLUMN AUTOMATIONS =====
CREATE OR REPLACE FUNCTION public.apply_column_automations(_deal_id uuid, _column_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rec RECORD;
  v_client_id uuid;
  v_responsible uuid;
BEGIN
  SELECT client_id, responsible_id INTO v_client_id, v_responsible
  FROM public.deals WHERE id = _deal_id;

  FOR rec IN
    SELECT * FROM public.column_automations
    WHERE column_id = _column_id ORDER BY sort_order
  LOOP
    INSERT INTO public.activities (
      deal_id, client_id, type, subject, description,
      scheduled_at, duration_minutes, responsible_id,
      auto_generated, source_automation_id
    ) VALUES (
      _deal_id, v_client_id, rec.activity_type, rec.subject, rec.description,
      now() + (rec.days_after_entry || ' days')::interval,
      rec.default_duration_minutes,
      COALESCE(rec.default_responsible_id, v_responsible),
      true, rec.id
    );
  END LOOP;
END;
$$;

-- ===== DEAL MOVED TRIGGER =====
CREATE OR REPLACE FUNCTION public.handle_deal_column_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_col_type public.crm_column_type;
  v_auto_enabled boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.deal_history (deal_id, event_type, event_data)
    VALUES (NEW.id, 'created', jsonb_build_object('column_id', NEW.column_id));

    SELECT column_type, automation_enabled INTO v_col_type, v_auto_enabled
    FROM public.pipeline_columns WHERE id = NEW.column_id;

    IF v_auto_enabled THEN
      PERFORM public.apply_column_automations(NEW.id, NEW.column_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    NEW.entered_current_column_at := now();

    INSERT INTO public.deal_history (deal_id, event_type, event_data)
    VALUES (NEW.id, 'moved', jsonb_build_object(
      'from_column', OLD.column_id, 'to_column', NEW.column_id
    ));

    SELECT column_type, automation_enabled INTO v_col_type, v_auto_enabled
    FROM public.pipeline_columns WHERE id = NEW.column_id;

    IF v_col_type = 'won' THEN
      NEW.status := 'won';
      NEW.closed_at := now();
    ELSIF v_col_type = 'lost' THEN
      NEW.status := 'lost';
      NEW.closed_at := now();
    ELSE
      NEW.status := 'active';
      NEW.closed_at := NULL;
    END IF;

    IF v_auto_enabled THEN
      PERFORM public.apply_column_automations(NEW.id, NEW.column_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_deal_column_change
BEFORE INSERT OR UPDATE OF column_id ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.handle_deal_column_change();

-- ===== ENABLE RLS =====
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES (admin OR user role) =====
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'pipelines','pipeline_columns','column_automations','tags',
    'deals','deal_tags','activities','notes','deal_history',
    'custom_fields','activity_templates'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('CREATE POLICY "crm_select_%s" ON public.%I FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "crm_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "crm_update_%s" ON public.%I FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "crm_delete_%s" ON public.%I FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()))', t, t);
  END LOOP;
END$$;

-- ===== REALTIME =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

-- ===== SEED DEFAULT PIPELINE =====
DO $$
DECLARE
  v_pipeline uuid;
BEGIN
  INSERT INTO public.pipelines (name, description, color, sort_order)
  VALUES ('Pipeline Principal', 'Funil padrão de execução de projetos', '#8B5CF6', 0)
  RETURNING id INTO v_pipeline;

  INSERT INTO public.pipeline_columns (pipeline_id, name, color, sort_order, column_type) VALUES
    (v_pipeline, 'Onboarding',    '#8B5CF6', 0, 'normal'),
    (v_pipeline, 'Negociação',    '#3B82F6', 1, 'normal'),
    (v_pipeline, 'Contrato',      '#F59E0B', 2, 'normal'),
    (v_pipeline, 'Em Execução',   '#10B981', 3, 'normal'),
    (v_pipeline, 'Ganho',         '#22C55E', 4, 'won'),
    (v_pipeline, 'Perdido',       '#EF4444', 5, 'lost');
END$$;
