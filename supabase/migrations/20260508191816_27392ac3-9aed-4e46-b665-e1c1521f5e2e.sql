
-- Add traffic payment config to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS traffic_payment_day integer,
  ADD COLUMN IF NOT EXISTS traffic_payment_lead_days integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS traffic_payment_value_cents bigint;

-- Function: compute next payment due date from a base date and target day-of-month
CREATE OR REPLACE FUNCTION public.next_payment_due_date(_from date, _day int)
RETURNS date
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_year int := extract(year from _from)::int;
  v_month int := extract(month from _from)::int;
  v_eom int;
  v_day int;
  v_candidate date;
BEGIN
  v_eom := extract(day from (date_trunc('month', _from) + interval '1 month - 1 day'))::int;
  v_day := least(_day, v_eom);
  v_candidate := make_date(v_year, v_month, v_day);
  IF v_candidate <= _from THEN
    v_candidate := (date_trunc('month', _from) + interval '1 month')::date;
    v_eom := extract(day from (date_trunc('month', v_candidate) + interval '1 month - 1 day'))::int;
    v_candidate := make_date(extract(year from v_candidate)::int, extract(month from v_candidate)::int, least(_day, v_eom));
  END IF;
  RETURN v_candidate;
END;
$$;

-- Function: create or sync the next pending traffic payment task for a client's latest deal
CREATE OR REPLACE FUNCTION public.sync_traffic_payment_task(_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day int; v_lead int; v_value bigint;
  v_deal uuid;
  v_due date; v_scheduled timestamptz;
  v_subject text;
BEGIN
  SELECT traffic_payment_day, COALESCE(traffic_payment_lead_days, 3), traffic_payment_value_cents
    INTO v_day, v_lead, v_value
  FROM public.clients WHERE id = _client_id;

  IF v_day IS NULL THEN RETURN; END IF;

  SELECT id INTO v_deal FROM public.deals
    WHERE client_id = _client_id ORDER BY created_at DESC LIMIT 1;
  IF v_deal IS NULL THEN RETURN; END IF;

  v_due := public.next_payment_due_date(current_date, v_day);
  v_scheduled := (v_due - (v_lead || ' days')::interval)::timestamptz;

  v_subject := 'Cobrar verba de tráfego' ||
    CASE WHEN v_value IS NOT NULL THEN ' (R$ ' || to_char((v_value::numeric/100), 'FM999G999G990D00') || ')' ELSE '' END ||
    ' — vence ' || to_char(v_due, 'DD/MM');

  -- Skip if there is already a pending traffic payment task for this deal
  IF EXISTS (
    SELECT 1 FROM public.activities
    WHERE deal_id = v_deal AND template_key LIKE 'traffic_payment%' AND status = 'pending'
  ) THEN
    -- Update the existing pending task to reflect new config
    UPDATE public.activities
      SET subject = v_subject,
          scheduled_at = v_scheduled,
          required_function = 'gestor_trafego',
          updated_at = now()
      WHERE deal_id = v_deal AND template_key LIKE 'traffic_payment%' AND status = 'pending';
    RETURN;
  END IF;

  INSERT INTO public.activities(
    deal_id, client_id, type, subject, description,
    checkpoint_code, checkpoint_label, template_key,
    required_function, scheduled_at, status, auto_generated
  ) VALUES (
    v_deal, _client_id, 'lembrete', v_subject,
    'Lembrete automático para cobrar/enviar boleto da verba de tráfego do mês.',
    '06', 'Manutenção',
    'traffic_payment_' || extract(epoch from now())::bigint,
    'gestor_trafego', v_scheduled, 'pending', true
  );
END;
$$;

-- Trigger: when a traffic_payment task is completed, create the next one
CREATE OR REPLACE FUNCTION public.handle_traffic_payment_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day int; v_lead int; v_value bigint;
  v_due date; v_scheduled timestamptz; v_subject text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.template_key LIKE 'traffic_payment%' THEN

    SELECT traffic_payment_day, COALESCE(traffic_payment_lead_days, 3), traffic_payment_value_cents
      INTO v_day, v_lead, v_value
    FROM public.clients WHERE id = NEW.client_id;

    IF v_day IS NULL THEN RETURN NEW; END IF;

    -- Next due is the next occurrence after today (skip current month)
    v_due := public.next_payment_due_date(current_date, v_day);
    -- If today is still before this month's due, push to next month
    IF v_due <= current_date + interval '1 day' THEN
      v_due := public.next_payment_due_date((date_trunc('month', current_date) + interval '1 month')::date, v_day);
    END IF;
    v_scheduled := (v_due - (v_lead || ' days')::interval)::timestamptz;

    v_subject := 'Cobrar verba de tráfego' ||
      CASE WHEN v_value IS NOT NULL THEN ' (R$ ' || to_char((v_value::numeric/100), 'FM999G999G990D00') || ')' ELSE '' END ||
      ' — vence ' || to_char(v_due, 'DD/MM');

    INSERT INTO public.activities(
      deal_id, client_id, type, subject, description,
      checkpoint_code, checkpoint_label, template_key,
      required_function, scheduled_at, status, auto_generated
    ) VALUES (
      NEW.deal_id, NEW.client_id, 'lembrete', v_subject,
      'Lembrete automático para cobrar/enviar boleto da verba de tráfego do mês.',
      '06', 'Manutenção',
      'traffic_payment_' || extract(epoch from now())::bigint,
      'gestor_trafego', v_scheduled, 'pending', true
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_traffic_payment_completion ON public.activities;
CREATE TRIGGER trg_traffic_payment_completion
AFTER UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.handle_traffic_payment_completion();
