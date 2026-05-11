CREATE OR REPLACE FUNCTION public.verify_api_key(_raw text)
RETURNS TABLE(user_id uuid, scopes text[], key_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
BEGIN
  v_hash := encode(extensions.digest(_raw, 'sha256'), 'hex');

  RETURN QUERY
  SELECT k.user_id, k.scopes, k.id
  FROM public.api_keys k
  WHERE k.key_hash = v_hash
    AND k.revoked_at IS NULL
  LIMIT 1;

  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE key_hash = v_hash
    AND revoked_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_api_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_api_key(text) TO service_role;