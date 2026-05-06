---
name: Hardening de seguran\u00e7a
description: Resumo das blindagens de RLS, edge functions e armazenamento de chaves de IA
type: feature
---
- Todas as tabelas de neg\u00f3cio (clients, client_profile, client_swot, client_icp, client_promise, client_*_documents, icps, icp_pains, offers_hormozi, landing_pages, ads, versions) s\u00f3 aceitam acesso por usu\u00e1rios autenticados via `has_crm_access(auth.uid())`.
- `client_tokens`: leitura/escrita por admin autenticado; tokens v\u00e1lidos podem ser lidos/usados anonimamente apenas via header `x-client-token`.
- Onboarding externo (`/onboarding/external/:token`) injeta `x-client-token` em todas as chamadas Supabase via patch global de `fetch` enquanto a p\u00e1gina est\u00e1 montada. Pol\u00edticas `anon_token_*` validam o `client_id` da linha contra `public.client_id_from_request_token()`.
- Edge functions `generate-content` e `send-webhook` exigem JWT v\u00e1lido (ou `x-client-token` v\u00e1lido em generate-content) — sem mais acesso an\u00f4nimo.
- Chaves de IA (OpenAI/Gemini) saem do localStorage e v\u00e3o para a tabela `user_api_keys` com RLS por dono. Edge function `user-ai-config` faz get/save/clear. `getAIConfig()` continua s\u00edncrono lendo de cache em mem\u00f3ria; `hydrateAIConfig()` roda no `useAuth` ao logar e `purgeLegacyAIConfigFromLocalStorage()` apaga vest\u00edgios.
- HIBP password protection ativado.
