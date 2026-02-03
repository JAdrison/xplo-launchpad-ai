

# Atualização do Onboarding X1 para 7 Etapas (com IA Seletiva)

## Resumo

Expandir o wizard de 5 para 7 etapas conforme o fluxo "Onboarding X1" original, adicionando IA apenas em pontos onde ela realmente agrega valor - ajudando quem tem dificuldade em definir conceitos abstratos, sem servir como muleta para quem pode responder por conta propria.

---

## Nova Estrutura de 7 Etapas

| Etapa | Nome | Descricao | IA? |
|-------|------|-----------|-----|
| 1 | Empresa | Nicho e Regiao de atuacao | Nao |
| 2 | Produto | Nome, Descricao, Ticket, Modelo, Diferenciais, Beneficios, Promocoes | Nao |
| 3 | Publico | Perfis de Cliente Ideal (ICPs) | Sim - opcional |
| 4 | Dores | Principais dores, consequencias, impactos | Nao |
| 5 | Mercado | Canais de demanda, investimento, equipe, meta | Nao |
| 6 | Promessa | Promessa de valor | Sim - opcional |
| 7 | Revisao | Confirmar todas as informacoes | Nao |

---

## Uso de IA - Criterio de Selecao

**ONDE a IA sera usada:**

1. **Etapa 3 - ICPs (Perfis de Cliente)**: Muitas pessoas nao conhecem exatamente seu cliente ideal. A IA analisa o nicho + produto e sugere 3 perfis contextualizados. Usuario pode aceitar, editar ou ignorar.

2. **Etapa 6 - Promessa de Valor**: Formular uma promessa clara e impactante e dificil para a maioria. A IA pode gerar uma sugestao baseada em tudo que foi preenchido. Usuario pode usar como inspiracao ou escrever do zero.

**ONDE a IA NAO sera usada:**

- Empresa (dados objetivos)
- Produto (o dono sabe o que vende)
- Dores (vivencia real do mercado)
- Mercado (dados objetivos de investimento/equipe)
- Revisao (apenas visualizacao)

---

## Migracao do Banco de Dados

Adicionar campos na tabela `client_profile`:

```sql
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS benefits text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotions text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS demand_channels text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS monthly_investment text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sales_team_size text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS revenue_goal text DEFAULT NULL;
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `steps/StepCompany.tsx` | Nova etapa 1: Nicho e Regiao |
| `steps/StepMarket.tsx` | Nova etapa 5: Canais, investimento, equipe, meta |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `OnboardingWizard.tsx` | Atualizar para 7 etapas, reorganizar ordem |
| `StepProduct.tsx` | Adicionar Beneficios e Promocoes |
| `StepICPs.tsx` | Adicionar opcao "Nao sei, gerar sugestoes com IA" |
| `StepPromise.tsx` | Adicionar botao "Gerar sugestao com IA" |
| `StepReview.tsx` | Mostrar todas as 7 secoes |

---

## Detalhamento das Etapas

### Etapa 1: Empresa (NOVA)

```
+----------------------------------------------------------+
|  Sobre sua Empresa                                       |
|                                                          |
|  Nicho/Segmento *       [________________]              |
|  Hint: "Ex: Academias, Clinicas, Restaurantes"           |
|                                                          |
|  Regiao de Atuacao      [________________]              |
|  Hint: "Ex: Brasil, Sao Paulo, Nacional"                 |
|                                                          |
|                                       [Proximo]          |
+----------------------------------------------------------+
```

### Etapa 2: Produto (ATUALIZADO)

Adicionar ao formulario atual:

- **Modelo de Venda**: Dropdown (B2B, B2C, Recorrente, Projeto, Hibrido)
- **Beneficios** (ate 5): Tags, similar aos diferenciais
- **Promocoes Ativas**: Textarea opcional

### Etapa 3: Publico/ICPs (ATUALIZADO COM IA)

```
+----------------------------------------------------------+
|  Perfis de Cliente Ideal (ICPs)                          |
|                                                          |
|  +----------------------------------------------------+  |
|  | [Info] Voce conhece bem seu cliente ideal?         |  |
|  |                                                    |  |
|  | Se voce ainda nao tem clareza sobre quem e seu     |  |
|  | cliente ideal, podemos sugerir 3 perfis baseados   |  |
|  | nas informacoes do seu negocio.                    |  |
|  |                                                    |  |
|  | [Gerar Sugestoes com IA]                           |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [Formulario de ICPs - editavel]                         |
|                                                          |
+----------------------------------------------------------+
```

**Comportamento:**
- Botao "Gerar Sugestoes com IA" aparece APENAS se os campos de ICP estiverem vazios
- Ao clicar, gera 3 ICPs contextualizados
- Usuario pode editar TUDO antes de salvar
- Se ja tem ICPs preenchidos, botao nao aparece

### Etapa 4: Dores

Permanece igual - sem IA.

### Etapa 5: Mercado (NOVA)

```
+----------------------------------------------------------+
|  Sobre seu Mercado                                       |
|                                                          |
|  Como voce gera clientes hoje? (selecione quantos quiser)|
|  [ ] Instagram/Redes Sociais  [ ] Google Ads             |
|  [ ] LinkedIn                 [ ] Indicacoes             |
|  [ ] Eventos                  [ ] Trafego Organico       |
|  [ ] Outro: [_____________]                              |
|                                                          |
|  Investimento Mensal em Marketing                        |
|  [Dropdown: Nenhum / Ate R$1k / R$1-5k / R$5-10k / +R$10k]|
|                                                          |
|  Tamanho da Equipe de Vendas                             |
|  [Dropdown: So eu / 1-3 pessoas / 4-10 / +10]           |
|                                                          |
|  Meta de Faturamento Mensal                              |
|  [________________] (Ex: R$ 50.000)                      |
|                                                          |
+----------------------------------------------------------+
```

### Etapa 6: Promessa (ATUALIZADO COM IA)

```
+----------------------------------------------------------+
|  Sua Promessa de Valor                                   |
|                                                          |
|  [Dicas para uma boa promessa - ja existente]            |
|                                                          |
|  Sua Promessa *                                          |
|  [Textarea]                                              |
|                                                          |
|  +----------------------------------------------------+  |
|  | [Lightbulb] Precisa de inspiracao?                 |  |
|  |                                                    |  |
|  | A IA pode sugerir uma promessa baseada em tudo     |  |
|  | que voce preencheu ate aqui.                       |  |
|  |                                                    |  |
|  | [Gerar Sugestao]                                   |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

