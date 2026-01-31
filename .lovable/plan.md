
# Refatoracao Completa do Onboarding X1 e Gerador IA

## Resumo das Mudancas Solicitadas

1. **Oferta baseada em 1 ICP**: Adicionar selecao de ICP especifico para gerar ofertas
2. **Anuncios criados a partir de oferta**: Anuncios devem usar dados da oferta, nao do PPP
3. **Etapa 6 opcional no onboarding**: Gerar oferta ao final (nao obrigatorio)
4. **Oportunidades de geracao de demanda**: Adicionar secao com canais de aquisicao na oferta
5. **Renomear para Onboarding X1**: Substituir "Onboarding PPP" em todos os locais
6. **Explicar PPP no inicio**: Publico, Problema, Promessa - comunicacao no inicio do wizard

---

## Parte 1: Renomear Onboarding PPP para Onboarding X1

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/layout/AppSidebar.tsx` | Alterar nome do menu |
| `src/pages/Onboarding.tsx` | Alterar titulos e textos |
| `src/components/onboarding/OnboardingDashboard.tsx` | Alterar titulos e textos |
| `src/components/client/OnboardingPPPSection.tsx` | Renomear componente e textos |
| `src/pages/ClientDetails.tsx` | Atualizar import do componente |
| `src/pages/Generator.tsx` | Atualizar referencias |
| `src/pages/Assets.tsx` | Atualizar referencias |

---

## Parte 2: Adicionar Comunicacao PPP no Inicio do Onboarding

No inicio do wizard (antes da etapa 1 ou como introducao), adicionar:

```text
+----------------------------------------------------------+
|  Onboarding X1                                            |
|  [Cliente: XPLO Solar]                                    |
|----------------------------------------------------------|
|                                                           |
|  +-----------------------------------------------------+  |
|  |  O que e o PPP?                                     |  |
|  |-----------------------------------------------------|  |
|  |  O PPP e a metodologia que usamos para entender     |  |
|  |  profundamente seu negocio:                         |  |
|  |                                                      |  |
|  |  P - PUBLICO: Quem sao seus clientes ideais (ICPs)  |  |
|  |  P - PROBLEMA: Quais dores eles enfrentam           |  |
|  |  P - PROMESSA: O que voce promete resolver          |  |
|  |                                                      |  |
|  |  Essas informacoes serao usadas para gerar          |  |
|  |  ofertas, landing pages e anuncios personalizados.  |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  [Iniciar]                                                |
+----------------------------------------------------------+
```

---

## Parte 3: Adicionar Etapa 6 Opcional - Geracao de Oferta

Modificar o wizard para ter 6 etapas:

| Etapa | Nome | Descricao |
|-------|------|-----------|
| 1 | Produto | Descreva seu produto/servico |
| 2 | ICPs (Publico) | Defina seus clientes ideais |
| 3 | Dores (Problema) | Mapeie as dores de cada ICP |
| 4 | Promessa | Crie sua promessa principal |
| 5 | Revisao | Revise e finalize |
| 6 | Gerar Oferta (opcional) | Gere ofertas com IA para seus ICPs |

Na etapa 5, o botao sera "Concluir" ou "Concluir e Gerar Oferta".
Na etapa 6, o usuario pode selecionar um ICP e gerar a oferta.

---

## Parte 4: Oferta Baseada em 1 ICP + Oportunidades de Demanda

### Alteracoes no Gerador

1. Apos selecionar cliente, mostrar dropdown de ICPs
2. Usuario escolhe 1 ICP especifico para a oferta
3. A geracao usa apenas os dados daquele ICP

### Novo Campo na Oferta: Oportunidades de Geracao de Demanda

Adicionar secao com checkboxes para canais:

```text
+----------------------------------------------------------+
|  Oportunidades de Geracao de Demanda                      |
|----------------------------------------------------------|
|  Selecione os canais relevantes para sua estrategia:     |
|                                                           |
|  [ ] Trafego Pago - TikTok Ads                           |
|  [ ] Trafego Pago - Google Ads                           |
|  [ ] Trafego Pago - Meta Ads (Facebook/Instagram)        |
|  [ ] Programa de Indicacao                               |
|  [ ] Parceria com Influenciadores                        |
|  [ ] Outbound (Prospecao ativa)                          |
|  [ ] Marketing de Conteudo                               |
|  [ ] Email Marketing                                     |
|                                                           |
|  A IA vai sugerir estrategias baseadas no seu nicho      |
|  e nas informacoes do onboarding.                        |
+----------------------------------------------------------+
```

A IA gerara estrategias personalizadas para cada canal selecionado.

### Alteracoes no Banco de Dados

Adicionar nova coluna na tabela `offers_hormozi`:
- `icp_id` (uuid): Referencia ao ICP usado na geracao
- `demand_generation_channels` (text[]): Canais selecionados
- `demand_generation_strategies` (jsonb): Estrategias geradas pela IA

---

## Parte 5: Anuncios Criados a partir de Oferta

### Fluxo Atual (Errado)
```
PPP Data -> generate-content(ads) -> ads
```

### Novo Fluxo (Correto)
```
PPP Data -> generate-content(offer) -> offers_hormozi
                                              |
                                              v
                    Oferta selecionada -> generate-content(ads) -> ads
