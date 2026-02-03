

# Alteracoes no Onboarding - Plano de Implementacao

## Resumo das Alteracoes Solicitadas

| # | Alteracao | Descricao |
|---|-----------|-----------|
| 1 | Area de Atuacao | Adicionar descricao "Bairros, Cidades, Estados" + multiplas regioes |
| 2 | Ordem das Etapas | Mover ICP para depois da Promessa (antes da Revisao) |
| 3 | Dores/Desejos | Dissociar de ICP - agora eh sobre "quem compra", nao sobre ICP |
| 4 | Mercado - Novos Campos | Faturamento atual, investimento atual, investimento inicial em trafego + calculo de leads |
| 5 | Dores - Acoes | Adicionar botao "Personalizar" (editar) e "Gerar Novamente" |
| 6 | Onboarding Externo | Garantir que todas as alteracoes se apliquem ao link externo |

---

## Nova Ordem das Etapas (7 passos)

| # | Etapa | Conteudo |
|---|-------|----------|
| 1 | Empresa | Nicho + Regioes de atuacao (multiplas) |
| 2 | Produto | Nome, Descricao, Ticket, Modelo, Diferenciais, Beneficios, Promocoes |
| 3 | Dores | Dores e Desejos de QUEM COMPRA (nao vinculado a ICP) |
| 4 | Mercado | Canais, Faturamento Atual, Investimento Atual, Investimento Inicial, Calculo de Leads |
| 5 | Promessa | Promessa de valor (pode gerar com IA) |
| 6 | Publico | ICPs gerados pela IA usando TODOS os dados anteriores (incluindo promessa) |
| 7 | Revisao | Resumo de todas as secoes |

---

## 1. Alteracao em StepCompany.tsx

### 1.1 Descricao da Regiao

Atualizar o hint do campo regiao:

```
Antes: "Ex: Brasil, Sao Paulo, Nacional, Global..."
Depois: "Ex: Zona Sul de SP, Florianopolis, Santa Catarina..."

Adicionar descricao: "Informe bairros, cidades ou estados onde voce atua"
```

### 1.2 Multiplas Regioes

Transformar campo de texto em sistema de tags (como diferenciais em StepProduct):

```
+----------------------------------------------------------+
|  Regiao de Atuacao                                       |
|                                                          |
|  [Input: Digite uma regiao...] [Adicionar]               |
|                                                          |
|  [Zona Sul de SP] [x] [Florianopolis] [x]                |
+----------------------------------------------------------+
```

### Migracao de Banco

Alterar tipo do campo `region` de `text` para `text[]`:

```sql
ALTER TABLE public.client_profile 
ALTER COLUMN region TYPE text[] USING CASE 
  WHEN region IS NULL THEN NULL 
  ELSE ARRAY[region] 
END;
```

---

## 2. Nova Ordem das Etapas no Wizard

### OnboardingWizard.tsx

Nova estrutura:

```typescript
const STEPS = [
  { number: 1, name: "Empresa", description: "Nicho e regioes de atuacao" },
  { number: 2, name: "Produto", description: "O que voce oferece" },
  { number: 3, name: "Dores", description: "Dores e desejos do comprador" },
  { number: 4, name: "Mercado", description: "Faturamento, investimento e metas" },
  { number: 5, name: "Promessa", description: "Sua promessa de valor" },
  { number: 6, name: "Publico", description: "Perfis de cliente ideal" },
  { number: 7, name: "Revisao", description: "Confirmar informacoes" },
];
```

### renderStep()

```typescript
switch (currentStep) {
  case 1: return <StepCompany />;
  case 2: return <StepProduct />;
  case 3: return <StepPains />;    // Movido para antes
  case 4: return <StepMarket />;   // Movido para antes
  case 5: return <StepPromise />;
  case 6: return <StepICPs />;     // Movido para ultimo antes de revisao
  case 7: return <StepReview />;
}
```

---

## 3. Dores/Desejos para Comprador (nao ICP)