**Comportamento:**
- Botao "Gerar Sugestao" sempre visivel
- Ao clicar, gera 1 promessa baseada nos dados
- INSERE no campo (nao substitui se ja tiver algo)
- Usuario pode editar livremente

### Etapa 7: Revisao (ATUALIZADO)

Mostrar resumo de todas as 7 secoes:
1. Empresa (nicho, regiao)
2. Produto (nome, ticket, diferenciais, beneficios)
3. Publico (ICPs)
4. Dores
5. Mercado (canais, investimento, equipe)
6. Promessa
7. Botao "Concluir Onboarding"

---

## Edge Function - Nova funcao

Adicionar tipo `generate-promise` para gerar sugestao de promessa:

```typescript
case "generate-promise":
  // Usa todos os dados (empresa, produto, ICPs, dores, mercado)
  // para gerar UMA promessa de valor contextualizada
```

O tipo `generate-icps` ja existe e sera reutilizado.

---

## OnboardingWizard.tsx - Nova Estrutura

```typescript
const STEPS = [
  { number: 1, name: "Empresa", description: "Nicho e regiao de atuacao" },
  { number: 2, name: "Produto", description: "O que voce oferece" },
  { number: 3, name: "Publico", description: "Perfis de cliente ideal" },
  { number: 4, name: "Dores", description: "Problemas que voce resolve" },
  { number: 5, name: "Mercado", description: "Canais e metas" },
  { number: 6, name: "Promessa", description: "Sua promessa de valor" },
  { number: 7, name: "Revisao", description: "Confirmar informacoes" },
];
```

---

## Checklist de Implementacao

| # | Item | Descricao |
|---|------|-----------|
| 1 | Migracao | Adicionar campos (benefits, promotions, demand_channels, etc) |
| 2 | StepCompany.tsx | Criar etapa 1 (Nicho, Regiao) |
| 3 | StepProduct.tsx | Adicionar Modelo, Beneficios, Promocoes |
| 4 | StepICPs.tsx | Adicionar botao opcional de geracao com IA |
| 5 | StepMarket.tsx | Criar etapa 5 (Canais, Investimento, Equipe, Meta) |
| 6 | StepPromise.tsx | Adicionar botao de sugestao com IA |
| 7 | StepReview.tsx | Atualizar para 7 secoes |
| 8 | OnboardingWizard.tsx | Atualizar para 7 etapas |
| 9 | Edge Function | Adicionar tipo `generate-promise` |

---

## Resultado Esperado

1. **7 etapas completas** conforme especificacao original
2. **IA seletiva** - apenas em ICPs (para quem nao conhece o cliente) e Promessa (para inspiracao)
3. **Campos de mercado** - entender canais e investimento atuais
4. **Fluxo mais completo** - coleta todas as informacoes necessarias para geracao de ofertas

