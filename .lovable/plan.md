

## Enriquecer geração de IA com TODOS os dados do Onboarding 7 etapas

### Diagnóstico atual — o que cada gerador realmente lê hoje

| Gerador | Onboarding usa | O que está faltando |
|---|---|---|
| **ICP** | ✅ Profile (parcial), SWOT, blocos `client_icp`, mercado (canais + 2 concorrentes) | ❌ **Dores e desejos globais** (`main_pain`, `secondary_pain`, `daily_impacts`, `desire_1`, `desire_2`), **financeiro** (faturamento, meta, investimento), **modelo de venda** (`sales_model`, `sales_team_size`), **promoções**, **inspirações** (`inspiration_company_1/2`), **Promessa Hormozi** (`client_promise`) |
| **Banco de Ofertas** | ✅ Profile, SWOT, ICP combinado, canais de demanda | ❌ Mesmas lacunas: dores/desejos, financeiro completo, **promoções existentes**, modelo de venda, **promessa Hormozi** já validada, inspirações |
| **Plano de Demanda** | ✅ Profile (campos pontuais), `initial_traffic_investment`, ICP, Ofertas | ❌ **SWOT inteiro**, dores/desejos globais, **demais campos financeiros** (`current_revenue`, `monthly_investment`, `revenue_goal`), `sales_model`, `sales_team_size`, `demand_channels`, **concorrentes locais**, **inspirações** (super útil pra benchmark de criativo), promessa Hormozi |
| **Anúncios (16)** | ✅ `bankOfferText`, niche, produto, dor principal, desejo 1, região (via `pppData`) | ❌ **`secondary_pain`, `daily_impacts`, `desire_2`, diferenciais, benefícios, ICP completo (texto), SWOT, promessa Hormozi, concorrentes (pra evitar paridade), inspirações** (pra inspirar estilo) |

Hoje a IA está vendo **menos de 40%** do que o cliente preencheu nas 7 etapas — por isso os documentos parecem genéricos quando o onboarding foi rico.

### O que vamos mudar

**1. Helper único de contexto completo** (`buildOnboardingContext`)

Criar uma função no edge function `generate-content/index.ts` que, dado um `clientId`, retorna **um pacote completo** com TODOS os campos das 7 etapas + tabelas relacionadas:

- `clients`: name, niche_type, niche_label
- `client_profile`: tudo (incluindo `main_pain`, `secondary_pain`, `daily_impacts`, `desire_1`, `desire_2`, `current_revenue`, `monthly_investment`, `initial_traffic_investment`, `revenue_goal`, `sales_model`, `sales_team_size`, `demand_channels`, `promotions`, `differentiators`, `benefits`, `local_competitor_1/2`, `inspiration_company_1/2`, `profile_data`, `market_data`)
- `client_swot`: 4 quadrantes (tags + texto)
- `client_promise`: `promise_text` (Hormozi)
- `client_icp_documents` + legacy `client_icp` (blocos)
- `client_offer_documents` (quando aplicável)

E um `serializeOnboardingContext(pkg, niche)` que devolve um **bloco de texto rotulado** (Markdown leve) pronto pra injetar nos prompts. Cada bloco tem header tipo `[DORES E DESEJOS GLOBAIS]`, `[FINANCEIRO]`, `[MODELO DE VENDA]`, `[CONCORRENTES LOCAIS]`, `[INSPIRAÇÕES]`, `[PROMESSA HORMOZI]` etc, com fallback `—` para vazios (não polui o prompt).

**2. Expandir variáveis nos 3 prompts de documento (ICP, Ofertas, Plano de Demanda)**

Adicionar nos prompts (todas as 9 versões — 3 niches × 3 documentos) novos blocos opcionais ao final do contexto, antes do template de saída:

