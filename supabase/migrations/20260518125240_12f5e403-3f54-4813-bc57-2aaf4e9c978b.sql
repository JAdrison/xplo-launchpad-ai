CREATE OR REPLACE FUNCTION public.assign_activity_responsible()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
BEGIN
  IF NEW.responsible_id IS NULL AND NEW.required_function IS NOT NULL THEN
    SELECT ujf.user_id INTO v_user
    FROM public.user_job_functions ujf
    JOIN public.user_roles ur ON ur.user_id = ujf.user_id
    JOIN auth.users au ON au.id = ujf.user_id
    WHERE ujf.job_function = NEW.required_function
      AND ur.role IN ('admin','user')
      AND au.deleted_at IS NULL
      AND (au.banned_until IS NULL OR au.banned_until <= now())
    ORDER BY ujf.created_at ASC
    LIMIT 1;

    IF v_user IS NOT NULL THEN
      NEW.responsible_id := v_user;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;