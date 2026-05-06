---
name: Prazos automáticos das tarefas CRM
description: Toda tarefa do CRM tem scheduled_at; checkpoints 01-05 usam prazo fixo, manutenção usa recurrence_days. Atrasadas exibidas em vermelho com badge.
type: feature
---

## Prazos por checkpoint (calculado a partir de `deals.entered_current_column_at`)

| Checkpoint | Prazo |
|---|---|
| 01 Cadastro | 3 dias |
| 02 Início | 5 dias |
| 03 Estratégia | 10 dias |
| 04 Tráfego | 10 dias |
| 05 Entrega | 7 dias |

Implementado em `public.checkpoint_due_days(text)` e usado dentro de `seed_xplo_template_tasks` ao inserir cada template.

## Manutenção

Tarefas recorrentes usam `recurrence_days` como prazo (Instagram 30d, Tráfego 7/15/30d, IA 15d). Já era o comportamento — agora é exibido como "Vence em DD/MM" e atrasos viram badge.

## UI

- Helper `getDueState(scheduledAt, status)` em `src/lib/crmFormat.ts` retorna `{ overdue, daysLate }`.
- Tarefas atrasadas: borda/fundo `destructive/40`, data em `text-destructive` em negrito, badge `Atrasada Xd`.
- Ordenação: atrasadas no topo, depois `scheduled_at` ascendente.
- `ActivityFormDialog` usa label "Vencimento" no campo datetime-local.

## Backfill

Aplicado em uma única migração para tarefas pendentes existentes:
- Checkpoint 01–05 sem data → `entered_current_column_at + prazo`.
- Tarefas com `recurrence_days` → `created_at + recurrence_days`.
