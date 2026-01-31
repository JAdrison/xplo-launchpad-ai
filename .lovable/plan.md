

# IA Estrategista de Demanda Automatica

## O que vamos mudar

A IA deixara de pedir para o usuario escolher canais de demanda. Em vez disso, ela vai analisar automaticamente o contexto do negocio (nicho, produto, ICP, dores) e recomendar uma estrategia completa e integrada de geracao de demanda.

## Mudancas Principais

### 1. Remover Selecao Manual de Canais

O usuario nao precisara mais escolher checkboxes de canais. A IA vai decidir quais canais sao relevantes baseado no contexto.

### 2. IA Estrategista Inteligente

A IA vai:
- Analisar o nicho do negocio
- Considerar o perfil do ICP (segmento, caracteristicas, situacao atual)
- Entender as dores do publico
- Priorizar Facebook/Meta Ads como canal principal (seu forte)
- Sugerir estrategias combinadas e sinergicas

### 3. Plano de Demanda Integrado

Em vez de estrategias isoladas por canal, a IA vai criar:
- Estrategia Principal (Facebook/Meta Ads)
- Estrategias Complementares integradas
- Funil de aquisicao com etapas
- Sinergias entre canais (ex: conteudo que alimenta remarketing)
- Cronograma sugerido de implementacao
- Orcamento relativo sugerido por canal

---

## Nova Estrutura da Oferta

```text
OFERTA HORMOZI COMPLETA
|
+-- Promessa Principal
+-- Mecanismo Unico
+-- Garantia
+-- Prova Social
+-- Reversao de Risco
+-- Pilha de Valor
+-- CTA Principal
|
+-- PLANO DE GERACAO DE DEMANDA (NOVO - AUTOMATICO)
    |
    +-- Analise do Contexto
    |   - Nicho identificado
    |   - Perfil do ICP
    |   - Canais recomendados
    |
    +-- Estrategia Principal: Facebook/Meta Ads
    |   - Tipo de campanha
    |   - Publicos sugeridos
    |   - Criativos recomendados
    |   - Orcamento relativo
    |
    +-- Estrategias Complementares
    |   - Canal 1 + como integra com principal
    |   - Canal 2 + como integra com principal
    |
    +-- Funil de Aquisicao
    |   - Topo: como atrair
    |   - Meio: como engajar
    |   - Fundo: como converter
    |
    +-- Sinergias entre Canais
    |   - Como um canal alimenta outro
    |   - Sequencias recomendadas
    |
    +-- Cronograma de Implementacao
        - Semana 1-2: ...
        - Semana 3-4: ...
```

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/Generator.tsx` | Remover selecao de canais, simplificar interface |
| `src/components/onboarding/StepGenerateOffer.tsx` | Remover selecao de canais |
| `supabase/functions/generate-content/index.ts` | Novo prompt estrategico para IA |
| `src/components/generator/GeneratedContentViewer.tsx` | Exibir novo formato de plano de demanda |

---

## Detalhamento Tecnico

### Novo Prompt da IA (Edge Function)

O prompt sera completamente reformulado para:

```text
Voce e um estrategista de marketing digital especializado em aquisicao de clientes 
via trafego pago, especialmente Facebook/Meta Ads.

Analise o contexto do negocio:
- Nicho: [nicho do cliente]
- Produto: [descricao do produto]
- ICP: [nome, segmento, caracteristicas, situacao atual]
- Dores: [principais dores do ICP]
- Promessa: [promessa principal]

Crie um PLANO ESTRATEGICO DE GERACAO DE DEMANDA completo que:

1. PRIORIZE Facebook/Meta Ads como canal principal (este e nosso forte)

2. Identifique 2-3 canais complementares que fazem sentido para este negocio

3. Mostre como os canais se integram e se alimentam mutuamente

4. Crie um funil de aquisicao completo (TOFU, MOFU, BOFU)

5. Sugira um cronograma de implementacao realista

6. De estimativas de orcamento relativo por canal (ex: 60% Meta, 20% Google, etc)

