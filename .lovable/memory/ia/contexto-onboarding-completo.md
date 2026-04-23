---
name: Contexto Onboarding Completo
description: Helper buildOnboardingContext injeta TODOS os dados das 7 etapas do onboarding nos prompts de IA (ICP, Ofertas, Plano de Demanda, Anúncios)
type: feature
---

Os 4 geradores estratégicos (ICP, Banco de Ofertas, Plano de Demanda, Anúncios) recebem um bloco único e padronizado de contexto chamado `[CONTEXTO COMPLETO DO ONBOARDING]`, montado pelo helper `buildOnboardingContext(supabase, clientId)` em `supabase/functions/generate-content/index.ts`.

**Princípio**: passe TUDO o que o cliente preencheu nas 7 etapas; a IA é instruída a ignorar campos vazios (`—`). Isso elimina documentos genéricos quando o onboarding está rico.

**Blocos sempre injetados**:
- `[DORES E DESEJOS DO NEGÓCIO — VOZ DO DONO]`: `main_pain`, `secondary_pain`, `daily_impacts`, `desire_1`, `desire_2`
- `[CONTEXTO FINANCEIRO E COMERCIAL]`: `current_revenue`, `revenue_goal`, `monthly_investment`, `initial_traffic_investment`, `sales_model`, `sales_team_size`, `promotions`, `demand_channels`
- `[DIFERENCIAIS E BENEFÍCIOS]`: `differentiators`, `benefits`
- `[CONCORRENTES E REFERÊNCIAS]`: `local_competitor_1/2`, `inspiration_company_1/2`
- `[SWOT — VISÃO GERAL]`: 4 quadrantes (tags + texto)
- `[PROMESSA HORMOZI VALIDADA]`: `client_promise.promise_text`

**Para Anúncios**: o helper substitui o antigo `bp` curto (3 linhas vindo do `pppData`) por contexto completo + ICP combinado. `pppData` continua aceito no payload mas o banco prevalece. O `sys` foi atualizado para mencionar acesso ao perfil completo.

**Modelo**: continua GPT-5.2 via `STRATEGIC_TASKS`. Nenhuma migration nova. Substitui em uso o helper `mem://arquitetura/contexto-geracao-anuncios` (mantido como referência histórica).
