

# Refatorar "ICPs" para "Perfil dos Principais Clientes"

## Visão Geral

Substituir a terminologia técnica "ICP" (Perfil de Cliente Ideal) por uma linguagem mais acessível e natural focada em **"quem já compra de você"**, tornando o preenchimento mais intuitivo para o cliente.

---

## Nova Estrutura de Campos

| Campo Atual | Novo Campo | Descrição |
|-------------|------------|-----------|
| `name` | `name` | Nome do Perfil (mantém) |
| `profession` | *removido* | — |
| `age` | *removido* | — |
| `gender` | *removido* | — |
| `reason_needs_solution` | `why_buys` | Por que esse cliente compra de você? |
| *novo* | `who_is` | Quem é esse cliente? (O que faz, como trabalha, como decide) |
| *novo* | `when_seeks` | Em que momento ele te procura hoje? |
| *novo* | `is_ideal` | Esse é um cliente que você quer atrair mais? (enum) |

---

## Textos UX Propostos

**Título da Etapa:**
"Perfil dos Principais Clientes"

**Texto Introdutório:**
"Agora vamos entender quem são os clientes que mais compram de você hoje — ou que você gostaria de atrair com mais frequência."

**Labels dos Campos:**

| Campo | Label | Placeholder/Helper |
|-------|-------|-------------------|
| `name` | "Nome do Perfil" | "Ex: Dono de empresa solar residencial" |
| `who_is` | "Quem é esse cliente?" | "O que ele faz, como trabalha, como decide compras..." |
| `when_seeks` | "Em que momento ele te procura hoje?" | "O que normalmente está acontecendo quando ele chega até você?" |
| `why_buys` | "Por que esse cliente compra de você?" | "Motivo real: preço, rapidez, confiança, especialização, etc." |
| `is_ideal` | "Esse é um cliente que você quer atrair mais?" | Opções de seleção |

---

## Migração do Banco de Dados

Adicionar 3 novas colunas à tabela `icps`:

```sql
ALTER TABLE icps 
  ADD COLUMN who_is TEXT,
  ADD COLUMN when_seeks TEXT,
  ADD COLUMN is_ideal TEXT CHECK (is_ideal IN ('ideal', 'good_not_ideal', 'no_more'));
```