A estrategia deve ser PRATICA e ACIONAVEL, nao generica.
```

### Novo Formato JSON da Resposta

```json
{
  "promise": "...",
  "unique_mechanism": "...",
  "guarantee": "...",
  "proof": "...",
  "risk_reversal": "...",
  "value_stack": [...],
  "main_cta": "...",
  "demand_plan": {
    "context_analysis": {
      "niche": "Energia Solar",
      "icp_profile": "Moradores de apartamento que querem economia",
      "key_insight": "Publico nao pode instalar paineis, busca alternativa simples"
    },
    "primary_strategy": {
      "channel": "Facebook/Meta Ads",
      "campaign_type": "Lead Generation + Conversao",
      "audiences": [
        "Lookalike de clientes atuais",
        "Interesse em sustentabilidade + apartamentos"
      ],
      "creative_types": ["Video curto", "Carrossel de beneficios"],
      "budget_percentage": 60,
      "expected_cpl": "R$15-25"
    },
    "complementary_strategies": [
      {
        "channel": "Google Ads",
        "role": "Captura de demanda existente",
        "integration": "Remarketing para leads nao convertidos do Meta",
        "budget_percentage": 25
      },
      {
        "channel": "Programa de Indicacao",
        "role": "Reducao de CAC pos-primeira conversao",
        "integration": "Oferecer desconto extra para quem indica",
        "budget_percentage": 15
      }
    ],
    "acquisition_funnel": {
      "tofu": {
        "objective": "Awareness",
        "channels": ["Meta Ads - Video Views", "Conteudo organico"],
        "message": "Voce paga demais na conta de energia?"
      },
      "mofu": {
        "objective": "Consideracao",
        "channels": ["Meta Ads - Lead Gen", "Remarketing"],
        "message": "Descubra como economizar 20% sem instalar nada"
      },
      "bofu": {
        "objective": "Conversao",
        "channels": ["WhatsApp", "Call de vendas"],
        "message": "Comece a economizar hoje. Garantia de 30 dias."
      }
    },
    "channel_synergies": [
      "Leads do Meta que nao convertem vao para remarketing no Google",
      "Clientes convertidos entram no programa de indicacao",
      "Conteudo organico e reaproveitado como criativo de ads"
    ],
    "implementation_timeline": {
      "week_1_2": "Setup de campanhas Meta Ads + landing page",
      "week_3_4": "Testes A/B de criativos, lancamento Google",
      "week_5_8": "Otimizacao, lancamento programa indicacao"
    }
  }
}
```

---

## Mudancas na Interface

### Generator.tsx (Simplificado)

Remover toda a secao de selecao de canais. O fluxo sera:

```text
1. Selecione um cliente
2. Selecione um ICP
3. O que deseja gerar?
   [x] Oferta Hormozi (inclui plano de demanda automatico)
   [ ] Landing Page
   [ ] Anuncios

[Gerar com IA]
```

### GeneratedContentViewer.tsx (Novo Design)

Nova secao "Plano de Demanda" com:

```text
+----------------------------------------------------------+
| PLANO DE GERACAO DE DEMANDA                               |
|----------------------------------------------------------|
|                                                           |
| ANALISE DO CONTEXTO                                       |
| Nicho: Energia Solar                                      |
| Insight: Publico nao pode instalar paineis...             |
|                                                           |
| ESTRATEGIA PRINCIPAL: Facebook/Meta Ads (60% do budget)   |
| - Campanha: Lead Generation + Conversao                   |
| - Publicos: Lookalike, Interesse sustentabilidade         |
| - Criativos: Video curto, Carrossel                       |
| - CPL esperado: R$15-25                                   |
|                                                           |
| ESTRATEGIAS COMPLEMENTARES                                |
| +-- Google Ads (25%): Remarketing de leads nao convertidos|
| +-- Indicacao (15%): Desconto para quem indica            |
|                                                           |
| FUNIL DE AQUISICAO                                        |
| TOPO    -> Meta Video Views: "Voce paga demais?"          |
| MEIO    -> Lead Gen + Remarketing: "Economize 20%"        |
| FUNDO   -> WhatsApp/Vendas: "Comece hoje"                 |
|                                                           |
| SINERGIAS                                                 |
| - Leads Meta nao convertidos -> Remarketing Google        |
| - Clientes -> Programa de Indicacao                       |
| - Conteudo organico -> Criativos de ads                   |
|                                                           |
| CRONOGRAMA                                                |
| Semana 1-2: Setup Meta + LP                               |
| Semana 3-4: Testes A/B, Google                            |
| Semana 5-8: Otimizacao, Indicacao                         |
+----------------------------------------------------------+
```

---

## Beneficios

- IA mais inteligente que analisa o contexto automaticamente
- Estrategias integradas e sinergicas (nao isoladas)
- Facebook/Meta Ads sempre priorizado como canal principal
- Usuario nao precisa saber quais canais escolher
- Plano acionavel com cronograma e orcamento
- Funil completo de aquisicao

