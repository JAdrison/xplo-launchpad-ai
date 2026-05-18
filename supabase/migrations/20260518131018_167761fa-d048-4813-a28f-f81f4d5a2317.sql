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
  v_base timestamptz;
  v_already_seeded int;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Recurrence (maintenance tasks): re-create next occurrence
    -- Skip traffic_payment%: handled by handle_traffic_payment_completion with correct due date.
    IF NEW.recurrence_days IS NOT NULL
       AND NEW.template_key IS NOT NULL
       AND NEW.template_key NOT LIKE 'traffic_payment%' THEN
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
        IF v_curr_chk = '05' THEN
          SELECT count(*) INTO v_already_seeded FROM public.activities
            WHERE deal_id = NEW.deal_id AND checkpoint_code = '06';
          IF v_already_seeded = 0 THEN
            v_base := now();
            INSERT INTO public.activities(
              deal_id, client_id, type, subject, description,
              checkpoint_code, checkpoint_label, template_key,
              required_plan, recurrence_days, scheduled_at, status, auto_generated
            )
            SELECT NEW.deal_id, NEW.client_id, t.activity_type, t.subject, t.description,
                   '06', 'Manutenção', t.template_key, t.required_plan, t.recurrence_days,
                   v_base + (t.recurrence_days || ' days')::interval, 'pending', true
            FROM public.xplo_task_templates t
            WHERE t.checkpoint_code = '06'
              AND t.is_active = true
              AND (t.required_plan IS NULL OR t.required_plan = v_plan)
              AND NOT EXISTS (
                SELECT 1 FROM public.activities a
                WHERE a.deal_id = NEW.deal_id AND a.template_key = t.template_key
              );
          END IF;
        ELSE
          v_next_chk := CASE v_curr_chk
            WHEN '01' THEN '02' WHEN '02' THEN '03' WHEN '03' THEN '04'
            WHEN '04' THEN '05' END;
          SELECT id INTO v_next_col FROM public.pipeline_columns
            WHERE pipeline_id = v_pipeline AND checkpoint_code = v_next_chk LIMIT 1;
          IF v_next_col IS NOT NULL THEN
            UPDATE public.deals
              SET column_id = v_next_col,
                  entered_current_column_at = now()
              WHERE id = NEW.deal_id;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Remove duplicate pending traffic payment task with wrong subject
DELETE FROM public.activities
WHERE id = 'd1bb76c0-4202-4dd5-a910-27ea6b98ea74';