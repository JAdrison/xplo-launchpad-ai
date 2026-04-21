

# Refatoração Completa do Onboarding — Multi-Nicho v2 (Parte 1)

## Visão Geral

Refatoração total do wizard de onboarding atual (7 etapas B2B genéricas) em uma estrutura **multi-nicho** com **6 etapas + Etapa 0 de seleção de nicho**, suportando 3 fluxos: **Hospedagem**, **Saúde** e **Genérico**. SWOT substitui Dores/Desejos. Promessa de Valor é **removida**. ICP vira 3 blocos manuais (geração IA fica para Parte 2).

## Estrutura final do wizard

```text
Etapa 0 — Seleção de Nicho (cards: Hospedagem | Saúde | Outro)
Etapa 1 — Cadastro Inicial (comum, com card de estimativa de leads)
Etapa 2 — Sobre o Negócio (3 versões: 2A Hospedagem / 2B Saúde / 2C Genérico)
Etapa 3 — SWOT "O que é bom e o que pode melhorar" (4 quadrantes + IA)
Etapa 4 — Como Você Vende Hoje (3 versões + concorrentes + acessos LGPD)
Etapa 5 — Quem é Seu Cliente (3 blocos manuais sequenciais)
Etapa 6 — Revisão Final
```

## Mudanças no Banco de Dados

### Nova migration

**1. Tabela `clients`** — adicionar colunas:
- `niche_type` enum (`hospedagem` | `saude` | `generico`)
- `niche_label` text (rótulo livre, ex: "Pousada", "Odontologia", "Pet Shop")

**2. Tabela `client_profile`** — adicionar coluna:
- `profile_data` jsonb (armazena os campos variáveis da Etapa 2 por nicho)
- `whatsapp_number` text
- `google_my_business` text (apenas Saúde)

**3. Nova tabela `client_swot`**:
```text
id, client_id, 
forcas_internas_tags[], forcas_internas_text,
fraquezas_internas_tags[], fraquezas_internas_text,
forcas_ambiente_tags[], forcas_ambiente_text,
fraquezas_ambiente_tags[], fraquezas_ambiente_text,
generated_by_ai bool, created_at, updated_at
```

**4. Tabela `client_profile`** — adicionar campos da Etapa 4 variáveis:
- `market_data` jsonb (taxa ocupação, canais, dificuldades, metas — varia por nicho)

**5. Nova tabela `client_icp`**:
```text
id, client_id,
bloco1_data jsonb, bloco2_data jsonb, bloco3_data jsonb,
generated_icp_text text NULL, generated_by_ai bool default false,
generated_at timestamp NULL
```

> Tabelas `icps`, `icp_pains`, `client_promise` ficam inativas (não removidas para compatibilidade com históricos).

> RLS público mantido seguindo padrão atual.

## Mudanças no Código

### Novos arquivos

