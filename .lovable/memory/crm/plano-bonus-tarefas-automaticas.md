---
name: Plano XPLO + bônus + tarefas automáticas
description: Basic/Pro + bônus por cliente geram tarefas do processo operacional no CRM, agrupadas por checkpoint
type: feature
---

# Plano XPLO e geração automática de tarefas

## Modelo de dados
- `clients.xplo_plan` (enum `xplo_plan`: basic|pro, default basic)
- `clients.xplo_bonuses` (array `xplo_bonus[]`: google_my_business, instagram_showcase)
- `activities` ganhou: `checkpoint_code`, `checkpoint_label`, `required_plan`, `required_bonus`, `template_key`
- Unique index `activities(deal_id, template_key) WHERE template_key IS NOT NULL` garante idempotência

## Catálogo
- `src/lib/xploProcessTemplate.ts` — template universal (Hospedagens), 5 checkpoints (01–05), ~41 tarefas
- Tarefas marcadas com `requiredPlan: "pro"` só entram para plano Pro
- Tarefas com `requiredBonus` só entram se o bônus estiver selecionado

## Sincronização
- `src/lib/syncDealTasks.ts`:
  - `syncDealTasksFromPlan(dealId, clientId, plan, bonuses)` — INSERT idempotente, NUNCA remove tarefas
  - `updateClientPlanAndSync(clientId, plan, bonuses)` — atualiza cliente + sincroniza deal mais recente
- Pontos de chamada: StepRegistration (onboarding) e PlanBadge (popover do selo)

## UI
- `PlanBadge` (`src/components/client/PlanBadge.tsx`) — pill Pro (gradient roxo) ou Basic (outline preto-branco), abre popover para trocar plano/bônus
- Aparece em: header de `/clients/:id` e sidebar do `DealDetailModal` (size sm)
- Aba "Negócios" do modal do deal agrupa tarefas por `checkpoint_code` com contadores e badges Pro/Bônus
- StepRegistration tem bloco com cards de plano (Basic/Pro) + checkboxes de bônus

## Regras
- Trocar Basic→Pro: adiciona apenas tarefas Pro faltantes
- Desmarcar bônus: NÃO remove tarefas já criadas (só não cria novas)
- Tipo da activity: usa "lembrete" (enum existente não tem "task")
