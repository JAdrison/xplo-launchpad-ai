## Problema

Na tarefa "Cobrar verba de tráfego" o card mostra **"Vence em 11/05/2026"**, mas:
- O dia configurado é **15** (vencimento real 15/05)
- O `scheduled_at` no banco é `2026-05-12 00:00:00+00` (correto: 3 dias antes do dia 15)
- Renderizado no fuso de Brasília (UTC−3), `2026-05-12 00:00 UTC` vira **11/05/2026 21:00** → exibe 11/05

São dois problemas combinados:

1. **Bug de fuso horário**: as funções SQL salvam `scheduled_at` como meia-noite UTC, então qualquer data "redondinha" volta um dia no fuso BRT.
2. **Rótulo enganoso**: "Vence em" mostra o `scheduled_at` (data de **agendamento da cobrança**, com a antecedência aplicada), não o **vencimento real** da verba.

## Correção

### 1. Backend (SQL) — datas em fuso de Brasília

Em `sync_traffic_payment_task` e `handle_traffic_payment_completion`, trocar:

```sql
v_scheduled := (v_due - (v_lead || ' days')::interval)::timestamptz;
```

por

```sql
v_scheduled := ((v_due - (v_lead || ' days')::interval)::timestamp
                AT TIME ZONE 'America/Sao_Paulo');
```

Isso ancora o horário em meia-noite de Brasília → não desloca o dia ao renderizar.

### 2. Frontend — rótulo correto para a tarefa de tráfego

Em `src/components/crm/DealDetailModal.tsx` (linha ~496), trocar o rótulo quando for tarefa `traffic_payment`:

- **Tarefas normais**: continuam exibindo "Vence em {scheduled_at}".
- **Tarefas `traffic_payment_*`**: extrair o vencimento real do `subject` (`— vence 15/05`) e exibir:
  - `Cobrar até {scheduled_at}` (data da ação)
  - `Vencimento da verba: {due}` (data real)

Resultado esperado para o caso atual:
- "Cobrar até 12/05/2026"
- "Vencimento da verba: 15/05"

### 3. Migrar tarefa já existente

Reagendar a tarefa pendente atual (`6564d3bb-…`) chamando `sync_traffic_payment_task` para o cliente, ou um UPDATE direto ajustando `scheduled_at` para `2026-05-12 03:00:00+00` (≈ meia-noite BRT).

## Detalhes técnicos

- `next_payment_due_date` continua igual; o ajuste é só no cast final para `timestamptz`.
- Não muda schema, só corpo de duas funções `SECURITY DEFINER`.
- O parser do subject (`— vence DD/MM`) já é estável (formato fixo definido pelas próprias funções).
