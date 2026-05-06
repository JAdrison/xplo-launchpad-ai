
-- Revoke EXECUTE from anon on functions that should not be callable without auth
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_crm_access(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.apply_column_automations(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_deal_column_change() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_deal_column_change_after() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_deal_column_change_before() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.auto_create_deal_for_client() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_crm_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
