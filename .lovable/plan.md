

# Corrigir PDF da Oferta e Expandir Estrategia de Publicos

## Problemas Identificados

### 1. "[object Object]" nos Publicos do PDF
Na linha 347 do `OfferPDFTemplate.tsx`, o codigo faz `audiences.join(", ")` mas os publicos sao objetos com campos `name`, `geo`, `interests`, `filters`, `sources`, `exclusions` -- nao strings simples. Isso gera `[object Object]` no PDF.

### 2. PDF incompleto -- faltam secoes do plano de demanda
O template PDF tem secoes para `context_analysis`, `complementary_strategies`, `channel_synergies` e `implementation_timeline`, mas os dados reais no banco nao possuem esses campos. O que existe e uma estrutura diferente e mais rica:
- `primary_strategy.audiences` com objetos detalhados (interesses, filtros, geo, fontes)
- `acquisition_funnel` com `tofu.creatives`, `tofu.lead_capture`, `tofu.offers`, `mofu.nurture_assets`, `mofu.retargeting_logic`, `mofu.sales_motion`, `bofu.closing_offers`, `bofu.objection_killers`, `bofu.remarketing_assets`

O template espera campos como `tofu.objective`, `tofu.channels`, `tofu.message` mas os dados reais tem campos diferentes.

### 3. Falta detalhe de interesses e publicos na visualizacao

---

## Alteracoes Planejadas

### Arquivo 1: `src/components/export/OfferPDFTemplate.tsx`

**a) Corrigir interfaces `DemandPlan` e `primary_strategy`**
- Atualizar `audiences` de `string[]` para `Array<string | { name?; geo?; interests?; filters?; sources?; exclusions?; source?; message? }>`
- Atualizar interfaces do funil (`tofu`, `mofu`, `bofu`) para refletir os campos reais: `offers`, `creatives`, `lead_capture`, `nurture_assets`, `retargeting_logic`, `sales_motion`, `closing_offers`, `objection_killers`, `remarketing_assets`

**b) Corrigir renderizacao dos publicos (linha ~345-348)**
- Em vez de `.join(", ")`, renderizar cada publico como um bloco com nome, geo, interesses, filtros e exclusoes
- Cada publico vira um mini-card no PDF

**c) Expandir o funil de aquisicao no PDF**
- TOPO: mostrar `objective`, `offers`, `creatives`, `lead_capture` (campos do formulario, destino, regra de qualificacao)
- MEIO: mostrar `objective`, `nurture_assets`, `retargeting_logic`, `sales_motion` (passos)
- FUNDO: mostrar `objective`, `closing_offers`, `objection_killers`, `remarketing_assets`

**d) Remover secoes que nao existem nos dados**
- Remover ou tornar opcionais: `context_analysis`, `complementary_strategies`, `channel_synergies`, `implementation_timeline` (so renderizar se existirem)

### Arquivo 2: `src/components/client/GeneratedAssetsSection.tsx`

**a) Expandir exibicao dos publicos na tela**
- Adicionar campo `interests` (array de interesses) e `filters` na renderizacao de cada publico
- Mostrar tambem `sources` e `message` para publicos de remarketing

**b) Expandir o funil de aquisicao na tela**
- Mesma logica do PDF: mostrar os campos reais (`creatives`, `lead_capture`, `nurture_assets`, `retargeting_logic`, `sales_motion`, `closing_offers`, `objection_killers`)

---

## Secao Tecnica

### Estrutura real dos dados (do banco)

```text
primary_strategy.audiences = [
  { name, geo, source (lista), exclusions (lista) },           // Lookalike
  { name, geo, interests (lista), filters (lista) },           // Interesse
  { name, sources (lista), message }                           // Remarketing
]

acquisition_funnel.tofu = {
  objective, offers (lista), creatives (lista),
  lead_capture: { destination, form_fields, qualification_rule }
}
acquisition_funnel.mofu = {
  objective, nurture_assets (lista), retargeting_logic (lista),
  sales_motion: { step_1, step_2, step_3, step_4 }
}
acquisition_funnel.bofu = {
  objective, closing_offers (lista), objection_killers (lista),
  remarketing_assets (lista)
}
```

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/export/OfferPDFTemplate.tsx` | Corrigir [object Object], expandir publicos com interesses, expandir funil com dados reais |
| `src/components/client/GeneratedAssetsSection.tsx` | Expandir publicos com interesses/filtros, expandir funil com dados reais |

