
-- 1) Schema (idempotente)
ALTER TABLE public.pipeline_columns ADD COLUMN IF NOT EXISTS checkpoint_code text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS recurrence_days int;

CREATE UNIQUE INDEX IF NOT EXISTS pipeline_columns_checkpoint_unique
  ON public.pipeline_columns(pipeline_id, checkpoint_code)
  WHERE checkpoint_code IS NOT NULL;

-- 2) Trigger: ao concluir uma activity → recorrência + auto-advance
CREATE OR REPLACE FUNCTION public.handle_activity_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_curr_chk text; v_pending int;
  v_plan public.xplo_plan; v_bonuses public.xplo_bonus[];
  v_pipeline uuid; v_next_col uuid; v_next_chk text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    IF NEW.recurrence_days IS NOT NULL AND NEW.template_key IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.activities
        WHERE deal_id = NEW.deal_id AND template_key = NEW.template_key
          AND status = 'pending' AND id <> NEW.id
      ) THEN
        INSERT INTO public.activities(
          deal_id, client_id, type, subject, description,
          checkpoint_code, checkpoint_label, template_key,
          required_plan, required_bonus, recurrence_days,
          scheduled_at, status, auto_generated
        ) VALUES (
          NEW.deal_id, NEW.client_id, NEW.type, NEW.subject, NEW.description,
          NEW.checkpoint_code, NEW.checkpoint_label,
          NEW.template_key || '_' || extract(epoch from now())::bigint,
          NEW.required_plan, NEW.required_bonus, NEW.recurrence_days,
          now() + (NEW.recurrence_days || ' days')::interval, 'pending', true
        );
      END IF;
    END IF;

    SELECT pc.checkpoint_code, d.pipeline_id INTO v_curr_chk, v_pipeline
    FROM public.deals d JOIN public.pipeline_columns pc ON pc.id = d.column_id
    WHERE d.id = NEW.deal_id;

    IF v_curr_chk IN ('01','02','03','04','05') THEN
      SELECT c.xplo_plan, c.xplo_bonuses INTO v_plan, v_bonuses
      FROM public.clients c JOIN public.deals d ON d.client_id = c.id WHERE d.id = NEW.deal_id;

      SELECT count(*) INTO v_pending FROM public.activities
      WHERE deal_id = NEW.deal_id AND checkpoint_code = v_curr_chk
        AND status <> 'completed'
        AND (required_plan IS NULL OR required_plan = v_plan OR (required_plan = 'basic' AND v_plan = 'pro'))
        AND (required_bonus IS NULL OR required_bonus = ANY(v_bonuses));

      IF v_pending = 0 THEN
        v_next_chk := CASE v_curr_chk
          WHEN '01' THEN '02' WHEN '02' THEN '03' WHEN '03' THEN '04'
          WHEN '04' THEN '05' WHEN '05' THEN 'maint_pending' END;
        SELECT id INTO v_next_col FROM public.pipeline_columns
        WHERE pipeline_id = v_pipeline AND checkpoint_code = v_next_chk LIMIT 1;
        IF v_next_col IS NOT NULL THEN
          UPDATE public.deals SET column_id = v_next_col WHERE id = NEW.deal_id;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_activity_completion ON public.activities;
CREATE TRIGGER trg_activity_completion
AFTER UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.handle_activity_completion();

