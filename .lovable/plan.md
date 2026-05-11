## XPLO Starter — API REST + MCP + Documentação

Plano enxuto baseado na proposta original (sem hierarquia de chaves, sem rate-limit em tabela, sem custom domain) + página de docs interativa + manual de uso em Markdown.

### 1. Banco — 1 tabela nova

`api_keys`:
- `id`, `user_id` (dono), `name`, `key_prefix` (visível, ex: `xplo_sk_abc12345`), `key_hash` (SHA-256), `scopes text[]`, `last_used_at`, `revoked_at`, `created_at`
- RLS: dono lê/cria/revoga só as próprias
- RPC `verify_api_key(_raw text)` SECURITY DEFINER → retorna `user_id` + `scopes` se válida

Sem tabela de logs, sem tabela de rate-limit (v1 simples).

### 2. Edge Function `api` (router único)

`supabase/functions/api/index.ts` com Hono + middleware:
1. Lê `Authorization: Bearer xplo_sk_...`
2. Chama `verify_api_key` → obtém `user_id`
3. Cria client Supabase com service role + injeta `user_id` no contexto via header customizado
4. Roteia para handler

**Endpoints (escopo enxuto, cobre o essencial):**

CRM:
- `GET /deals` `POST /deals` `PATCH /deals/:id` `DELETE /deals/:id`
- `GET /activities` `POST /activities` `PATCH /activities/:id`
- `GET /clients` `GET /clients/:id`

Onboarding:
- `GET /clients/:id/onboarding` (consolidado: profile + swot + market + icps + promise + pains)
- `POST /clients/:id/onboarding/start` (cria token externo de 7 dias)

IA (reusa `generate-content` existente):
- `POST /clients/:id/icps/generate`
- `POST /clients/:id/promise/generate`
- `POST /clients/:id/offers/generate`
- `POST /clients/:id/landing-pages/generate`
- `POST /clients/:id/ads/generate`
- `POST /clients/:id/demand-plan/generate`

Envelope padrão `{ data, meta: { request_id, timestamp } }` ou `{ error: { code, message }, meta }`.

### 3. Edge Function `mcp` (mcp-lite + Hono)

`supabase/functions/mcp/index.ts` expõe as mesmas operações como tools MCP:
- `list_deals`, `get_deal`, `create_deal`, `move_deal`
- `create_activity`, `complete_activity`
- `get_client_onboarding`, `start_onboarding`
- `generate_icps`, `generate_offers`, `generate_ads`, `generate_landing_page`

Mesma auth via API Key (`Authorization: Bearer xplo_sk_...`). Reusa internamente os handlers da function `api`.

### 4. UI — gestão de chaves + docs

**`/settings` → nova seção "API Keys":**
- Botão "Criar chave" → modal pede nome → mostra chave completa **uma única vez** com botão copiar
- Lista chaves existentes (prefix + nome + últ. uso) com botão revogar

**Nova página `/api-docs` (rota no `App.tsx`):**
- Renderiza Swagger UI a partir de `public/openapi.yaml`
- Bloco extra "MCP Server" no topo com:
  - URL: `https://fsfspsydntutwftdihih.supabase.co/functions/v1/mcp`
  - Snippet JSON pronto para Claude Desktop (`claude_desktop_config.json`)
  - Snippet para Cursor

### 5. Documentação (3 arquivos)

**`public/openapi.yaml`** — spec OpenAPI 3.1 completa de todos os endpoints REST. Renderizada pela `/api-docs` e baixável.

**`public/mcp.json`** — manifesto MCP com todas as tools, inputSchemas e descriptions.

**`docs/MANUAL.md`** (e link de download na `/api-docs`) — manual de uso em PT-BR com:
- Como gerar uma API key em `/settings`
- Como testar com `curl` (exemplos para 5 cenários: listar deals, criar deal, buscar onboarding, gerar ICPs, conectar MCP no Claude)
- Tabela de erros (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`)
- Boas práticas (não commitar a key, revogar se vazou, usar em backend não em browser)
- Seção MCP: passo-a-passo configurar Claude Desktop / Cursor

### 6. Ordem de execução (1 sprint)

1. Migration `api_keys` + RPC `verify_api_key` (peço aprovação)
2. Edge function `api` com auth middleware + endpoints REST
3. Edge function `mcp` reusando handlers
4. UI em `/settings` (criar/listar/revogar chaves)
5. Página `/api-docs` + `public/openapi.yaml` + `public/mcp.json`
6. `docs/MANUAL.md`
7. Testes via `curl` nos 5 cenários do manual

### Decisões já tomadas (do plano original)

- ✅ Auth: API Key por usuário (sem hierarquia/scopes complexos — apenas `read` e `write` por enquanto)
- ✅ Hash: SHA-256 (rápido, suficiente para chaves high-entropy)
- ✅ Sem custom domain — usa URL Supabase
- ✅ Sem rate limit em v1 (adicionar depois se necessário)
- ✅ MCP via mcp-lite na mesma infra
- ✅ Docs: Swagger UI em `/api-docs` + Manual MD baixável

Confirma? Se sim, começo pela migration.