```

### Alteracoes no Gerador

1. Para gerar anuncios, primeiro deve existir uma oferta
2. Usuario seleciona qual oferta usar como base
3. A geracao de ads usa dados da oferta (nao do PPP)

---

## Arquivos a Criar/Modificar

### Criar
| Arquivo | Descricao |
|---------|-----------|
| `src/components/onboarding/PPPIntroCard.tsx` | Card explicando PPP no inicio |
| `src/components/onboarding/StepGenerateOffer.tsx` | Etapa 6 do wizard |

### Modificar
| Arquivo | Acao |
|---------|------|
| `src/pages/Onboarding.tsx` | Adicionar etapa 6, intro PPP, renomear textos |
| `src/pages/Generator.tsx` | Adicionar selecao de ICP, vincular ads a oferta |
| `supabase/functions/generate-content/index.ts` | Alterar logica para ICP unico e demanda |
| `src/components/generator/GeneratedContentViewer.tsx` | Mostrar oportunidades de demanda |
| `src/components/client/OnboardingPPPSection.tsx` | Renomear para OnboardingX1Section |
| `src/components/onboarding/OnboardingDashboard.tsx` | Renomear textos |
| `src/components/layout/AppSidebar.tsx` | Renomear menu |

### Migracoes de Banco de Dados
```sql
-- Adicionar colunas na tabela offers_hormozi
ALTER TABLE offers_hormozi ADD COLUMN icp_id uuid REFERENCES icps(id);
ALTER TABLE offers_hormozi ADD COLUMN demand_generation_channels text[];
ALTER TABLE offers_hormozi ADD COLUMN demand_generation_strategies jsonb;

-- Adicionar referencia a oferta na tabela ads
ALTER TABLE ads ADD COLUMN offer_id uuid REFERENCES offers_hormozi(id);
```

---

## Interface do Gerador Atualizada

```text
+----------------------------------------------------------+
|  Gerador IA                                               |
|----------------------------------------------------------|
|                                                           |
|  1. Selecione um cliente:                                |
|  [Dropdown: XPLO Solar]                                  |
|                                                           |
|  2. Selecione um ICP:                                    |
|  [Dropdown: Empresas de energia renovavel]               |
|                                                           |
|  3. O que deseja gerar?                                  |
|                                                           |
|  [x] Oferta Hormozi                                      |
|      -> Inclui selecao de canais de demanda              |
|                                                           |
|  [ ] Landing Page                                        |
|      -> Baseada na oferta selecionada                    |
|                                                           |
|  [ ] Anuncios                                            |
|      -> Requer uma oferta existente                      |
|      [Dropdown: Selecione a oferta]                      |
|                                                           |
|  Canais de Geracao de Demanda:                           |
|  [x] Meta Ads  [x] TikTok Ads  [ ] Google Ads            |
|  [ ] Indicacao  [ ] Influenciadores  [x] Outbound        |
|                                                           |
|  [Gerar com IA]                                          |
|                                                           |
+----------------------------------------------------------+
```

---

## Etapas de Implementacao

1. **Migracao do banco**: Adicionar novas colunas
2. **Renomear textos**: PPP -> X1 em todos os arquivos
3. **Intro PPP**: Criar card explicativo
4. **Etapa 6**: Adicionar geracao opcional no wizard
5. **Selecao de ICP**: Modificar gerador para filtrar por ICP
6. **Canais de demanda**: Adicionar selecao e geracao
7. **Vincular ads a oferta**: Modificar fluxo de geracao

---

## Beneficios

- Ofertas mais direcionadas para cada publico (1 ICP)
- Anuncios coerentes com a oferta criada
- Estrategias de demanda personalizadas
- Fluxo mais claro com explicacao do PPP
- Opcao de gerar oferta direto no onboarding
- Nomenclatura consistente (Onboarding X1)
