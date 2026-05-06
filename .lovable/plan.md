# Cores de vencimento + filtros de Tarefas

Dois ajustes pequenos no CRM, sem mexer em banco de dados.

## 1. Cores de vencimento nos cards do Kanban (`DealCard`)

Hoje o card só mostra cor na coluna "Manutenção" (badge). Vamos aplicar a mesma lógica verde/amarelo/vermelho do `getDueState` em **todos** os cards, sempre que houver tarefa pendente.

- Buscar a próxima tarefa pendente de cada deal em `useCrm.ts` (estendendo o agregado já feito) e expor `next_pending_at` em `DealWithMeta`.
- No `DealCard`, abaixo do bloco de tarefas (ou ao lado do "Tempo na coluna"), exibir uma linha:
  - `📅 Vence 12/05` colorida com `getDueState(...).textClass` (verde se >3 dias, amarelo ≤3 dias, vermelho atrasada).
  - Se não houver tarefa pendente com data, não exibe nada.
- Na coluna **Manutenção**, manter o badge atual + colorir o texto `Próx. em Xd` com a mesma escala (verde/amarelo) usando `getDueState`. O estado "overdue" continua representado pelo badge vermelho de manutenção.

## 2. Filtros por pessoa/função na tela `/crm/atividades`

A tela já tem as 5 abas que o usuário queria (Em atraso, Hoje, Semana, Próximas, Concluídas). Falta apenas:

- Adicionar um seletor **"Função"** ao lado do filtro de pipeline, populado a partir do enum `job_function` (8 opções: gestor_trafego, designer, copywriter, sdr, vendedor, contato_cliente, gestor_projetos, ia_specialist) com labels amigáveis em português.
- Adicionar um seletor **"Responsável"** ao lado, com:
  - "Todos"
  - "Eu"
  - lista de usuários que possuem alguma função em `user_job_functions` (mostrando a função; o nome do usuário não fica visível para não-admin pois não há `profiles` — exibimos a função como rótulo principal).
- Lógica de filtro:
  - Função: a tarefa entra se `activities.required_function = filtro` **OU** se o `responsible_id` da tarefa estiver entre os usuários com aquela função (consulta única em `user_job_functions`).
  - Responsável: filtra por `activities.responsible_id`.
- Os contadores das abas (counts) passam a respeitar todos os filtros ativos (escopo + pipeline + função + responsável), igual à lógica atual.
- A aba "Minhas/Todas" existente continua, agora redundante com "Responsável = Eu" — mantemos para acesso rápido.

## Detalhes técnicos

- **`src/lib/crmFormat.ts`**: nada muda; reaproveita `getDueState`.
- **`src/hooks/useCrm.ts`**: no loop que monta `counts`/`maint`, capturar também `nextPendingAt` (menor `scheduled_at` das atividades não-concluídas com data); adicionar `next_pending_at: string | null` em `DealWithMeta`.
- **`src/components/crm/DealCard.tsx`**: nova linha condicional usando `getDueState(deal.next_pending_at, "pending")` para colorir; aplicar `textClass` no `Próx. em Xd` da Manuten­ção.
- **`src/pages/CrmActivities.tsx`**:
  - Carregar `user_job_functions` no `fetchAll` (`select user_id, job_function`).
  - Adicionar dois `<Select>` no header (após o pipeline): Função e Responsável.
  - Estender `filtered`/`counts` com checagens de `required_function` e `responsible_id`.

## Fora do escopo

- Não cria/altera tabelas.
- Não mexe em `DealDetailModal` (ele já usa `getDueState` em todas as datas).
- Não cria nova rota — a tela `/crm/atividades` continua sendo "a aba de tarefas".
