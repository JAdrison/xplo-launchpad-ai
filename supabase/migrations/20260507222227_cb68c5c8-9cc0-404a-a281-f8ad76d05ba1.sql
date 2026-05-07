
-- 1. Restringir INSERT de client_tokens só para admin
DROP POLICY IF EXISTS "admin_insert_client_tokens" ON public.client_tokens;
CREATE POLICY "admin_insert_client_tokens"
  ON public.client_tokens FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Permitir UPDATE anônimo via token em icp_pains
CREATE POLICY "anon_token_update_icp_pains" ON public.icp_pains
  FOR UPDATE TO anon
  USING (
    EXISTS (SELECT 1 FROM public.icps i WHERE i.id = icp_pains.icp_id AND i.client_id = public.client_id_from_request_token())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.icps i WHERE i.id = icp_pains.icp_id AND i.client_id = public.client_id_from_request_token())
  );

CREATE POLICY "anon_token_delete_icp_pains" ON public.icp_pains
  FOR DELETE TO anon
  USING (
    EXISTS (SELECT 1 FROM public.icps i WHERE i.id = icp_pains.icp_id AND i.client_id = public.client_id_from_request_token())
  );

-- 3. Realtime authorization: só usuários com acesso ao CRM podem assinar canais
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_users_can_read_realtime" ON realtime.messages;
CREATE POLICY "crm_users_can_read_realtime"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (public.has_crm_access(auth.uid()));
