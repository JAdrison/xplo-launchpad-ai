
-- =====================================================================
-- 1) DROP ALL PUBLIC POLICIES on business tables
-- =====================================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
      AND tablename IN (
        'clients','client_profile','client_swot','client_icp','client_promise',
        'client_icp_documents','client_offer_documents','client_traffic_plan_documents',
        'icps','icp_pains','offers_hormozi','landing_pages','ads','versions','client_tokens'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- =====================================================================
-- 2) CREATE authenticated-only policies on each table
-- =====================================================================

-- Helper macro pattern (inline per table)

-- clients
CREATE POLICY "auth_select_clients" ON public.clients FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_clients" ON public.clients FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_clients" ON public.clients FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- client_profile
CREATE POLICY "auth_select_client_profile" ON public.client_profile FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_client_profile" ON public.client_profile FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_client_profile" ON public.client_profile FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_client_profile" ON public.client_profile FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- client_swot
CREATE POLICY "auth_select_client_swot" ON public.client_swot FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_client_swot" ON public.client_swot FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_client_swot" ON public.client_swot FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_client_swot" ON public.client_swot FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- client_icp
CREATE POLICY "auth_select_client_icp" ON public.client_icp FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_client_icp" ON public.client_icp FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_client_icp" ON public.client_icp FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_client_icp" ON public.client_icp FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- client_promise
CREATE POLICY "auth_select_client_promise" ON public.client_promise FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_client_promise" ON public.client_promise FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_client_promise" ON public.client_promise FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_client_promise" ON public.client_promise FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- client_icp_documents
CREATE POLICY "auth_select_client_icp_documents" ON public.client_icp_documents FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_client_icp_documents" ON public.client_icp_documents FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_client_icp_documents" ON public.client_icp_documents FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_client_icp_documents" ON public.client_icp_documents FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- client_offer_documents
CREATE POLICY "auth_select_client_offer_documents" ON public.client_offer_documents FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_client_offer_documents" ON public.client_offer_documents FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_client_offer_documents" ON public.client_offer_documents FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_client_offer_documents" ON public.client_offer_documents FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- client_traffic_plan_documents
CREATE POLICY "auth_select_client_traffic_plan_documents" ON public.client_traffic_plan_documents FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_client_traffic_plan_documents" ON public.client_traffic_plan_documents FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_client_traffic_plan_documents" ON public.client_traffic_plan_documents FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_client_traffic_plan_documents" ON public.client_traffic_plan_documents FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- icps
CREATE POLICY "auth_select_icps" ON public.icps FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_icps" ON public.icps FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_icps" ON public.icps FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_icps" ON public.icps FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- icp_pains
CREATE POLICY "auth_select_icp_pains" ON public.icp_pains FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_icp_pains" ON public.icp_pains FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_icp_pains" ON public.icp_pains FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_icp_pains" ON public.icp_pains FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- offers_hormozi
CREATE POLICY "auth_select_offers_hormozi" ON public.offers_hormozi FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_offers_hormozi" ON public.offers_hormozi FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_offers_hormozi" ON public.offers_hormozi FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_offers_hormozi" ON public.offers_hormozi FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- landing_pages
CREATE POLICY "auth_select_landing_pages" ON public.landing_pages FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_landing_pages" ON public.landing_pages FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_landing_pages" ON public.landing_pages FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_landing_pages" ON public.landing_pages FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- ads
CREATE POLICY "auth_select_ads" ON public.ads FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_ads" ON public.ads FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_update_ads" ON public.ads FOR UPDATE TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_delete_ads" ON public.ads FOR DELETE TO authenticated USING (public.has_crm_access(auth.uid()));

-- versions
CREATE POLICY "auth_select_versions" ON public.versions FOR SELECT TO authenticated USING (public.has_crm_access(auth.uid()));
CREATE POLICY "auth_insert_versions" ON public.versions FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));

-- client_tokens — only admins can read/manage; external onboarding uses edge function with service role
CREATE POLICY "admin_select_client_tokens" ON public.client_tokens FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_client_tokens" ON public.client_tokens FOR INSERT TO authenticated WITH CHECK (public.has_crm_access(auth.uid()));
CREATE POLICY "admin_update_client_tokens" ON public.client_tokens FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_client_tokens" ON public.client_tokens FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 3) USER_API_KEYS table for AI keys (replaces localStorage storage)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('openai','gemini','custom')),
  encrypted_key text NOT NULL,
  label text,
  source text NOT NULL DEFAULT 'custom' CHECK (source IN ('lovable','xplo','custom')),
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_api_keys" ON public.user_api_keys
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_api_keys" ON public.user_api_keys
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_api_keys" ON public.user_api_keys
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_delete_own_api_keys" ON public.user_api_keys
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- 4) Token hash column (for future migration to hashed tokens)
-- =====================================================================
ALTER TABLE public.client_tokens ADD COLUMN IF NOT EXISTS token_hash text;
CREATE INDEX IF NOT EXISTS idx_client_tokens_token_hash ON public.client_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_client_tokens_token ON public.client_tokens(token);