Os campos `profession`, `age` e `gender` podem ser mantidos no banco para retrocompatibilidade, mas não serão exibidos na interface.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/onboarding/steps/StepICPs.tsx` | Reformular completamente a UI com novos campos e textos |
| `src/components/export/OnboardingPDFTemplate.tsx` | Atualizar título e exibição dos novos campos |
| `supabase/functions/generate-content/index.ts` | Atualizar prompt de geração de perfis para usar nova estrutura |
| `src/pages/Generator.tsx` | Atualizar labels de "ICP" para "Perfil de Cliente" |
| `src/components/onboarding/StepGenerateOffer.tsx` | Atualizar labels de "ICP" para "Perfil de Cliente" |

---

## Alterações Detalhadas

### 1. StepICPs.tsx

**Interface ICPForm atualizada:**

```typescript
interface ProfileForm {
  id?: string;
  name: string;
  who_is: string;          // Quem é esse cliente?
  when_seeks: string;      // Em que momento te procura?
  why_buys: string;        // Por que compra de você?
  is_ideal: string;        // ideal | good_not_ideal | no_more
}
```

**Header do Card:**
- Título: "Perfil dos Principais Clientes"
- Ícone: Users (mantém)
- Descrição: "Agora vamos entender quem são os clientes que mais compram de você hoje — ou que você gostaria de atrair com mais frequência."

**Formulário por perfil:**
1. Campo "Nome do Perfil" (Input)
2. Campo "Quem é esse cliente?" (Textarea)
3. Campo "Em que momento ele te procura hoje?" (Textarea)
4. Campo "Por que esse cliente compra de você?" (Textarea)
5. Radio Group "Esse é um cliente que você quer atrair mais?"
   - ( ) Sim, é o ideal
   - ( ) É bom, mas não ideal
   - ( ) Não quero mais esse perfil

**Botão Adicionar:**
- De: "Adicionar ICP"
- Para: "Adicionar Outro Perfil"

**Toast de sucesso:**
- De: "ICPs salvos"
- Para: "Perfis de cliente salvos"

---

### 2. Edge Function (generate-content/index.ts)

**Atualizar handler `generate-icps`:**

```text
sys = 'Estrategista de perfis de clientes.';
prompt = `Nicho: ${pppData?.niche}
Produto: ${pppData?.profile?.product_name}
Descrição: ${pppData?.profile?.product_description}
Dor principal: ${pppData?.profile?.main_pain}

Gere 3 perfis de clientes que compram esse produto.

JSON: {"profiles":[{
  "name": "Nome do perfil (ex: Dono de empresa solar residencial)",
  "who_is": "Quem é, o que faz, como trabalha, como decide compras",
  "when_seeks": "Em que momento procura esse tipo de solução",
  "why_buys": "Motivo real pelo qual compra (preço, rapidez, confiança, etc)",
  "is_ideal": "ideal"
}]}`;
```

---

### 3. OnboardingPDFTemplate.tsx

**Atualizar interface:**

```typescript
icps: Array<{
  name: string;
  who_is: string | null;
  when_seeks: string | null;
  why_buys: string | null;
  is_ideal: string | null;
}>;
```

**Atualizar título da seção:**
- De: "PERFIL DO CLIENTE IDEAL (ICPs)"
- Para: "PERFIS DOS PRINCIPAIS CLIENTES"

**Atualizar labels exibidas:**
- "Quem é:" + who_is
- "Quando procura:" + when_seeks
- "Por que compra:" + why_buys
- Badge: "Cliente Ideal" | "Bom, mas não ideal" | "Não quer mais"

---

### 4. Generator.tsx

Atualizar textos de UI:
- Badge: "{N} ICP{s}" → "{N} Perfil(s)"
- Título seção: "Selecione um ICP" → "Selecione um Perfil de Cliente"
- Descrição: atualizar referências a ICP

---

### 5. StepGenerateOffer.tsx

Atualizar textos de UI:
- Label: "Selecione o ICP para esta oferta" → "Selecione o perfil de cliente para esta oferta"
- Placeholder: "Escolha um ICP..." → "Escolha um perfil..."
- Helper text: atualizar referências a ICP

---

## Comparativo Visual

**Antes (Campos técnicos):**
```text
┌────────────────────────────────────────┐
│ ICP 1                                  │
├────────────────────────────────────────┤
│ Nome do Perfil: Carlos, o Empresário   │
│ Profissão: Dono de academia            │
│ Idade: 35-45 anos                      │
│ Sexo: [Masculino ▼]                    │
│ Por que precisa da solução?            │
│ [________________________]             │
└────────────────────────────────────────┘
```

**Depois (Linguagem natural):**
```text
┌────────────────────────────────────────┐
│ Perfil 1                               │
├────────────────────────────────────────┤
│ Nome do Perfil                         │
│ [Dono de empresa solar residencial   ] │
│                                        │
│ Quem é esse cliente?                   │
│ [Empresário de 35-50 anos, dono de    ]│
│ [empresa de energia solar, trabalha   ]│
│ [focado em residencial...             ]│
│                                        │
│ Em que momento ele te procura hoje?    │
│ [Quando quer escalar vendas, está com ]│
│ [baixo fluxo de leads qualificados... ]│
│                                        │
│ Por que esse cliente compra de você?   │
│ [Especialização no nicho solar,       ]│
│ [rapidez na entrega, confiança...     ]│
│                                        │
│ Esse é um cliente que você quer       │
│ atrair mais?                           │
│ (●) Sim, é o ideal                     │
│ ( ) É bom, mas não ideal               │
│ ( ) Não quero mais esse perfil         │
└────────────────────────────────────────┘
```

---

## Resultado Esperado

1. Cliente entende as perguntas sem precisar de explicações técnicas
2. Respostas mais ricas e contextualizadas para geração de ofertas
3. Identificação clara de quais perfis priorizar nas campanhas
4. Campo "não quero mais esse perfil" ajuda a filtrar leads indesejados
5. IA gera perfis mais práticos baseados em comportamento real de compra

