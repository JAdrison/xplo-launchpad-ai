## Contexto

Hoje existem **dois sistemas de automação** rodando em paralelo no CRM, e isso está causando a confusão:

1. **Automações genéricas** (tabela `column_automations`)
   - Criadas pelo botão de raio (⚡) na coluna do Kanban → abre `ColumnAutomationDialog`.
   - Funciona, mas só aparece se a coluna tiver tarefas cadastradas ali. As colunas dos checkpoints XPLO **não usam essa tabela**, por isso aparecem vazias.

2. **Tarefas do processo XPLO** (checkpoints 01–05 + manutenção)
   - Hoje estão **hard-coded** em dois lugares:
     - Frontend: `src/lib/xploProcessTemplate.ts`
     - Banco: função `seed_xplo_template_tasks` (com `VALUES (...)` enorme dentro do SQL)
   - Disparadas pelo trigger `seed_tasks_on_checkpoint_change` quando o deal entra numa coluna com `checkpoint_code` 01–05.
   - **Não há UI** para editá-las. Qualquer mudança hoje exige migração SQL.

O pedido é: poder editar essas tarefas automáticas pela interface, e quando elas forem recriadas (novo deal entrando no checkpoint), virem já com as alterações.

## Solução

### 1. Migrar o template XPLO para uma tabela editável

Criar nova tabela `xplo_task_templates`:

```text
id (uuid)
checkpoint_code   text   -- '01'..'05', '06' (manutenção)
checkpoint_label  text
template_key      text   UNIQUE
subject           text
description       text
required_plan     xplo_plan?    -- null|basic|pro
required_bonus    xplo_bonus?
required_function job_function?
recurrence_days   int?           -- p/ tarefas de manutenção
sort_order        int
is_active         boolean default true
created_at / updated_at
```

- RLS: `SELECT` para todo `has_crm_access`; `INSERT/UPDATE/DELETE` só para `admin`.
- **Migration de seed**: popular a tabela com exatamente as ~46 linhas que hoje estão dentro de `seed_xplo_template_tasks` + as 5 de `start_maintenance_for_deal`/`seed_maintenance_tasks`.

### 2. Reescrever as funções de seed para ler da tabela

- `seed_xplo_template_tasks(_deal_id, _client_id, _checkpoint)`
  → trocar o `FROM (VALUES ...)` por `FROM public.xplo_task_templates WHERE checkpoint_code = _checkpoint AND is_active`.
- `seed_maintenance_tasks` / `start_maintenance_for_deal` → idem para `checkpoint_code = '06'`.
- A regra de filtro por plano/bônus + idempotência (`NOT EXISTS template_key`) continua igual.

Resultado: editar um template na UI passa a valer **na próxima vez** que um deal entrar no checkpoint (tarefas já criadas continuam intactas — preserva trabalho em andamento, igual à regra atual).

### 3. Nova aba "Tarefas automáticas (XPLO)" em `/crm/config`

Em `src/pages/CrmConfig.tsx`, adicionar uma 5ª aba: **"Tarefas automáticas"**.

Componente novo `src/components/crm/config/XploTasksConfig.tsx`:
- Agrupa por `checkpoint_code` (01 Cadastro, 02 Início, …, 06 Manutenção) — accordion.
- Para cada tarefa: assunto, descrição, função responsável, plano (basic/pro/—), bônus (—/GMN/Vitrine IG), `recurrence_days` (só checkpoint 06), botão ativar/desativar e excluir.
- Botão "Adicionar tarefa" por checkpoint.
- Botão "Restaurar padrão XPLO" (re-seed do catálogo original).

### 4. Tornar a aba "Configurações de automação" da coluna mais clara

No `ColumnAutomationDialog`, quando a coluna for um checkpoint XPLO (`checkpoint_code` 01–06), mostrar no topo um aviso:

> "Esta coluna usa o **template XPLO** (checkpoint 03 — Estratégia de posicionamento). Para editar as tarefas que serão criadas automaticamente, vá em **Configurações do CRM → Tarefas automáticas**."

Continua permitindo cadastrar automações genéricas adicionais (que vão para `column_automations` e somam às do template).

### 5. Frontend cleanup

- `src/lib/xploProcessTemplate.ts` deixa de ser fonte da verdade. Vira só os tipos (`XploPlan`, `XploBonus`, `BONUS_LABELS`). A função `tasksForPlan` e o array hardcoded são removidos (nenhum outro lugar usa para criar tarefas — a criação real é via trigger no banco).
- `src/lib/syncDealTasks.ts` passa a chamar uma RPC `sync_deal_tasks_from_template(_deal_id, _client_id)` que faz o mesmo seed lendo da tabela (substitui o `tasksForPlan` no client).

## Detalhes técnicos

- Migração faz `INSERT ... ON CONFLICT (template_key) DO NOTHING` para o seed inicial, então é segura para rodar duas vezes.
- Funções `SECURITY DEFINER` continuam com `SET search_path = public`.
- `xplo_task_templates` recebe trigger `update_updated_at_column`.
- A tabela vira fonte única; o catálogo TS é removido para evitar drift.

## Fora de escopo

- Não mexer no fluxo do `column_automations` (continua existindo para automações genéricas por coluna).
- Não migrar tarefas já criadas em deals existentes — só novas criações usarão os textos atualizados.
