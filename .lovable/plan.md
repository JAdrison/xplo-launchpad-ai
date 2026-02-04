

# Sincronizacao das 7 Etapas do Onboarding X1

## Resumo

Atualizar os componentes de resumo/dashboard para refletir corretamente as 7 etapas do wizard de onboarding, tanto no painel interno quanto no fluxo externo por link.

## Problema Identificado

O wizard de onboarding (`OnboardingWizard.tsx`) possui 7 etapas, mas os componentes de resumo mostram apenas 5:

| Wizard (7 etapas) | Card de Resumo (5 etapas) |
|-------------------|---------------------------|
| 1. Empresa | - |
| 2. Produto | 1. Produto |
| 3. Dores | 3. Dores |
| 4. Mercado | - |
| 5. Promessa | 4. Promessa |
| 6. Publico (ICPs) | 2. ICPs |
| 7. Revisao | 5. Revisao |

---

## Arquivos a Modificar

| Arquivo | Tipo de Mudanca |
|---------|-----------------|
| `src/components/client/OnboardingX1Section.tsx` | Atualizar array STEPS, logica de progresso e resumo de dados |
| `src/components/onboarding/OnboardingDashboard.tsx` | Atualizar calculo de progresso e exibicao de etapas |

---

## Detalhes Tecnicos

### 1. OnboardingX1Section.tsx

**1.1 Atualizar array STEPS (linhas 41-47)**

```text
// DE (5 etapas):
const STEPS = [
  { name: "Produto", icon: Package },
  { name: "ICPs", icon: Users },
  { name: "Dores", icon: AlertTriangle },
  { name: "Promessa", icon: Target },
  { name: "Revisao", icon: CheckCircle },
];

// PARA (7 etapas):
const STEPS = [
  { name: "Empresa", icon: Building2 },
  { name: "Produto", icon: Package },
  { name: "Dores", icon: Heart },
  { name: "Mercado", icon: TrendingUp },
  { name: "Promessa", icon: Target },
  { name: "Publico", icon: Users },
  { name: "Revisao", icon: CheckCircle },
];
```

**1.2 Adicionar imports de icones faltantes**

Adicionar `Building2`, `TrendingUp` e `Heart` aos imports do lucide-react.

**1.3 Atualizar calculateProgress() (linhas 106-136)**

Nova logica para verificar 7 etapas:

- **Etapa 1 (Empresa)**: Verificar se `clients.niche` esta preenchido
- **Etapa 2 (Produto)**: Verificar `product_name` ou `product_description` no profile
- **Etapa 3 (Dores)**: Verificar `main_pain` no profile (dores gerais do comprador)
- **Etapa 4 (Mercado)**: Verificar `current_revenue` ou `monthly_investment` ou `initial_traffic_investment`
- **Etapa 5 (Promessa)**: Verificar `promise_text` na tabela client_promise
- **Etapa 6 (Publico)**: Verificar se existem ICPs cadastrados
- **Etapa 7 (Revisao)**: Verificar status do cliente (`ppp_completed` ou posterior)

Total sera 7 em vez de 5.

**1.4 Atualizar getCurrentStep() (linhas 138-152)**

Nova logica para retornar a etapa correta baseada nos dados preenchidos, na ordem: Empresa -> Produto -> Dores -> Mercado -> Promessa -> Publico -> Revisao.

**1.5 Atualizar fetchOnboardingData()**

Buscar dados adicionais:
- `niche` da tabela `clients`
- Campos de mercado do `client_profile`: `current_revenue`, `monthly_investment`, `initial_traffic_investment`

**1.6 Atualizar resumo de dados (linhas 287-385)**

Adicionar secoes para:
- **Empresa**: Exibir nicho e regioes
- **Mercado**: Exibir faturamento, investimento e canais de demanda
- Reordenar as secoes existentes na ordem correta

---

### 2. OnboardingDashboard.tsx

**2.1 Atualizar calculo de progresso (linhas 114-147)**

Alterar a logica de `completedSteps` para verificar 7 etapas (mesma logica do OnboardingX1Section).

Sera necessario buscar dados adicionais:
- `niche` da tabela `clients`
- Campos de mercado do `client_profile`

**2.2 Atualizar exibicao de progresso (linha 333)**

Mudar de "X de 5 etapas" para "X de 7 etapas".

**2.3 Corrigir handleContinueOnboarding (linha 294-296)**

Ajustar para redirecionar ate a etapa 7 (em vez de 5):
```typescript
const nextStep = client.completedSteps + 1;
navigate(`/onboarding?client=${client.id}&step=${Math.min(nextStep, 7)}`);
```

---

## Fluxo Externo (Link)

O componente `OnboardingExternal.tsx` ja utiliza o `OnboardingWizard`, entao nao precisa de alteracoes. As mudancas nos componentes de resumo afetarao automaticamente:

- A barra de progresso mostrara 7 etapas
- O botao "Continuar" direcionara para a etapa correta
- O resumo de dados exibira todas as informacoes

---

## Resultado Esperado

1. Card de resumo na pagina de detalhes do cliente exibira "X de 7 etapas"
2. Barra de progresso refletira o preenchimento real de todas as etapas
3. Botao "Continuar Onboarding" direcionara para a etapa correta
4. Resumo de dados mostrara Empresa, Produto, Dores, Mercado, Promessa e Publico
5. Dashboard de onboarding exibira progresso correto para todos os clientes

