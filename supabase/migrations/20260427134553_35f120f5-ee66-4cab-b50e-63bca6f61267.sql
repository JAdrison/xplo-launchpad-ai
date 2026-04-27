-- Função para auto-criar deal quando um cliente é criado
CREATE OR REPLACE FUNCTION public.auto_create_deal_for_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pipeline_id uuid;
  v_column_id uuid;
BEGIN
  -- Pega o primeiro pipeline (menor sort_order)
  SELECT id INTO v_pipeline_id
  FROM public.pipelines
  ORDER BY sort_order, created_at
  LIMIT 1;

  IF v_pipeline_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Pega a primeira coluna desse pipeline
  SELECT id INTO v_column_id
  FROM public.pipeline_columns
  WHERE pipeline_id = v_pipeline_id
  ORDER BY sort_order, created_at
  LIMIT 1;

  IF v_column_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.deals (client_id, pipeline_id, column_id, name, value_cents, status)
  VALUES (NEW.id, v_pipeline_id, v_column_id, NEW.name, 0, 'active');

  RETURN NEW;
END;
$$;

-- Trigger para novos clientes
DROP TRIGGER IF EXISTS trg_auto_create_deal_for_client ON public.clients;
CREATE TRIGGER trg_auto_create_deal_for_client
AFTER INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_deal_for_client();