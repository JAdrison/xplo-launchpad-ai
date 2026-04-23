

# CRM de Projetos em Execução — Kanban + Cadência de Tarefas

Vou trazer para o XPLO Starter um módulo CRM completo com Kanban customizável, integrado aos clientes que já existem do onboarding. Cada cliente vira automaticamente um card de negócio (`deal`) que pode ser movido entre colunas, com cadência de tarefas, histórico, notas e automações por coluna.

Como é um escopo grande, proponho dividir em **3 fases entregáveis** (cada uma já funcional sozinha). Você aprova fase por fase.

---

## Fase 1 — Kanban funcional + Detalhe do Cliente (entrega base)

O essencial para já operar: pipeline visual, drag-and-drop, modal completo do cliente.

### Tela 1 — `/crm` (Kanban)
- Topo: **seletor de pipeline** (dropdown), **+ Pipeline**, busca por nome, **+ Coluna**.
- Colunas com: título + cor lateral, total R$, contagem, **+ Negócio**, menu (editar/excluir/automações).
- Cards: avatar do cliente, nome, valor R$, tag colorida, "Xd na coluna", barra de progresso de tarefas (ex: 2/9), ícones rápidos (mensagem, ligação, anexo).
- **Drag-and-drop** entre colunas usando `@dnd-kit` (já compatível com o stack).
- Ao mover: atualiza `column_id`, registra evento em `deal_history`, dispara automações da coluna destino.

### Tela 2 — Modal de Detalhe do Cliente (4 abas)
Abre ao clicar no card. Sidebar fixa à esquerda + abas à direita.

- **Sidebar**: avatar, nome, telefone, tags com `+`, pipeline/etapa/valor/responsável/status, botões "Cliente Fechado"/"Cancelado", campos do negócio, informações (telefone, empresa, faturamento — vindos de `client_profile`), **botão "Ver Onboarding completo"** (link para `/clients/:id`).
- **Aba Negócios**: pipeline horizontal com etapas (etapa atual em roxo), seletor de funil se houver múltiplos deals, lista de tarefas da etapa atual com checkbox.
- **Aba Atividades**: 3 grupos colapsáveis — 🔴 Em atraso / 🟠 Pendentes / 🟣 Concluídas. Botão **+ Criar atividade** abre diálogo (tipo, responsável, assunto, agendamento, duração, anexos, descrição rich-text).
- **Aba Histórico**: timeline filtrável por tipo (Tag, Transferência de Etapa, Atividade, Nota, etc.) com data + "há X dias".
- **Aba Notas**: input com anexo + lista de notas (autor, conteúdo, data).

### Diagrama da Fase 1

```text
┌─ Sidebar XPLO ─┐  ┌──────────── /crm ────────────────────────────────┐
│ Início         │  │ [Pipeline ▾] [+Pipeline] [Buscar] ... [+Coluna] │
│ Clientes       │  ├────────────┬────────────┬────────────┬──────────┤
│ ▸ CRM          │  │ Onboarding │ Negociação │ Contrato   │ Rodando  │
│   • Pipelines  │  │ R$ 0       │ R$ 1.750   │ R$ 3.100   │ R$ 6.100 │
│   • Atividades │  │ 0 negócios │ 1 negócio  │ 2 negócios │ 5        │
│   • Contatos   │  │            │ ┌────────┐ │ ┌────────┐ │          │
│   • Config     │  │            │ │ 👤 Zé  │ │ │ Casa.. │ │          │
│ Onboarding     │  │            │ │ R$1750 │ │ │ R$1500 │ │          │
└────────────────┘  │            │ │ 2/9 ⏱5d│ │ │ 0/4 ⏱3d│ │          │
                    │            │ └────────┘ │ └────────┘ │          │
                    └────────────┴────────────┴────────────┴──────────┘
```

---

## Fase 2 — Automação de Tarefas por Coluna + Visão Geral de Atividades

- **Configurar coluna** ganha toggle "Automação ativa" + lista de templates (`column_automations`): tipo, assunto, descrição, "X dias depois", duração, responsável padrão.
- Ao mover card para coluna automatizada → cria `activities` em massa (`auto_generated: true`).
- Tela `/crm/atividades`: lista global filtrável (Meu/Todos, Em atraso/Hoje/Semana, por pipeline/etapa/tag).

---

## Fase 3 — Contatos + Configurações + Tags + Campos customizáveis

