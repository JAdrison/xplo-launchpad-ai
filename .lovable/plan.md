

# Atualização dos Componentes StepICPs e StepPains

## Problema Identificado

Os componentes de ICPs e Dores ainda estão usando a estrutura antiga:

| Componente | Estado Atual | Estado Esperado |
|------------|--------------|-----------------|
| StepICPs | segment, characteristics, current_situation | name, profession, age, gender, reason_needs_solution |
| StepPains | main_pain, consequence, daily_impacts | + secondary_pain, desire_1, desire_2, botão IA |

## Alterações Necessárias

### 1. StepICPs.tsx - Simplificar Formulário

**Campos Antigos (remover):**
- segment
- characteristics  
- current_situation

**Novos Campos (adicionar):**
- profession (texto livre)
- age (texto livre)
- gender (dropdown: Masculino, Feminino, Ambos)
- reason_needs_solution (textarea curto)

**Interface Atualizada:**
```typescript
interface ICPForm {
  id?: string;
  name: string;
  profession: string;
  age: string;
  gender: string;
  reason_needs_solution: string;
}
```

**Layout:**
```
+----------------------------------------------------------+
| ICP 1                                              [X]   |
|                                                          |
| Nome *              [________________]                   |
| Profissão           [________________]                   |
| Idade   [____]      Sexo [Dropdown: M/F/Ambos]          |
|                                                          |
| Por que precisa da solução?                              |
| [Texto breve - 2 linhas________________]                 |
+----------------------------------------------------------+
```

### 2. StepPains.tsx - Adicionar Desejos e IA

**Campos Atuais:**
- main_pain
- consequence
- daily_impacts

**Novos Campos:**
- secondary_pain (renomear consequence)
- desire_1
- desire_2

**Adicionar:**
- Botão "Gerar com IA" (aparece se campos vazios)

**Interface Atualizada:**
```typescript
interface PainForm {
  icp_id: string;
  icp_name: string;
  main_pain: string;
  secondary_pain: string;
  daily_impacts: string[];
  desire_1: string;
  desire_2: string;
}
```

**Layout:**
```
+----------------------------------------------------------+
| Dores e Desejos do Público                               |
|                                                          |
| [Card IA - se campos vazios]                             |
|                                                          |
| +------------------------------------------------------+ |
| | [Badge: Nome do ICP]                                 | |
| |                                                      | |
| | Dor Principal *      [________________]              | |
| | Dor Secundária       [________________]              | |
| |                                                      | |
| | Impactos (até 3)     [Tag] [Tag] [+]                 | |
| |                                                      | |
| | Desejos do Público                                   | |
| | Desejo 1             [________________]              | |
| | Desejo 2             [________________]              | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

### 3. Edge Function - Adicionar generate-pains

Criar novo tipo na edge function para gerar dores e desejos com IA:

```typescript
case "generate-pains":
  // Baseado em: nicho, produto, ICPs
  // Retorna para cada ICP:
  // - main_pain
  // - secondary_pain
  // - daily_impacts (até 3)
  // - desire_1
  // - desire_2
```

### 4. Atualizar Geração de ICPs na Edge Function

O prompt de `generate-icps` precisa retornar os novos campos simplificados:
- name (nome pessoal brasileiro)
- profession
- age
- gender
- reason_needs_solution

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `StepICPs.tsx` | Trocar campos para versão simplificada |
| `StepPains.tsx` | Adicionar secondary_pain, desire_1, desire_2, botão IA |
| `generate-content/index.ts` | Atualizar generate-icps, adicionar generate-pains |
| `StepReview.tsx` | Atualizar para mostrar novos campos de ICP e desejos |

## Checklist

| # | Item |
|---|------|
| 1 | StepICPs.tsx: Substituir segment/characteristics por profession/age/gender |
| 2 | StepICPs.tsx: Adicionar campo reason_needs_solution |
| 3 | StepICPs.tsx: Atualizar mapeamento da resposta da IA |
| 4 | StepPains.tsx: Renomear consequence para secondary_pain |
| 5 | StepPains.tsx: Adicionar campos desire_1 e desire_2 |
| 6 | StepPains.tsx: Adicionar card e botão de geração com IA |
| 7 | Edge Function: Atualizar prompt de generate-icps |
| 8 | Edge Function: Criar tipo generate-pains |
| 9 | StepReview.tsx: Mostrar novos campos de ICP |
| 10 | StepReview.tsx: Mostrar desejos nas dores |

## Resultado Esperado

1. **ICPs simplificados**: Nome, Profissão, Idade, Sexo, Por que precisa
2. **Dores completas**: 1 principal, 1 secundária, impactos, 2 desejos
3. **IA em ambas etapas**: Ajuda quem não sabe mapear seu público ou dores

