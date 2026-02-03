

# Implementação Completa: ICP Simplificado + Dores/Desejos + Promessa Hormozi

## ✅ Concluído

### 1. Migração do Banco de Dados
- Adicionados campos em `icps`: `profession`, `age`, `gender`, `reason_needs_solution`
- Adicionados campos em `icp_pains`: `secondary_pain`, `desire_1`, `desire_2`

### 2. Edge Function - Promessa Hormozi
- Atualizado `generate-promise` com metodologia Alex Hormozi
- Usa Value Equation: (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort Required)
- Fórmula: "[QUEM] consegue [DESEJO] em [PRAZO] sem [DOR/OBJEÇÃO]"
- Inclui dores E desejos no contexto da geração

---

## 🔜 Próximos Passos

### 3. StepICPs.tsx - Simplificar Formulário
Campos atuais → Campos simplificados:
- Nome ✓
- Profissão (novo)
- Idade (novo)
- Sexo (novo)
- Por que precisa da solução (novo)
- Remover: segment, characteristics, current_situation

### 4. StepPains.tsx - Adicionar Desejos
- Dor Principal ✓
- Dor Secundária (novo)
- Impactos ✓
- Desejo 1 (novo)
- Desejo 2 (novo)
- Botão "Gerar com IA" (novo)

### 5. Edge Function - generate-icps
- Atualizar para retornar campos simplificados

### 6. Edge Function - generate-pains (novo)
- Criar tipo para gerar dores e desejos

---

## Estrutura de Dados

### ICPs (Simplificado)
```typescript
interface ICP {
  name: string;           // Nome/persona
  profession: string;     // Profissão
  age: string;            // Idade
  gender: string;         // Sexo
  reason_needs_solution: string; // Por que precisa
}
```

### Dores e Desejos
```typescript
interface ICPPain {
  main_pain: string;      // Dor principal
  secondary_pain: string; // Dor secundária/consequência
  daily_impacts: string[]; // Impactos (até 3)
  desire_1: string;       // Desejo 1
  desire_2: string;       // Desejo 2
}
```

### Promessa (Hormozi)
```
"[QUEM] consegue [DESEJO] em [PRAZO] sem [DOR/OBJEÇÃO]"

Exemplos:
- "Donos de academia lotam suas unidades em 90 dias sem depender de indicações"
- "Dentistas fecham 10 tratamentos de alto valor por semana sem precisar baixar preço"
```