| Arquivo | Função |
|---|---|
| `src/components/onboarding/StepNicheSelection.tsx` | Etapa 0 — cards grandes de seleção de nicho |
| `src/components/onboarding/steps/StepRegistration.tsx` | Etapa 1 (cadastro + financeiro + estimativa leads) |
| `src/components/onboarding/steps/business/StepBusinessHospedagem.tsx` | Etapa 2A |
| `src/components/onboarding/steps/business/StepBusinessSaude.tsx` | Etapa 2B |
| `src/components/onboarding/steps/business/StepBusinessGenerico.tsx` | Etapa 2C |
| `src/components/onboarding/steps/StepSWOT.tsx` | Etapa 3 — 4 quadrantes + botão IA |
| `src/components/onboarding/steps/market/StepMarketHospedagem.tsx` | Etapa 4A |
| `src/components/onboarding/steps/market/StepMarketSaude.tsx` | Etapa 4B |
| `src/components/onboarding/steps/market/StepMarketGenerico.tsx` | Etapa 4C |
| `src/components/onboarding/steps/StepClientProfile.tsx` | Etapa 5 — wrapper dos 3 blocos sequenciais |
| `src/components/onboarding/steps/icp-blocks/Block1Current.tsx` | Bloco 1 — quem você atende hoje |
| `src/components/onboarding/steps/icp-blocks/Block2Desired.tsx` | Bloco 2 — cliente dos sonhos |
| `src/components/onboarding/steps/icp-blocks/Block3Avoid.tsx` | Bloco 3 — quem não funciona |
| `src/components/onboarding/steps/StepReviewV2.tsx` | Etapa 6 — revisão sem promessa |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/components/onboarding/OnboardingWizard.tsx` | Reescrever lógica para Etapa 0 + 6 etapas, render condicional por `niche_type`, novos labels do progresso |
| `src/pages/Onboarding.tsx` | Sem mudança (continua roteando por `?client=`) |
| `src/pages/OnboardingExternal.tsx` | Garantir compatibilidade com nova Etapa 0 e novos status |
| `src/components/client/OnboardingX1Section.tsx` | Atualizar lógica de checkpoints para 6 etapas (remover "Promessa", trocar "Dores" → "SWOT") |
| `supabase/functions/generate-content/index.ts` | Adicionar handler `type: "generate-swot"` recebendo `niche` |
| `src/lib/utils.ts` | Adicionar máscara de moeda específica se necessário |

### Arquivos legacy (manter mas não usar)

- `StepCompany.tsx`, `StepProduct.tsx`, `StepPains.tsx`, `StepMarket.tsx`, `StepPromise.tsx`, `StepICPs.tsx`, `StepReview.tsx` — manter por enquanto para evitar quebrar histórico, mas remover do wizard.

## Detalhes Importantes

### Etapa 0 — Seleção de Nicho
- 3 cards grandes com ícone (Hotel/Stethoscope/Building)
- "Outro" abre input para nicho customizado
- Salva `niche_type` + `niche_label` em `clients`
- Tela de confirmação antes de seguir

### Etapa 1 — Cadastro
- Usa estrutura atual de `StepCompany` + parte financeira do `StepMarket`
- Faturamento: select com 6 faixas novas (até R$5k até +R$100k)
- Investimento inicial em tráfego: botões R$500/R$1k/R$1.5k/R$2k/R$3k/Outro
- Card de estimativa de leads: `min = R$ ÷ 15`, `max = R$ ÷ 7`

### Etapa 2 — Render condicional
```text
{niche_type === 'hospedagem' && <StepBusinessHospedagem />}
{niche_type === 'saude'      && <StepBusinessSaude />}
{niche_type === 'generico'   && <StepBusinessGenerico />}
```
- Cada versão grava em `client_profile.profile_data` (jsonb) com chaves específicas do nicho
- Campos comuns como `differentiators`, `average_ticket` continuam em colunas dedicadas

### Etapa 3 — SWOT
- Grid 2×2: 🟢 Forças Internas | 🔴 Fraquezas Internas | 🔵 Forças Ambiente | 🟡 Fraquezas Ambiente
- Cada quadrante: multi-tags (até 5) + textarea
- Botão "Gerar com IA" → chama edge function `generate-content` com `type: "generate-swot"` + `niche`
- Após geração, campos editáveis com botão lápis ✏️ (padrão atual de `StepPains`)
- Mín. 1 item por quadrante para avançar

### Etapa 4 — Mercado
- Render condicional por `niche_type`
- Concorrentes (2 locais + 1 referência) — comum
- Acessos Meta Ads — comum, com toggle 👁️ para senhas (LGPD)
- WhatsApp Business com máscara `(00) 00000-0000`
- Apenas Saúde: campo "Google Meu Negócio cadastrado?" (radio Sim/Não/Não sei)

### Etapa 5 — ICP Manual (3 blocos)
- Componente wrapper com sub-stepper interno (Bloco 1/2/3)
- Indicador "Bloco X de 3"
- Botão "Próximo" valida obrigatórios antes de liberar
- Nomenclatura adapta-se: "hóspede" / "paciente" / "cliente" via prop derivada de `niche_type`
- Bloco 1 e 2 perguntam "filhos pequenos?" apenas se Hospedagem
- Card final no Bloco 3: placeholder informando que IA virá na Parte 2

### Etapa 6 — Revisão
- Cards: Cadastro | Sobre o Negócio (renderiza por nicho) | SWOT (grid 2×2) | Mercado (com senhas mascaradas) | Perfil do Cliente (3 blocos)
- Remove card "Promessa de Valor"
- Botão "Concluir Onboarding" → `clients.status = 'ppp_completed'` (mantém status existente para compatibilidade)

## Edge Function — `generate-swot`

Adicionar handler em `supabase/functions/generate-content/index.ts`:
- Input: `clientId`, `niche` (`hospedagem`/`saude`/`generico`), contexto da Etapa 2
- Modelo: GPT-5.2 (Cérebro — análise estratégica)
- Output JSON: `{ forcas_internas: [...], fraquezas_internas: [...], forcas_ambiente: [...], fraquezas_ambiente: [...] }`
- Prompt customizado por nicho (exemplos diferentes para Hospedagem/Saúde/Genérico)

## Compatibilidade e Migração

- Clientes antigos sem `niche_type` → wizard força Etapa 0 antes de prosseguir
- Status mantém valores atuais (`draft`, `ppp_in_progress`, `ppp_completed`, etc.) para não quebrar Generator/Dashboard
- Reset de checkpoints (`OnboardingX1Section`) atualizado para refletir novas 6 etapas
- Onboarding externo (`/o/:token`) suportado em todo o novo fluxo

## Memory updates

Atualizar `mem://fluxo/onboarding-x1-reestruturado-v2` para refletir nova estrutura de 6 etapas + Etapa 0, 3 nichos, SWOT no lugar de Dores/Desejos, Promessa removida.

Criar:
- `mem://fluxo/onboarding-multi-nicho` — explicação dos 3 fluxos paralelos
- `mem://ia/swot-generation` — regras da IA para SWOT por nicho
- `mem://fluxo/icp-3-blocos-manuais` — estrutura dos 3 blocos (placeholder Parte 2)

## Não incluso (Parte 2)

- Geração de ICP via IA com templates por nicho
- Botão "Gerar ICP com IA" no card final do Bloco 3
- Renderização do `generated_icp_text` na revisão

## Ordem de implementação

1. Migration SQL (novas tabelas + colunas)
2. Etapa 0 (seleção de nicho) + reescrever `OnboardingWizard.tsx`
3. Etapa 1 (Cadastro com leads) — reaproveitando partes de `StepCompany`+`StepMarket`
4. Etapas 2A/2B/2C (Sobre o Negócio)
5. Etapa 3 (SWOT) + edge function `generate-swot`
6. Etapas 4A/4B/4C (Mercado + concorrentes + acessos)
7. Etapa 5 (ICP — 3 blocos manuais)
8. Etapa 6 (Revisão final)
9. Atualizar `OnboardingX1Section.tsx` (checkpoints)
10. Atualizar memórias