```
[DORES E DESEJOS DO NEGÓCIO — VOZ DO DONO]
{global_main_pain}
{global_secondary_pain}
{global_daily_impacts}
{global_desire_1}
{global_desire_2}

[CONTEXTO FINANCEIRO E COMERCIAL]
Faturamento atual: {current_revenue}
Meta de faturamento: {revenue_goal}
Investimento mensal em mkt: {monthly_investment}
Investimento inicial em tráfego: {initial_traffic_investment}
Modelo de venda: {sales_model}
Equipe de vendas: {sales_team_size}
Promoções ativas: {promotions}

[CONCORRENTES E REFERÊNCIAS]
Concorrentes locais: {local_competitors}
Inspirações de mercado: {inspirations}

[PROMESSA HORMOZI VALIDADA]
{promise_text}
```

E adicionar uma instrução **discreta** no topo de cada prompt: *"Use TODO o contexto fornecido. Se um campo estiver vazio (—), apenas ignore — não invente."*

**3. Anúncios — passar contexto completo via backend (sem depender de `pppData` do front)**

Hoje o `type === "ads"` depende do `pppData` que o `Generator.tsx` monta no front (incompleto por design). Mudar a branch para:

- Buscar internamente `buildOnboardingContext(clientId)` (mesmo helper).
- Substituir o atual `bp` (3 linhas) por um **bloco rico** com: dores 1+2, impactos diários, desejos 1+2, diferenciais, benefícios, ICP combinado (texto curto extraído de `client_icp_documents`), SWOT (1 linha por quadrante), promessa Hormozi, concorrentes locais (pra IA evitar paridade), inspirações (pra IA pegar tom).
- Manter `pppData` aceito para retrocompatibilidade, mas sempre **mesclar** com o que vem do banco (banco prevalece quando não-vazio).
- Atualizar o `sys` dos anúncios pra mencionar: *"Você tem acesso ao perfil completo do negócio, ICP, SWOT, promessa e referências. Use isso pra personalizar cada anúncio — evite genérico."*

**4. Sem tocar em**: estrutura de saída (16 anúncios, template ICP, formato do banco de ofertas, template do plano de demanda), schemas de tabela, frontend de geração (`Generator.tsx`, `AIGenerationSection.tsx`, `TrafficPlanCard.tsx`), prompts de outras tasks (`offer` legado Hormozi, `generate-icps`, `generate-promise`, `generate-swot`, `create-video-ad`).

### Detalhes técnicos

- **Helpers novos** (todos no `generate-content/index.ts`, mantendo o arquivo único):
  - `buildOnboardingContext(supabase, clientId): Promise<OnboardingPkg>` — uma função, 6 queries paralelas.
  - `serializeOnboardingContext(pkg, niche): string` — texto rotulado.
  - `extractOnboardingVars(pkg): Record<string,string>` — variáveis pra `interpolate`.
- **Reuso**: as branches `generate-icp-document`, `generate-offers-document`, `generate-traffic-plan-document` substituem suas 6 queries individuais por **uma única chamada** ao helper, eliminando duplicação.
- **Anúncios**: branch `type === "ads"` chama o helper e adiciona `[CONTEXTO COMPLETO]\n${serializeOnboardingContext(pkg, niche)}` antes do `oCtx` no `prompt`.
- **Memória nova**: `mem://ia/contexto-onboarding-completo` — documenta o helper, lista todos os campos passados pra IA e o princípio "use tudo, ignore vazios". Atualizar `mem://index.md` na seção Memories. Marcar `mem://arquitetura/contexto-geracao-anuncios` como obsoleta (não remover, só anotar a substituição).
- **Sem migration**: usa só tabelas e colunas que já existem.
- **Sem mudança de modelo**: continua tudo em GPT-5.2 via `STRATEGIC_TASKS`.

### Resultado esperado

Os 4 documentos passam a refletir **fielmente** o que o cliente disse no onboarding — incluindo dores na voz do dono, contexto financeiro real, promoções vigentes, concorrentes a evitar e inspirações de estilo. Documentos ficam mais específicos sem mudar nada na UI.