### StepPains.tsx - Remodelar

Antes: Vinculado a cada ICP (precisa ter ICP cadastrado)
Depois: Dados gerais sobre "quem compra" (independente de ICP)

Nova estrutura:

```
+----------------------------------------------------------+
|  Dores e Desejos de Quem Compra                          |
|                                                          |
|  [Gerar com IA]  [Gerar Novamente]                       |
|                                                          |
|  Dor Principal *       [________________] [Personalizar] |
|  Dor Secundaria        [________________] [Personalizar] |
|                                                          |
|  Impactos (ate 3)      [Tag] [Tag] [+]                   |
|                                                          |
|  Desejo 1              [________________] [Personalizar] |
|  Desejo 2              [________________] [Personalizar] |
+----------------------------------------------------------+
```

### Migracao de Banco

Criar nova tabela `buyer_pains` ou adicionar campos em `client_profile`:

```sql
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS main_pain text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS secondary_pain text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_impacts text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desire_1 text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desire_2 text DEFAULT NULL;
```

---

## 4. Alteracoes em StepMarket.tsx

### 4.1 Novo Campo: Faturamento Mensal Atual

```typescript
const REVENUE_OPTIONS = [
  { value: "ate_10k", label: "Ate R$ 10.000" },
  { value: "10k_30k", label: "R$ 10.000 - R$ 30.000" },
  { value: "30k_50k", label: "R$ 30.000 - R$ 50.000" },
  { value: "50k_100k", label: "R$ 50.000 - R$ 100.000" },
  { value: "100k_200k", label: "R$ 100.000 - R$ 200.000" },
  { value: "acima_200k", label: "Acima de R$ 200.000" },
];
```

### 4.2 Renomear: Investimento em Marketing (Atual)

Adicionar "(Atual)" ao label existente para clareza.

### 4.3 Novo Campo: Investimento Inicial em Trafego

```typescript
const TRAFFIC_INVESTMENT_OPTIONS = [
  { value: "1000", label: "R$ 1.000" },
  { value: "1500", label: "R$ 1.500" },
  { value: "2000", label: "R$ 2.000" },
  { value: "5000", label: "R$ 5.000" },
  { value: "outro", label: "Outro valor" },
];
```

Se "outro" selecionado, mostrar input para digitar valor.

### 4.4 Calculo Automatico de Leads

```
Investimento: R$ 2.000
CPL estimado: R$ 7-15

Leads estimados: 133 a 286 leads/mes
```

Formula:

```typescript
const minLeads = Math.floor(investment / 15);
const maxLeads = Math.floor(investment / 7);
// Mostrar: "De {minLeads} a {maxLeads} leads"
```

### Layout Final

```
+----------------------------------------------------------+
|  Sobre seu Mercado                                       |
|                                                          |
|  Faturamento Mensal Atual        [Dropdown]              |
|                                                          |
|  Investimento Mensal em Marketing (Atual)  [Dropdown]    |
|                                                          |
|  Quanto vai investir inicialmente em trafego?            |
|  [1000] [1500] [2000] [5000] [Outro: ____]               |
|                                                          |
|  +----------------------------------------------------+  |
|  | Estimativa de Leads                                |  |
|  | Com R$ 2.000, voce pode gerar de 133 a 286 leads   |  |
|  | (CPL estimado: R$ 7 a R$ 15)                       |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Tamanho da Equipe de Vendas     [Dropdown]              |
|  Meta de Faturamento Mensal      [Input]                 |
+----------------------------------------------------------+
```

### Migracao de Banco

```sql
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS current_revenue text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS initial_traffic_investment text DEFAULT NULL;
```

---

## 5. Dores - Botoes Personalizar e Gerar Novamente

### StepPains.tsx

Adicionar ao lado de cada campo:

```typescript
<div className="flex gap-2">
  <Input value={mainPain} onChange={...} disabled={!isEditing.mainPain} />
  <Button 
    variant="ghost" 
    size="icon" 
    onClick={() => toggleEdit('mainPain')}
  >
    <Pencil className="h-4 w-4" />
  </Button>
</div>
```

