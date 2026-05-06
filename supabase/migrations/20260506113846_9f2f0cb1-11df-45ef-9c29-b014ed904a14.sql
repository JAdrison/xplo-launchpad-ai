
-- Function: extract client_token header from request
CREATE OR REPLACE FUNCTION public.current_request_client_token()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(
    current_setting('request.headers', true)::json ->> 'x-client-token',
    ''
  )
$$;

-- Function: returns client_id if a valid token is present in the request headers
CREATE OR REPLACE FUNCTION public.client_id_from_request_token()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id
  FROM public.client_tokens
  WHERE token = public.current_request_client_token()
    AND expires_at > now()
    AND used_at IS NULL
  LIMIT 1
$$;

-- Allow anon to read their own client row when a valid token is presented
CREATE POLICY "anon_token_select_clients" ON public.clients
  FOR SELECT TO anon
  USING (id = public.client_id_from_request_token());

CREATE POLICY "anon_token_update_clients" ON public.clients
  FOR UPDATE TO anon
  USING (id = public.client_id_from_request_token())
  WITH CHECK (id = public.client_id_from_request_token());

-- client_profile
CREATE POLICY "anon_token_select_client_profile" ON public.client_profile
  FOR SELECT TO anon USING (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_insert_client_profile" ON public.client_profile
  FOR INSERT TO anon WITH CHECK (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_update_client_profile" ON public.client_profile
  FOR UPDATE TO anon USING (client_id = public.client_id_from_request_token())
  WITH CHECK (client_id = public.client_id_from_request_token());

-- client_swot
CREATE POLICY "anon_token_select_client_swot" ON public.client_swot
  FOR SELECT TO anon USING (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_insert_client_swot" ON public.client_swot
  FOR INSERT TO anon WITH CHECK (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_update_client_swot" ON public.client_swot
  FOR UPDATE TO anon USING (client_id = public.client_id_from_request_token())
  WITH CHECK (client_id = public.client_id_from_request_token());

-- client_icp
CREATE POLICY "anon_token_select_client_icp" ON public.client_icp
  FOR SELECT TO anon USING (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_insert_client_icp" ON public.client_icp
  FOR INSERT TO anon WITH CHECK (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_update_client_icp" ON public.client_icp
  FOR UPDATE TO anon USING (client_id = public.client_id_from_request_token())
  WITH CHECK (client_id = public.client_id_from_request_token());

-- client_promise
CREATE POLICY "anon_token_select_client_promise" ON public.client_promise
  FOR SELECT TO anon USING (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_insert_client_promise" ON public.client_promise
  FOR INSERT TO anon WITH CHECK (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_update_client_promise" ON public.client_promise
  FOR UPDATE TO anon USING (client_id = public.client_id_from_request_token())
  WITH CHECK (client_id = public.client_id_from_request_token());

-- icps
CREATE POLICY "anon_token_select_icps" ON public.icps
  FOR SELECT TO anon USING (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_insert_icps" ON public.icps
  FOR INSERT TO anon WITH CHECK (client_id = public.client_id_from_request_token());
CREATE POLICY "anon_token_update_icps" ON public.icps
  FOR UPDATE TO anon USING (client_id = public.client_id_from_request_token())
  WITH CHECK (client_id = public.client_id_from_request_token());

-- icp_pains (joined via icps.client_id)
CREATE POLICY "anon_token_select_icp_pains" ON public.icp_pains
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.icps i WHERE i.id = icp_pains.icp_id AND i.client_id = public.client_id_from_request_token())
  );
CREATE POLICY "anon_token_insert_icp_pains" ON public.icp_pains
  FOR INSERT TO anon WITH CHECK (
    EXISTS (SELECT 1 FROM public.icps i WHERE i.id = icp_pains.icp_id AND i.client_id = public.client_id_from_request_token())
  );

-- client_tokens: anon can SELECT only their own valid token (for validation) and UPDATE used_at on it
CREATE POLICY "anon_token_select_own_token" ON public.client_tokens
  FOR SELECT TO anon
  USING (token = public.current_request_client_token() AND expires_at > now());

CREATE POLICY "anon_token_mark_used" ON public.client_tokens
  FOR UPDATE TO anon
  USING (token = public.current_request_client_token() AND expires_at > now())
  WITH CHECK (token = public.current_request_client_token());
