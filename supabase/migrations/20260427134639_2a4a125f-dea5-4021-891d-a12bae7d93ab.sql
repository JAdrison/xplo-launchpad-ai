-- Separa a função em duas: BEFORE (para mutar NEW) e AFTER (para histórico/automação)
CREATE OR REPLACE FUNCTION public.handle_deal_column_change_before()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_col_type public.crm_column_type;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    NEW.entered_current_column_at := now();

    SELECT column_type INTO v_col_type
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
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_deal_column_change_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_auto_enabled boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.deal_history (deal_id, event_type, event_data)
    VALUES (NEW.id, 'created', jsonb_build_object('column_id', NEW.column_id));

    SELECT automation_enabled INTO v_auto_enabled
    FROM public.pipeline_columns WHERE id = NEW.column_id;

    IF v_auto_enabled THEN
      PERFORM public.apply_column_automations(NEW.id, NEW.column_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    INSERT INTO public.deal_history (deal_id, event_type, event_data)
    VALUES (NEW.id, 'moved', jsonb_build_object(
      'from_column', OLD.column_id, 'to_column', NEW.column_id
    ));

    SELECT automation_enabled INTO v_auto_enabled
    FROM public.pipeline_columns WHERE id = NEW.column_id;

    IF v_auto_enabled THEN
      PERFORM public.apply_column_automations(NEW.id, NEW.column_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Remove qualquer trigger antigo e recria nas fases corretas
DROP TRIGGER IF EXISTS trg_handle_deal_column_change ON public.deals;
DROP TRIGGER IF EXISTS handle_deal_column_change ON public.deals;
DROP TRIGGER IF EXISTS deals_column_change_trigger ON public.deals;
DROP TRIGGER IF EXISTS trg_deals_column_change ON public.deals;
DROP TRIGGER IF EXISTS trg_deal_column_before ON public.deals;
DROP TRIGGER IF EXISTS trg_deal_column_after ON public.deals;

CREATE TRIGGER trg_deal_column_before
BEFORE INSERT OR UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.handle_deal_column_change_before();

CREATE TRIGGER trg_deal_column_after
AFTER INSERT OR UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.handle_deal_column_change_after();