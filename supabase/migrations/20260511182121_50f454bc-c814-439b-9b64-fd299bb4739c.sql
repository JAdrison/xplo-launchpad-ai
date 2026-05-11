CREATE OR REPLACE FUNCTION public.sync_traffic_payment_task(_client_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_day int; v_lead int; v_value bigint; v_rec int;
  v_deal uuid;
  v_due date; v_scheduled timestamptz;
  v_subject text;
BEGIN
  SELECT traffic_payment_day, COALESCE(traffic_payment_lead_days, 3),
         traffic_payment_value_cents, COALESCE(traffic_payment_recurrence_days, 30)
    INTO v_day, v_lead, v_value, v_rec
  FROM public.clients WHERE id = _client_id;

  IF v_day IS NULL THEN RETURN; END IF;

  SELECT id INTO v_deal FROM public.deals
    WHERE client_id = _client_id ORDER BY created_at DESC LIMIT 1;
  IF v_deal IS NULL THEN RETURN; END IF;

  IF v_rec >= 28 THEN
    v_due := public.next_payment_due_date(current_date, v_day);
  ELSE
    v_due := current_date + (v_rec || ' days')::interval;
  END IF;
  v_scheduled := ((v_due - (v_lead || ' days')::interval)::timestamp
                  AT TIME ZONE 'America/Sao_Paulo');

  v_subject := 'Cobrar verba de tráfego' ||
    CASE WHEN v_value IS NOT NULL THEN ' (R$ ' || to_char((v_value::numeric/100), 'FM999G999G990D00') || ')' ELSE '' END ||
    ' — vence ' || to_char(v_due, 'DD/MM');

  IF EXISTS (
    SELECT 1 FROM public.activities
    WHERE deal_id = v_deal AND template_key LIKE 'traffic_payment%' AND status = 'pending'
  ) THEN
    UPDATE public.activities
      SET subject = v_subject,
          scheduled_at = v_scheduled,
          recurrence_days = v_rec,
          required_function = 'gestor_trafego',
          updated_at = now()
      WHERE deal_id = v_deal AND template_key LIKE 'traffic_payment%' AND status = 'pending';
    RETURN;
  END IF;

  INSERT INTO public.activities(
    deal_id, client_id, type, subject, description,
    checkpoint_code, checkpoint_label, template_key,
    required_function, recurrence_days, scheduled_at, status, auto_generated
  ) VALUES (
    v_deal, _client_id, 'lembrete', v_subject,
    'Lembrete automático para cobrar/enviar boleto da verba de tráfego.',
    '06', 'Manutenção',
    'traffic_payment_' || extract(epoch from now())::bigint,
    'gestor_trafego', v_rec, v_scheduled, 'pending', true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_traffic_payment_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_day int; v_lead int; v_value bigint; v_rec int;
  v_due date; v_scheduled timestamptz; v_subject text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.template_key LIKE 'traffic_payment%' THEN

    SELECT traffic_payment_day, COALESCE(traffic_payment_lead_days, 3),
           traffic_payment_value_cents, COALESCE(traffic_payment_recurrence_days, 30)
      INTO v_day, v_lead, v_value, v_rec
    FROM public.clients WHERE id = NEW.client_id;

    IF v_day IS NULL THEN RETURN NEW; END IF;

    IF v_rec >= 28 THEN
      v_due := public.next_payment_due_date(current_date, v_day);
      IF v_due <= current_date + interval '1 day' THEN
        v_due := public.next_payment_due_date((date_trunc('month', current_date) + interval '1 month')::date, v_day);
      END IF;
    ELSE
      v_due := current_date + (v_rec || ' days')::interval;
    END IF;
    v_scheduled := ((v_due - (v_lead || ' days')::interval)::timestamp
                    AT TIME ZONE 'America/Sao_Paulo');

    v_subject := 'Cobrar verba de tráfego' ||
      CASE WHEN v_value IS NOT NULL THEN ' (R$ ' || to_char((v_value::numeric/100), 'FM999G999G990D00') || ')' ELSE '' END ||
      ' — vence ' || to_char(v_due, 'DD/MM');

    INSERT INTO public.activities(
      deal_id, client_id, type, subject, description,
      checkpoint_code, checkpoint_label, template_key,
      required_function, recurrence_days, scheduled_at, status, auto_generated
    ) VALUES (
      NEW.deal_id, NEW.client_id, 'lembrete', v_subject,
      'Lembrete automático para cobrar/enviar boleto da verba de tráfego.',
      '06', 'Manutenção',
      'traffic_payment_' || extract(epoch from now())::bigint,
      'gestor_trafego', v_rec, v_scheduled, 'pending', true
    );
  END IF;
  RETURN NEW;
END;
$function$;