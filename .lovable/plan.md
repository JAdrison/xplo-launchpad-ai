
# Atualizar Página de Onboarding para 7 Etapas

## Problema Identificado

A página `src/pages/Onboarding.tsx` possui sua própria implementação de onboarding com 6 etapas antigas, completamente diferente do `OnboardingWizard.tsx` que já tem as 7 etapas corretas.

### Comparativo

| Página Atual (6 etapas) | Estrutura Correta (7 etapas) |
|-------------------------|------------------------------|
| 1. Produto | 1. Empresa |
| 2. ICPs | 2. Produto |
| 3. Dores | 3. Dores |
| 4. Promessa | 4. Mercado |
| 5. Revisão | 5. Promessa |
| 6. Oferta | 6. Público (ICPs) |
| - | 7. Revisão |

---

## Solução Proposta

Refatorar a página `src/pages/Onboarding.tsx` para utilizar o `OnboardingWizard.tsx` que já está implementado corretamente, em vez de manter duas implementações paralelas.

---

## Alteracoes Tecnicas

### Arquivo: src/pages/Onboarding.tsx

**Opcao A - Substituir pela reutilizacao do OnboardingWizard (Recomendado)**

1. Quando `clientId` estiver presente, renderizar o `OnboardingWizard` em vez de todo o codigo duplicado
2. Manter o `OnboardingDashboard` para quando nao houver cliente selecionado
3. Remover as definicoes duplicadas de STEPS, FormData, e todos os componentes internos de step

O codigo ficaria assim:
```text
// Sem cliente: mostrar dashboard
if (!clientId) {
  return <OnboardingDashboard />;
}

// Com cliente: usar wizard
return <OnboardingWizard clientId={clientId} />;
```

**Beneficios:**
- Elimina codigo duplicado (o arquivo tem 1274 linhas!)
- Garante consistencia entre todos os fluxos
- Futuras mudancas so precisam ser feitas em um lugar

**Opcao B - Atualizar a pagina existente manualmente**

Se preferir manter a estrutura atual, sera necessario:
1. Atualizar array STEPS para 7 etapas
2. Adicionar novos campos de Empresa e Mercado ao FormData
3. Criar novos componentes StepEmpresa e StepMercado
4. Reordenar todos os steps
5. Ajustar toda logica de salvamento
6. Atualizar navegacao e progresso

Esta opcao exige mudancas extensivas (~500+ linhas).

---

## Recomendacao

**Opcao A** e fortemente recomendada porque:
- O `OnboardingWizard` ja esta funcionando corretamente
- Evita manutencao de codigo duplicado
- Reduz drasticamente o tamanho do arquivo
- Garante consistencia entre fluxo interno e externo

---

## Arquivo a Modificar

| Arquivo | Tipo de Mudanca |
|---------|-----------------|
| `src/pages/Onboarding.tsx` | Refatorar para usar OnboardingWizard quando clientId presente |

---

## Resultado Esperado

1. Pagina de Onboarding mostrara "Etapa X de 7" corretamente
2. Nova sequencia: Empresa → Produto → Dores → Mercado → Promessa → Publico → Revisao
3. Consistencia total entre onboarding interno e externo
4. Codigo mais limpo e facil de manter
