-- 1) Renomear coluna 'Manutenção ativa' para 'Manutenção'
UPDATE public.pipeline_columns
   SET name = 'Manutenção'
 WHERE checkpoint_code = 'maint_active';

-- 2) Mover deals que estão em 'maint_pending' para 'maint_active' e deletar a coluna pendente
DO $$
DECLARE
  v_pending_id uuid;
  v_active_id uuid;
  v_pipe uuid;
BEGIN
  FOR v_pipe IN SELECT DISTINCT pipeline_id FROM public.pipeline_columns WHERE checkpoint_code IN ('maint_pending','maint_active')
  LOOP
    SELECT id INTO v_pending_id FROM public.pipeline_columns WHERE pipeline_id = v_pipe AND checkpoint_code = 'maint_pending';
    SELECT id INTO v_active_id  FROM public.pipeline_columns WHERE pipeline_id = v_pipe AND checkpoint_code = 'maint_active';

    IF v_pending_id IS NOT NULL AND v_active_id IS NOT NULL THEN
      UPDATE public.deals SET column_id = v_active_id WHERE column_id = v_pending_id;
      DELETE FROM public.column_automations WHERE column_id = v_pending_id;
      DELETE FROM public.pipeline_columns WHERE id = v_pending_id;
    END IF;
  END LOOP;
END $$;

-- 3) Atualizar trigger handle_activity_completion: ao finalizar a etapa 05, ir direto para maint_active
CREATE OR REPLACE FUNCTION public.handle_activity_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
          WHEN '04' THEN '05' WHEN '05' THEN 'maint_active' END;
        SELECT id INTO v_next_col FROM public.pipeline_columns
        WHERE pipeline_id = v_pipeline AND checkpoint_code = v_next_chk LIMIT 1;
        IF v_next_col IS NOT NULL THEN
          UPDATE public.deals SET column_id = v_next_col WHERE id = NEW.deal_id;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $function$;

-- 4) Função RPC para iniciar manutenção manualmente (gera as 5 tarefas se ainda não existirem)
CREATE OR REPLACE FUNCTION public.start_maintenance_for_deal(_deal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_client uuid; v_plan public.xplo_plan;
BEGIN
  SELECT client_id INTO v_client FROM public.deals WHERE id = _deal_id;
  IF v_client IS NULL THEN RETURN; END IF;
  SELECT xplo_plan INTO v_plan FROM public.clients WHERE id = v_client;

  INSERT INTO public.activities(
    deal_id, client_id, type, subject, description,
    checkpoint_code, checkpoint_label, template_key,
    required_plan, recurrence_days, scheduled_at, status, auto_generated
  )
  SELECT _deal_id, v_client, t.type, t.subject, t.description,
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
      WHERE a.deal_id = _deal_id AND a.template_key = t.key
    );
END; $function$;

GRANT EXECUTE ON FUNCTION public.start_maintenance_for_deal(uuid) TO authenticated;