## Redesign do Dashboard — "Command Center" XPLO

Transformar o Dashboard atual (4 cards simples + lista de clientes) em um painel estilo Command Center inspirado na referência, mas adaptado ao domínio real do XPLO Starter (marketing/onboarding + CRM) e mantendo o **light mode** com acentos roxo (#8B5CF6).

### Layout proposto

```text
┌─────────────────────────────────────────────────────────────┐
│  Command Center                         [Novo Cliente] [+]  │
│  Visão geral do seu workspace em tempo real                 │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ KPI 1    │ KPI 2    │ KPI 3    │ KPI 4    │  ← 4 cards      │
│ Clientes │ Em       │ Ofertas  │ Anúncios │    com ícone    │
│ Ativos   │ Onboard. │ Geradas  │ Gerados  │    + delta vs   │
│          │          │          │          │    mês anterior │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│ Evolução do Portfólio (area chart, 6 meses) │ Status dos    │
│ Novos clientes por mês                      │ Onboardings   │
│                                             │ (donut)       │
│                                             │ Rascunho/     │
│                                             │ Em andamento/ │
│                                             │ Concluído/    │
│                                             │ Ativos        │
├─────────────────────────────────────────────┼───────────────┤
│ Funil CRM — Pipeline de Vendas              │ Insights IA   │
│ (barras horizontais com gradiente roxo      │ (3 cards      │
│  por coluna do pipeline principal)          │  estáticos    │
│                                             │  com regras)  │
└─────────────────────────────────────────────┴───────────────┘
```

### Métricas (todas com dados reais do Supabase)

**KPIs (4 cards grandes com delta vs mês passado)**
1. **Clientes Ativos** — `count(clients) where status != 'archived'`
2. **Em Onboarding** — `count(clients) where status in ('draft','ppp_in_progress')`
3. **Ofertas Geradas** — `count(client_offer_documents)` + contexto "este mês"
4. **Anúncios Gerados** — `count(ads)` + contexto "este mês"

Cada card: ícone à direita, valor grande, label em cima, rodapé com `↑ +X% vs. mês anterior` (verde se +, vermelho se −). Acento roxo suave no card hover, sem o glow pesado do dark theme.

**Evolução do Portfólio** (area chart Recharts)
- Novos clientes criados por mês nos últimos 6 meses
- Gradiente roxo (#8B5CF6 → transparente), linha sólida primária

**Status dos Onboardings** (donut chart)
- Distribuição atual por `clients.status`: Rascunho, Em PPP, PPP Concluído, Oferta Gerada, Ativos Gerados
- Paleta: tons de roxo + cinza para arquivados

**Funil CRM** (barras horizontais)
- Quantidade de deals por coluna da pipeline principal (`pipelines` + `pipeline_columns` + `deals`)
- Gradiente roxo → ciano nas barras (mantendo acento roxo dominante)
- Se não houver pipeline, mostra CTA "Configurar CRM"

**Insights IA** (3 cards estáticos, baseados em regras)
Cada card com ícone + título + descrição + CTA. Regras simples executadas no client após fetch:
- "X clientes sem progresso há 7+ dias" → lista `clients` com `updated_at < now() - 7d` e status draft/ppp_in_progress
- "Y onboardings prontos para gerar ofertas" → clientes com `ppp_completed` sem offer documents
- "Z clientes sem anúncios gerados" → clientes com ofertas mas sem ads
Cada card linka para `/clients` filtrado ou `/generator`.

### Design (light mode)

- Fundo: branco / `bg-background`
- Cards: `bg-card` com borda sutil `border-border`, shadow muito leve, hover com shadow roxa translúcida
- Acentos: `#8B5CF6` para valores grandes, ícones e gráficos
- Headline "Command Center" em roxo bold, subtítulo em muted
- Ações rápidas movidas para um botão de ação no header (não mais uma seção inteira)
- Lista de "Últimos Clientes" removida do dashboard (já vive em `/clients`) — substituída pelos Insights IA, que são mais úteis

### Arquivos a alterar

- `src/pages/Dashboard.tsx` — reescrever por completo
- Novos componentes em `src/components/dashboard/`:
  - `KpiCard.tsx` — card com valor + delta
  - `PortfolioEvolutionChart.tsx` — area chart
  - `OnboardingStatusDonut.tsx` — donut chart
  - `CrmFunnelChart.tsx` — barras horizontais do pipeline
  - `InsightsPanel.tsx` — 3 cards de insights baseados em regras
- Usar `recharts` (já instalado) e componentes de `ui/chart.tsx`

### Queries adicionais necessárias

- Histórico de `clients.created_at` agrupado por mês (últimos 6 meses) — query client-side ou RPC simples
- Agregação de deals por `column_id` + join com `pipeline_columns` do pipeline padrão

### Fora do escopo

- Sem migrations de schema (todos os dados já existem)
- Sem dark mode
- Sem chamadas de IA em tempo real (Insights são estáticos/regra)
- Não mexe em `/crm`, `/clients` nem outras rotas

### Memória

- Atualizar `mem://funcionalidades/dashboard-dinamico` descrevendo o novo layout Command Center e suas seções.