-- 3) Trigger: semeia tarefas de manutenção ao entrar em maint_active
CREATE OR REPLACE FUNCTION public.seed_maintenance_tasks()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_chk text; v_plan public.xplo_plan;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    SELECT checkpoint_code INTO v_chk FROM public.pipeline_columns WHERE id = NEW.column_id;
    IF v_chk = 'maint_active' THEN
      SELECT xplo_plan INTO v_plan FROM public.clients WHERE id = NEW.client_id;

      INSERT INTO public.activities(
        deal_id, client_id, type, subject, description,
        checkpoint_code, checkpoint_label, template_key,
        required_plan, recurrence_days, scheduled_at, status, auto_generated
      )
      SELECT NEW.id, NEW.client_id, t.type, t.subject, t.description,
             '06', 'Manutenção', t.key, t.required_plan, t.days,
             now() + (t.days || ' days')::interval, 'pending', true
      FROM (VALUES
        ('lembrete'::public.crm_activity_type, 'maint_ig_30d',
         'Programar 30 dias de Instagram',
         'Feed: 2 vídeos curtos e 6 estáticos. Stories: 8 (pode repetir conteúdos de meses anteriores).',
         NULL::public.xplo_plan, 30),
        ('lembrete'::public.crm_activity_type, 'maint_trf_verificacao_7d',
         'Verificação de resultado de tráfego',
         'Checar performance dos anúncios e ajustar segmentação/criativos se necessário.',
         NULL::public.xplo_plan, 7),
        ('lembrete'::public.crm_activity_type, 'maint_trf_relatorio_15d',
         'Entrega de relatório de resultado (quinzenal)',
         'Enviar ao cliente o relatório de tráfego do período.',
         NULL::public.xplo_plan, 15),
        ('lembrete'::public.crm_activity_type, 'maint_trf_troca_30d',
         'Trocar campanhas de tráfego',
         'Renovar criativos e ângulos das campanhas de tráfego.',
         NULL::public.xplo_plan, 30),
        ('lembrete'::public.crm_activity_type, 'maint_ia_15d',
         'Verificar fechamento, atendimento e Follow Up (I.A)',
         'Auditar conversas, qualificação e follow-ups feitos pela IA.',
         'pro'::public.xplo_plan, 15)
      ) AS t(type, key, subject, description, required_plan, days)
      WHERE (t.required_plan IS NULL OR t.required_plan = v_plan)
        AND NOT EXISTS (
          SELECT 1 FROM public.activities a
          WHERE a.deal_id = NEW.id AND a.template_key = t.key
        );
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_seed_maintenance ON public.deals;
CREATE TRIGGER trg_seed_maintenance
AFTER UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.seed_maintenance_tasks();

-- 4) Seed pipeline + colunas
DO $$
DECLARE
  v_pipe uuid; v_max int;
BEGIN
  SELECT id INTO v_pipe FROM public.pipelines ORDER BY sort_order, created_at LIMIT 1;
  IF v_pipe IS NULL THEN
    INSERT INTO public.pipelines (name, description, color, sort_order)
    VALUES ('Entrega de Serviços', 'Pipeline operacional XPLO', '#8B5CF6', 0)
    RETURNING id INTO v_pipe;
  ELSE
    UPDATE public.pipelines SET name = 'Entrega de Serviços' WHERE id = v_pipe;
  END IF;

  -- Marca colunas Ganho/Perdido pré-existentes que ainda não têm code (só uma de cada por pipeline)
  UPDATE public.pipeline_columns SET checkpoint_code = 'won'
   WHERE id = (
     SELECT id FROM public.pipeline_columns
     WHERE pipeline_id = v_pipe AND column_type = 'won' AND checkpoint_code IS NULL
     LIMIT 1
   );
  UPDATE public.pipeline_columns SET checkpoint_code = 'lost'
   WHERE id = (
     SELECT id FROM public.pipeline_columns
     WHERE pipeline_id = v_pipe AND column_type = 'lost' AND checkpoint_code IS NULL
     LIMIT 1
   );

  SELECT COALESCE(MAX(sort_order), -1) INTO v_max FROM public.pipeline_columns WHERE pipeline_id = v_pipe;

  INSERT INTO public.pipeline_columns (pipeline_id, name, color, sort_order, column_type, checkpoint_code)
  SELECT v_pipe, x.name, x.color, v_max + x.ord, x.ctype::public.crm_column_type, x.code
  FROM (VALUES
    ('01 Cadastro',         '#94A3B8', 1, 'normal', '01'),
    ('02 Início',            '#64748B', 2, 'normal', '02'),
    ('03 Estratégia',        '#8B5CF6', 3, 'normal', '03'),
    ('04 Tráfego',           '#A855F7', 4, 'normal', '04'),
    ('05 Entrega',           '#7C3AED', 5, 'normal', '05'),
    ('Manutenção pendente',  '#F59E0B', 6, 'normal', 'maint_pending'),
    ('Manutenção ativa',     '#10B981', 7, 'normal', 'maint_active'),
    ('Ganho',                '#22C55E', 8, 'won',    'won'),
    ('Perdido',              '#EF4444', 9, 'lost',   'lost')
  ) AS x(name, color, ord, ctype, code)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.pipeline_columns
    WHERE pipeline_id = v_pipe AND checkpoint_code = x.code
  );
END $$;