### Botao "Gerar Novamente"

Sempre visivel, ao lado de "Gerar com IA":

```typescript
{!isPainsEmpty && (
  <Button 
    variant="outline" 
    onClick={handleGenerateWithAI}
    disabled={isGenerating}
    className="gap-2"
  >
    <RefreshCw className="h-4 w-4" />
    Gerar Novamente
  </Button>
)}
```

---

## 6. Atualizar ICPs para Usar Dados Completos

### StepICPs.tsx

Agora que ICP vem depois da Promessa, a geracao com IA pode usar:
- Nicho
- Produto + Diferenciais + Beneficios
- Dores e Desejos do comprador
- Promessa de valor

### Edge Function - generate-icps

Atualizar para incluir TODOS os dados no contexto:

```typescript
const icpsPrompt = `## DADOS COMPLETOS DO NEGOCIO

**Nicho:** ${pppData?.niche}
**Produto:** ${pppData?.profile?.product_name}
**Diferenciais:** ${pppData?.profile?.differentiators?.join(', ')}

**DORES DO COMPRADOR:**
- Dor Principal: ${pppData?.profile?.main_pain}
- Dor Secundaria: ${pppData?.profile?.secondary_pain}
- Desejos: ${pppData?.profile?.desire_1}, ${pppData?.profile?.desire_2}

**PROMESSA DE VALOR:**
${pppData?.promise?.promise_text}

## INSTRUCAO

Gere 3 perfis de cliente ideal que:
1. Sofrem das dores mapeadas
2. Desejam o que a promessa oferece
3. Sao coerentes com o nicho
`;
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `StepCompany.tsx` | Multiplas regioes + nova descricao |
| `StepPains.tsx` | Remover vinculo ICP, adicionar Personalizar/Gerar Novamente |
| `StepMarket.tsx` | Faturamento atual, investimento trafego, calculo leads |
| `StepICPs.tsx` | Atualizar para usar dados completos |
| `OnboardingWizard.tsx` | Nova ordem das etapas |
| `StepReview.tsx` | Atualizar ordem e campos no resumo |
| `generate-content/index.ts` | Atualizar generate-icps e generate-pains |

---

## Migracao SQL Completa

```sql
-- 1. Multiplas regioes
ALTER TABLE public.client_profile 
ALTER COLUMN region TYPE text[] USING CASE 
  WHEN region IS NULL THEN NULL 
  ELSE ARRAY[region] 
END;

-- 2. Dores/Desejos no profile (nao mais vinculado a ICP)
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS main_pain text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS secondary_pain text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_impacts text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desire_1 text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desire_2 text DEFAULT NULL;

-- 3. Novos campos de Mercado
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS current_revenue text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS initial_traffic_investment text DEFAULT NULL;
```

---

## Checklist de Implementacao

| # | Item |
|---|------|
| 1 | Migracao SQL para novos campos |
| 2 | StepCompany.tsx: multiplas regioes |
| 3 | StepPains.tsx: remover vinculo ICP, botoes editar/regenerar |
| 4 | StepMarket.tsx: faturamento atual, investimento trafego, calculo leads |
| 5 | OnboardingWizard.tsx: nova ordem (Dores > Mercado > Promessa > ICP) |
| 6 | StepICPs.tsx: usar dados completos na geracao |
| 7 | StepReview.tsx: atualizar para nova estrutura |
| 8 | Edge Function: atualizar prompts |
| 9 | Testar fluxo interno e externo |

---

## Resultado Esperado

1. **Fluxo mais logico**: Coleta dores/promessa ANTES de definir ICPs
2. **ICPs mais precisos**: Gerados com base em dados completos
3. **Mercado detalhado**: Faturamento atual + estimativa de leads
4. **UX melhorada**: Botoes de editar e regenerar nas dores
5. **Regioes flexiveis**: Multiplas areas de atuacao

