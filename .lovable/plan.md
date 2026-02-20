
# Expandir o Plano de Geracao de Demanda

## Problema Atual

O plano de demanda esta simples porque:
1. O prompt enviado para a IA e muito curto e vago (apenas 1 linha)
2. A tela so mostra 3 das 6 secoes possiveis (faltam estrategias complementares, funil de aquisicao e sinergias)
3. O JSON de exemplo no prompt nao detalha os campos necessarios

## Alteracoes

### 1. Edge Function - Prompt mais detalhado (`supabase/functions/generate-content/index.ts`)

Expandir o prompt do tipo "offer" (linha 288-290) para incluir instrucoes detalhadas sobre o plano de demanda:

- **System prompt**: Adicionar que a IA e uma estrategista de geracao de demanda especialista em Facebook/Meta Ads
- **Demand plan JSON schema**: Expandir com todos os campos completos:
  - `context_analysis`: nicho, perfil ICP detalhado, insight principal, desafios do mercado
  - `primary_strategy`: canal, tipo campanha, publicos detalhados (com nome, geo, fonte, exclusoes), tipos criativos, budget %, CPL esperado, KPIs
  - `complementary_strategies`: 2-3 canais complementares com papel, integracao e budget
  - `acquisition_funnel`: TOFU, MOFU, BOFU com objetivo, canais, mensagem e metricas
  - `channel_synergies`: 3-5 sinergias entre canais
  - `implementation_timeline`: detalhamento por semana com acoes especificas
- Instruir a IA a gerar textos longos e detalhados em cada campo (minimo 2-3 frases por campo)

### 2. Exibicao no Frontend (`src/components/client/GeneratedAssetsSection.tsx`)

Adicionar as secoes que estao faltando na visualizacao do plano, entre a Estrategia Principal e o Cronograma:

- **Tipos de Criativos**: badges com os tipos de criativo sugeridos
- **Estrategias Complementares**: cards para cada canal complementar com papel, integracao e budget
- **Funil de Aquisicao**: 3 blocos visuais (TOPO, MEIO, FUNDO) com objetivo, canais e mensagem
- **Sinergias entre Canais**: lista de sinergias com icones

### 3. Tratamento robusto de dados de publico

Garantir que o campo `audiences` funcione tanto com strings simples quanto com objetos complexos (evitar o erro React #31 que ja corrigimos parcialmente).

---

## Secao Tecnica

### Prompt expandido (edge function linha ~288-290)

O prompt atual:
```
sys = 'Estrategista Hormozi + Facebook Ads.';
prompt = `${ctx}\nCrie oferta com 2 opcoes cada campo + plano demanda.\nJSON: {"options":{...},"demand_plan":{"primary_strategy":{"channel":"Facebook Ads","audiences":[]},...}}`;
```

Sera expandido para ~30 linhas com instrucoes detalhadas sobre cada secao do plano de demanda, incluindo o JSON schema completo com todos os campos e exemplos.

### Novas secoes no frontend (GeneratedAssetsSection.tsx)

Adicionar entre a linha 582 (fim da Estrategia Principal) e 585 (Cronograma):
- Secao de creative_types com badges
- Secao de complementary_strategies com cards
- Secao de acquisition_funnel com 3 blocos TOFU/MOFU/BOFU
- Secao de channel_synergies com lista

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/generate-content/index.ts` | Expandir prompt do tipo "offer" com instrucoes detalhadas para o demand plan |
| `src/components/client/GeneratedAssetsSection.tsx` | Adicionar secoes de estrategias complementares, funil, sinergias e criativos |
