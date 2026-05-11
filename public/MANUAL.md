# XPLO Starter — Manual da API e MCP

Este manual ensina a usar a **API REST** e o **servidor MCP** do XPLO Starter para integrar com n8n, Make, Zapier, scripts próprios ou clientes MCP como Claude Desktop e Cursor.

- **Base URL da API:** `https://fsfspsydntutwftdihih.supabase.co/functions/v1/api`
- **URL do MCP:** `https://fsfspsydntutwftdihih.supabase.co/functions/v1/mcp`
- **Documentação interativa:** [/api-docs](https://starter.xplo.com.br/api-docs)

---

## 1. Gerar uma API Key

1. Faça login em https://starter.xplo.com.br
2. Vá em **Configurações** (`/admin/settings`)
3. Role até a seção **API Keys** → clique em **Nova chave**
4. Dê um nome descritivo (ex: `n8n produção`, `Claude MCP`)
5. **Copie e guarde a chave imediatamente** — ela começa com `xplo_sk_` e só é mostrada uma vez

> ⚠️ Se perder, basta criar outra. Para revogar, clique no ícone de lixeira na lista.

---

## 2. Autenticação

Toda chamada (exceto `/health`) precisa do header:

```
Authorization: Bearer xplo_sk_SUA_CHAVE_AQUI
```

---

## 3. Exemplos com `curl`

### 3.1 Health check
```bash
curl https://fsfspsydntutwftdihih.supabase.co/functions/v1/api/health
```

### 3.2 Listar deals
```bash
curl https://fsfspsydntutwftdihih.supabase.co/functions/v1/api/deals \
  -H "Authorization: Bearer xplo_sk_..."
```

### 3.3 Criar deal
```bash
curl -X POST https://fsfspsydntutwftdihih.supabase.co/functions/v1/api/deals \
  -H "Authorization: Bearer xplo_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "11111111-1111-1111-1111-111111111111",
    "name": "Lead via API",
    "value_cents": 250000
  }'
```

### 3.4 Buscar onboarding completo
```bash
curl https://fsfspsydntutwftdihih.supabase.co/functions/v1/api/clients/CLIENT_ID/onboarding \
  -H "Authorization: Bearer xplo_sk_..."
```
Retorna `profile`, `promise`, `icps`, `offers`, `landing_pages`, `ads`.

### 3.5 Gerar ICPs com IA
```bash
curl -X POST https://fsfspsydntutwftdihih.supabase.co/functions/v1/api/clients/CLIENT_ID/icps/generate \
  -H "Authorization: Bearer xplo_sk_..." \
  -H "Content-Type: application/json" \
  -d '{}'
```
Outras gerações disponíveis: `promise`, `offers`, `demand-plan`.

### 3.6 Iniciar onboarding externo
```bash
curl -X POST https://fsfspsydntutwftdihih.supabase.co/functions/v1/api/clients/CLIENT_ID/onboarding/start \
  -H "Authorization: Bearer xplo_sk_..."
```
Retorna `onboarding_url` válida por 7 dias para o cliente preencher sem login.

---

## 4. Envelope de resposta

Sucesso:
```json
{
  "data": { ... },
  "meta": { "request_id": "uuid", "timestamp": "ISO8601" }
}
```

Erro:
```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "client_id is required" },
  "meta": { ... }
}
```

| Código | HTTP | Significado |
| --- | --- | --- |
| `UNAUTHENTICATED` | 401 | Chave ausente, inválida ou revogada |
| `FORBIDDEN` | 403 | Chave sem o escopo necessário (`read`/`write`) |
| `NOT_FOUND` | 404 | Recurso ou rota não existe |
| `VALIDATION_ERROR` | 400 | Body/query inválido |
| `AI_ERROR` | 502 | Falha ao chamar a IA |
| `INTERNAL_ERROR` | 500 | Erro inesperado |

---

## 5. MCP — Conectar no Claude Desktop

Edite `claude_desktop_config.json`:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "xplo-starter": {
      "url": "https://fsfspsydntutwftdihih.supabase.co/functions/v1/mcp",
      "transport": { "type": "http" },
      "headers": { "Authorization": "Bearer xplo_sk_SUA_CHAVE_AQUI" }
    }
  }
}
```

Reinicie o Claude. Você verá tools como `list_deals`, `create_activity`, `generate_icps` disponíveis.

### Cursor
Em `~/.cursor/mcp.json` adicione o mesmo bloco.

### Tools MCP disponíveis
`list_deals`, `get_deal`, `create_deal`, `move_deal`, `list_activities`, `create_activity`, `complete_activity`, `list_clients`, `get_client_onboarding`, `start_onboarding`, `generate_icps`, `generate_promise`, `generate_offers`, `generate_demand_plan`.

---

## 6. Boas práticas

- ❌ **Nunca** commit a chave em código público ou frontend
- ✅ Use em backend, n8n, scripts, MCP clients
- ✅ Crie **uma chave por integração** (facilita revogar)
- ✅ Revogue imediatamente se suspeitar de vazamento
- ✅ Auditoria: `last_used_at` mostra quando a chave foi usada por último
- ⚠️ Os endpoints de IA podem demorar de 5 a 60s — configure timeout adequado no n8n/Make

---

## 7. Suporte

Dúvidas: contate o admin da sua instância (login `xplolabcreator@gmail.com`).
