

# Atualização da Geração de Promessa com Metodologia Hormozi

## Resumo

Aprimorar a geração de promessa por IA para seguir a metodologia Alex Hormozi, considerando dores E desejos do público. A promessa deve ser uma fórmula clara de transformação.

---

## Metodologia Alex Hormozi para Promessa

Uma promessa Hormozi segue a estrutura:

**"Ajudo [QUEM] a conseguir [RESULTADO DESEJADO] em [PRAZO] sem [MAIOR OBJEÇÃO/DOR]"**

Elementos da promessa irresistível:
1. **Dream Outcome**: O desejo mais profundo do cliente (não o que ele acha que precisa, mas o que ele QUER)
2. **Perceived Likelihood**: Por que é provável que funcione para ele
3. **Time Delay**: Em quanto tempo verá resultados
4. **Effort & Sacrifice**: O que ele NÃO precisa fazer/sofrer

---

## Alteração no Edge Function

### Arquivo: `supabase/functions/generate-content/index.ts`

Atualizar o case `generate-promise` para:

1. Incluir os **desejos** do ICP no contexto
2. Usar a **fórmula Hormozi** no prompt
3. Gerar uma promessa que conecte DORES → DESEJOS → TRANSFORMAÇÃO

### Novo Prompt

```
## METODOLOGIA ALEX HORMOZI - VALUE EQUATION

Uma promessa irresistível maximiza:
(Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort Required)

## DORES E DESEJOS DO PÚBLICO

**Dor Principal:** [main_pain]
**Dor Secundária:** [secondary_pain]
**Impactos no dia a dia:** [daily_impacts]

**Desejo 1:** [desire_1]
**Desejo 2:** [desire_2]

## INSTRUÇÕES

Crie uma promessa que:
1. Transforme a DOR PRINCIPAL em DESEJO REALIZADO
2. Minimize objeções (tempo, esforço, risco)
3. Seja específica e mensurável quando possível
4. Use a fórmula: "[QUEM] consegue [DESEJO] em [PRAZO] sem [DOR/OBJEÇÃO]"

Exemplos de promessas Hormozi:
- "Donos de academia lotam suas unidades em 90 dias sem depender de indicações"
- "Dentistas fecham 10 tratamentos de alto valor por semana sem precisar baixar preço"
- "Infoprodutores faturam R$ 100k/mês sem aparecer nas redes sociais"
```

---

## Dados que Serão Usados

A geração usará:

| Dado | Fonte |
|------|-------|
| Nicho | `clients.niche` |
| Produto | `client_profile.product_name` |
| Diferenciais | `client_profile.differentiators` |
| ICPs | `icps` (nome, profissão, idade) |
| Dor Principal | `icp_pains.main_pain` |
| Dor Secundária | `icp_pains.secondary_pain` (novo) |
| Impactos | `icp_pains.daily_impacts` |
| Desejo 1 | `icp_pains.desire_1` (novo) |
| Desejo 2 | `icp_pains.desire_2` (novo) |

---

## StepPromise.tsx - Atualização

O componente já está implementado para chamar a IA. Precisamos atualizar a chamada para incluir os novos campos de dores e desejos:

```typescript
// Atualizar a query de pains para incluir os novos campos
const painsRes = await supabase
  .from("icp_pains")
  .select("*, icps(name)")
  .eq("icps.client_id", clientId);
```

A estrutura da query já busca todos os campos, então quando a migração adicionar `desire_1`, `desire_2` e `secondary_pain`, eles serão automaticamente incluídos.

---

## Checklist de Implementação

| # | Item | Descrição |
|---|------|-----------|
| 1 | Edge Function | Atualizar prompt do `generate-promise` com metodologia Hormozi |
| 2 | Edge Function | Incluir desejos e dor secundária no contexto |
| 3 | PPPData Interface | Adicionar campos `desire_1`, `desire_2`, `secondary_pain` |

---

## Resultado Esperado

A promessa gerada por IA seguirá a fórmula Hormozi:

**ANTES**: "Ajudo empresas a crescerem no digital"

**DEPOIS**: "Donos de academia conseguem lotar suas turmas em 60 dias sem depender de indicações boca-a-boca, usando um sistema de anúncios que funciona no automático"

A promessa será:
- Específica para o ICP
- Baseada nos desejos reais do público
- Resolve a dor principal
- Minimiza objeções de tempo/esforço