- `/crm/contatos`: tabela com Nome/Telefone/E-mail/Tags/Pipeline/Etapa/Valor/Última atividade, busca, filtros, exportar/importar CSV.
- `/crm/config`: gerenciar pipelines, colunas, tags coloridas, campos customizáveis (texto/número/select/data), responsáveis (já temos `user_roles`), templates de atividade.

---

## Detalhes técnicos

### Novas tabelas (Lovable Cloud, com RLS por papel)

| Tabela | Função |
|---|---|
| `pipelines` | id, name, description, color, sort_order |
| `pipeline_columns` | id, pipeline_id (FK), name, color, sort_order, column_type (`normal`/`won`/`lost`), automation_enabled |
| `column_automations` | id, column_id (FK), activity_type, subject, description, days_after_entry, default_duration_minutes, default_responsible_id, sort_order |
| `deals` | id, client_id (FK→`clients`), pipeline_id, column_id, name, value_cents (int), status (`active`/`won`/`lost`), responsible_id, entered_current_column_at, closed_at, closed_reason, custom_fields jsonb |
| `deal_tags` | deal_id, tag_id (M:N) |
| `tags` | id, name, color, pipeline_id (nullable) |
| `activities` | id, deal_id, client_id, type, subject, description, scheduled_at, duration_minutes, responsible_id, status, completed_at, attachments jsonb, auto_generated, source_automation_id |
| `notes` | id, deal_id, author_id, content, attachments jsonb, created_at |
| `deal_history` | id, deal_id, event_type, event_data jsonb, actor_id, created_at |
| `custom_fields` | id, entity_type (`deal`/`client`), name, field_type, options jsonb, required |
| `activity_templates` | id, name, type, default_subject, default_description, default_duration_minutes |

**RLS**: política `authenticated` com `has_role(auth.uid(), 'admin' OR 'user')` (sem mais "public read" — endurecemos junto com o módulo novo, restrito a apenas as novas tabelas para não quebrar o resto).

**Trigger Postgres**: `after update of column_id on deals` → insere em `deal_history` (event `moved`) e chama função `apply_column_automations(deal_id, column_id)` que materializa as `activities` automáticas com `scheduled_at = now() + days_after_entry`.

### Frontend

- **Roteamento**: novas rotas `/crm`, `/crm/atividades`, `/crm/contatos`, `/crm/config` em `src/App.tsx`.
- **Sidebar**: novo grupo "CRM" em `src/components/layout/AppSidebar.tsx` com 4 sub-itens.
- **Componentes novos** em `src/components/crm/`:
  - `KanbanBoard.tsx` (DnD com `@dnd-kit/core` + `@dnd-kit/sortable`)
  - `KanbanColumn.tsx`, `DealCard.tsx`
  - `DealDetailModal.tsx` (sidebar + Tabs do shadcn)
  - `tabs/DealNegociosTab.tsx`, `DealAtividadesTab.tsx`, `DealHistoricoTab.tsx`, `DealNotasTab.tsx`
  - `ActivityFormDialog.tsx` (rich-text usando `@/components/ui/text-editor` que já existe)
  - `ColumnAutomationDialog.tsx` (Fase 2)
  - `PipelineConfigPage.tsx` (Fase 3)
- **Integração com onboarding**: em `ClientDetails.tsx`, botão "Abrir no CRM" que faz `navigate('/crm?deal=' + dealId)` ou cria deal se não existir.
- **Cálculo "Xd na coluna"**: `formatDistanceToNow(entered_current_column_at, { locale: ptBR })`.
- **Realtime**: ativar `supabase_realtime` para `deals` e `activities` para refletir movimentações de outros usuários ao vivo.

### Memória registrada
- `mem://crm/arquitetura-modulo` — pipelines, colunas, deals, automação, tabelas, RLS endurecida.
- `mem://crm/integracao-onboarding` — cliente do onboarding vira deal; acesso bidirecional.
- Atualização do `mem://index.md` com 2 novas referências.

### Fora do escopo desta entrega
- E-mail real disparado por atividade tipo "mensagem" (apenas registra, não envia).
- Importação/exportação CSV de contatos (entra na Fase 3 como botão funcional simples).
- Permissões granulares por pipeline (todo authenticated com role ≠ pending vê tudo nesta versão).

---

## O que vai acontecer ao aprovar

Vou começar pela **Fase 1** (migração das tabelas + Kanban + modal completo). Após você ver funcionando, sigo para Fases 2 e 3.

Me confirme se posso seguir pela Fase 1 ou se prefere ajustar o escopo (ex: começar pela aba de Atividades primeiro, mudar nomes de colunas iniciais default, etc.).

