---
name: Pipeline Entrega + Manutenção recorrente
description: Pipeline único com 5 colunas espelhando o processo XPLO + 2 colunas de manutenção. Auto-advance e tarefas recorrentes via triggers.
type: feature
---

## Estrutura

Pipeline único "Entrega de Serviços" com colunas (em ordem) e `pipeline_columns.checkpoint_code`:

| Coluna | code |
|---|---|
| 01 Cadastro | `01` |
| 02 Início | `02` |
| 03 Estratégia | `03` |
| 04 Tráfego | `04` |
| 05 Entrega | `05` |
| Manutenção pendente | `maint_pending` |
| Manutenção ativa | `maint_active` |
| Ganho | `won` |
| Perdido | `lost` |

## Auto-advance (01 → 05 → maint_pending)

Trigger `trg_activity_completion` em `activities`. Quando uma tarefa do checkpoint atual é marcada concluída e **todas** as tarefas aplicáveis ao plano daquele checkpoint estão concluídas, o deal pula para a próxima coluna na ordem. Última coluna 05 → cai em "Manutenção pendente".

## Tarefas recorrentes (Manutenção ativa)

Ao mover um deal para a coluna `maint_active` pela primeira vez, o trigger `trg_seed_maintenance` semeia as 5 tarefas recorrentes (Instagram 30d, Verif. tráfego 7d, Relatório 15d, Troca campanhas 30d, IA 15d — última só Pro), cada uma com `recurrence_days` definido e `scheduled_at = now() + days`.

Quando uma tarefa com `recurrence_days IS NOT NULL` é concluída, o trigger `trg_activity_completion` cria automaticamente a próxima ocorrência (template_key sufixado com epoch para preservar idempotência), com nova data agendada.

## Idempotência

- Tarefas recorrentes só são geradas novamente se **não existir** outra ocorrência pendente do mesmo template_key base no mesmo deal.
- Seed de manutenção checa por `NOT EXISTS` antes de inserir.
- Colunas têm `UNIQUE (pipeline_id, checkpoint_code) WHERE checkpoint_code IS NOT NULL`.

## UI

- `KanbanColumn`: badge `AUTO` no header das colunas 01–05 (avanço automático).
- `DealDetailModal` aba Negócios: tarefas com `recurrence_days` recebem badge `🔁 a cada Nd` em verde.
