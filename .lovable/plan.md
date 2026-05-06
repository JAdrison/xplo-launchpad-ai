## Objetivo

Toda tarefa do CRM passa a ter uma **data de vencimento** (`scheduled_at`). Tarefas criadas automaticamente recebem prazo conforme o checkpoint ou recorrência. Tarefas vencidas não concluídas aparecem em destaque vermelho e ordenadas no topo.

## Prazos definidos

**Checkpoints (a partir de quando o deal entra na coluna):**

| Checkpoint | Prazo |
|---|---|
| 01 Cadastro | 3 dias |
| 02 Início | 5 dias |
| 03 Estratégia | 10 dias |
| 04 Tráfego | 10 dias |
| 05 Entrega | 7 dias |

**Manutenção:** já tem `recurrence_days` — usar como prazo (Instagram 30d → vence em 30 dias, Tráfego 7d → vence em 7 dias, etc.). Hoje a função `seed_maintenance_tasks` já preenche `scheduled_at = now() + days`. Falta apenas exibir corretamente.

## Mudanças

### 1. Banco — preencher `scheduled_at` automaticamente

- Atualizar `seed_xplo_template_tasks(_deal_id, _client_id, _checkpoint)` para calcular `scheduled_at = entered_current_column_at + prazo_do_checkpoint` ao inserir cada tarefa-template.
- Manter `seed_maintenance_tasks` como está (já agenda corretamente).
- Nas tarefas criadas via `apply_column_automations` o `scheduled_at` já é preenchido (`now() + days_after_entry`). Sem alteração.

### 2. Backfill (rodar uma vez)

Para cada tarefa pendente sem `scheduled_at`:
- Se for de checkpoint 01–05 → `scheduled_at = deals.entered_current_column_at + prazo do checkpoint`.
- Se tiver `recurrence_days` → `scheduled_at = activities.created_at + recurrence_days`.
- Tarefas manuais sem data permanecem sem data (não força).

### 3. UI — destaque visual de atraso

**`src/pages/CrmActivities.tsx`** (lista global) e **`src/components/crm/DealDetailModal.tsx`** (dentro do deal):
- Data exibida em **vermelho (`text-destructive`)** quando vencida e pendente.
- Badge **"Atrasada Xd"** (vermelha) ao lado do assunto.
- Dentro de cada agrupamento, ordenar atrasadas no topo e em seguida por `scheduled_at` ascendente.
- Manter o filtro "🔴 Em atraso" que já existe na CrmActivitiesView.

**`src/components/crm/ActivityFormDialog.tsx`**: nenhum ajuste obrigatório (campo "Agendar para" já existe). Renomear o label para **"Vencimento"** para deixar claro que é prazo final.

### 4. Sem alterações em

- Auto-advance entre checkpoints (continua quando todas tarefas concluídas).
- RLS, schema de `activities`.
- Triggers de manutenção e completion.

## Detalhes técnicos

**Migração SQL** (1 migration, sem afetar dados existentes além do backfill):

```sql
-- 1. Helper interno: prazo por checkpoint
CREATE OR REPLACE FUNCTION public.checkpoint_due_days(_chk text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _chk
    WHEN '01' THEN 3
    WHEN '02' THEN 5
    WHEN '03' THEN 10
    WHEN '04' THEN 10
    WHEN '05' THEN 7
    ELSE NULL
  END
$$;

-- 2. Atualizar seed_xplo_template_tasks: incluir scheduled_at no INSERT
--    scheduled_at := COALESCE(d.entered_current_column_at, now()) + checkpoint_due_days(_checkpoint) * interval '1 day'

-- 3. Backfill
UPDATE public.activities a
SET scheduled_at = d.entered_current_column_at + (public.checkpoint_due_days(a.checkpoint_code) || ' days')::interval
FROM public.deals d
WHERE a.deal_id = d.id
  AND a.scheduled_at IS NULL
  AND a.status = 'pending'
  AND a.checkpoint_code IN ('01','02','03','04','05');

UPDATE public.activities
SET scheduled_at = created_at + (recurrence_days || ' days')::interval
WHERE scheduled_at IS NULL
  AND status = 'pending'
  AND recurrence_days IS NOT NULL;
```

**Frontend — helper compartilhado** em `src/lib/crmFormat.ts`:
```ts
export function getDueState(scheduledAt: string | null, status: string) {
  if (!scheduledAt || status === "completed") return { overdue: false, daysLate: 0 };
  const due = new Date(scheduledAt);
  const now = new Date();
  if (due >= now) return { overdue: false, daysLate: 0 };
  const daysLate = Math.floor((now.getTime() - due.getTime()) / 86400000);
  return { overdue: true, daysLate };
}
```
Usar nesse helper em CrmActivities e DealDetailModal para badge "Atrasada Xd" e classe `text-destructive`.

## Arquivos afetados

- **Nova migração SQL** (funções + backfill).
- `src/lib/crmFormat.ts` — adicionar `getDueState`.
- `src/pages/CrmActivities.tsx` — badge vermelho + ordenação.
- `src/components/crm/DealDetailModal.tsx` — badge vermelho + ordenação nas listas de tarefas.
- `src/components/crm/ActivityFormDialog.tsx` — renomear label "Agendar para" → "Vencimento".

## Memória

Atualizar `mem://crm/pipeline-entrega-manutencao.md` com a tabela de prazos por checkpoint e a regra "toda tarefa tem `scheduled_at`; vencida = atraso".
