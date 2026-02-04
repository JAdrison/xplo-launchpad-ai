

# Atualizacoes Completas do Onboarding X1

## Resumo das 11 Alteracoes

| # | Alteracao | Tipo |
|---|-----------|------|
| 1 | CPF com mascara (000.000.000-00) | Cadastro Cliente |
| 2 | CNPJ com mascara (00.000.000/0000-00) | Cadastro Cliente |
| 3 | Telefone com mascara ((00) 00000-0000) | Cadastro Cliente |
| 4 | Data de preenchimento (hoje) | Cadastro Cliente |
| 5 | PDF Completo com todos os dados | Exportacao |
| 6 | PDF atualiza ao editar onboarding | Exportacao |
| 7 | Modelo de Venda B2B/B2C | Onboarding Wizard |
| 8 | Fazer parte da {empresa} na etapa Empresa | Onboarding Wizard |
| 9 | Meta de Faturamento em R$ | Onboarding Wizard |
| 10 | Olhinho nas senhas Instagram/Facebook | Onboarding Wizard |
| 11 | Secao de Concorrentes (2 locais + 2 inspiracoes) | Onboarding Wizard |

---

## Grupo 1: Campos de Cadastro (1-4)

### Criacao de Funcoes de Mascara

Adicionar ao arquivo `src/lib/utils.ts`:

```text
maskCPF(value)    → 123.456.789-00
maskCNPJ(value)   → 12.345.678/0001-00
maskPhone(value)  → (11) 98765-4321
maskCurrency(value) → R$ 1.500,00
```

### Aplicar Mascaras nos Formularios

| Arquivo | Campos a Atualizar |
|---------|-------------------|
| `src/pages/ClientNew.tsx` | CPF, CNPJ, Telefone + exibir data |
| `src/pages/ClientDetails.tsx` | CPF, CNPJ, Telefone |
| `src/pages/ClientRegister.tsx` | CPF, CNPJ, Telefone + exibir data |

---

## Grupo 2: Onboarding Wizard (7-11)

### 7. Modelo de Venda B2B/B2C

Status: Ja existe no banco (`sales_model` enum). Verificar se `StepProduct.tsx` esta usando corretamente.

### 8. Etapa Empresa com Dados do Cliente

Atualizar `StepCompany.tsx` para exibir/editar dados cadastrais:
- Nome da Empresa (readonly)
- CNPJ (editavel com mascara)
- Responsavel (editavel)
- CPF do Responsavel (editavel com mascara)
- Email (editavel)
- Telefone (editavel com mascara)

### 9. Meta de Faturamento em R$

Atualizar `StepMarket.tsx` para usar mascara de moeda no campo `revenue_goal`.

### 10. Toggle de Visibilidade nas Senhas

Adicionar icones Eye/EyeOff nos campos de senha do Instagram e Facebook em `StepMarket.tsx`.

### 11. Secao de Concorrentes (NOVA)

**Migracao de Banco de Dados necessaria:**
Adicionar 4 novos campos JSONB na tabela `client_profile`:
- `local_competitor_1` (nome + por que e concorrente)
- `local_competitor_2` (nome + por que e concorrente)
- `inspiration_company_1` (nome + por que inspira)
- `inspiration_company_2` (nome + por que inspira)

**Interface no StepMarket.tsx:**
Nova secao "Analise Competitiva" com:

```text
Concorrentes Locais (sua regiao)
┌────────────────────────────────────────────┐
│ Concorrente 1                              │
│ Nome: [________________]                   │
│ Por que e concorrente? [______________]    │
├────────────────────────────────────────────┤
│ Concorrente 2                              │
│ Nome: [________________]                   │
│ Por que e concorrente? [______________]    │
└────────────────────────────────────────────┘

Empresas que Inspiram (referencia no mercado)
┌────────────────────────────────────────────┐
│ Empresa 1                                  │
│ Nome: [________________]                   │
│ Por que inspira voce? [______________]     │
├────────────────────────────────────────────┤
│ Empresa 2                                  │
│ Nome: [________________]                   │
│ Por que inspira voce? [______________]     │
└────────────────────────────────────────────┘
```

---

## Grupo 3: PDF e Exportacao (5-6)

### 5. PDF Completo

Atualizar `OnboardingPDFTemplate.tsx` para incluir TODAS as secoes:

| Secao | Dados |
|-------|-------|
| Cabecalho | Nome da Empresa, Data de Preenchimento, CNPJ, Responsavel |
| Empresa | Nicho, Regioes de Atuacao |
| Produto | Nome, Descricao, Ticket, Modelo B2B/B2C, Diferenciais, Beneficios |
| Dores | Dor Principal, Secundaria, Impactos, Desejos |
| Mercado | Faturamento, Investimento, Canais, Meta, Concorrentes, Inspiracoes |
| Redes Sociais | Instagram, Facebook (logins, sem senhas) |
| Promessa | Texto da Promessa |
| Publico | ICPs com todos os detalhes |

### 6. Atualizacao Automatica do PDF

Garantir que `OnboardingX1Section.tsx` faca refetch dos dados apos qualquer alteracao no wizard, usando callback ou key para forcar re-render do componente PDF.

---

## Migracao de Banco de Dados

```sql
-- Adicionar campos de concorrentes na tabela client_profile
ALTER TABLE client_profile
ADD COLUMN IF NOT EXISTS local_competitor_1 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS local_competitor_2 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inspiration_company_1 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inspiration_company_2 JSONB DEFAULT NULL;

-- Estrutura esperada do JSONB:
-- { "name": "Nome da Empresa", "reason": "Motivo" }
```

---

## Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|------------|
| `src/lib/utils.ts` | Funcoes maskCPF, maskCNPJ, maskPhone, maskCurrency |
| `src/pages/ClientNew.tsx` | Mascaras nos inputs + data de preenchimento |
| `src/pages/ClientDetails.tsx` | Mascaras nos inputs |
| `src/pages/ClientRegister.tsx` | Mascaras nos inputs + data de preenchimento |
| `src/components/onboarding/steps/StepCompany.tsx` | Campos do cliente editaveis |
| `src/components/onboarding/steps/StepProduct.tsx` | Verificar B2B/B2C |
| `src/components/onboarding/steps/StepMarket.tsx` | Toggle senha, mascara moeda, secao concorrentes |
| `src/components/export/OnboardingPDFTemplate.tsx` | Todas as secoes do onboarding |
| `src/components/client/OnboardingX1Section.tsx` | Dados completos para PDF + refresh |

---

## Fluxo de Implementacao

1. Executar migracao SQL (novos campos concorrentes)
2. Criar funcoes de mascara em utils.ts
3. Atualizar formularios de cadastro (ClientNew, ClientDetails, ClientRegister)
4. Atualizar StepCompany com dados do cliente
5. Atualizar StepMarket (toggle senha, mascara moeda, secao concorrentes)
6. Atualizar OnboardingPDFTemplate com todos os dados
7. Atualizar OnboardingX1Section para refresh do PDF
8. Testar fluxo interno e externo (link)

---

## Resultado Esperado

1. CPF, CNPJ e Telefone formatados automaticamente em todos os formularios
2. Data de preenchimento visivel
3. PDF completo com TODOS os dados das 7 etapas
4. PDF sempre atualizado quando editar o onboarding
5. Modelo B2B/B2C funcionando
6. Etapa Empresa exibe dados cadastrais do cliente
7. Meta de faturamento com formato R$
8. Olhinho para ver senhas digitadas
9. Secao de concorrentes locais e empresas de inspiracao
10. Todas as alteracoes funcionando no link externo tambem

