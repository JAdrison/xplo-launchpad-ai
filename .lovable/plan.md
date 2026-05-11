Ajustes no `DealDetailModal` e `ActivityFormDialog` para resolver os 6 pontos reportados.

## 1. Sidebar fixa no modal do deal

**Arquivo:** `src/components/crm/DealDetailModal.tsx`

Hoje o `DialogContent` usa `overflow-hidden` mas, em telas menores ou com sumário longo, o conteúdo do lado esquerdo acompanha o scroll do lado direito (porque o grid `h-[85vh]` empurra para fora). Vou:

- Garantir que a coluna esquerda tenha `h-full overflow-y-auto sticky top-0` independente.
- Manter a coluna direita como o único container que rola junto com as tabs.
- Ajustar o grid para `min-h-0` nas colunas (necessário em flex/grid para permitir scroll interno sem propagar).

## 2. Campo "Ano" limitado a 4 dígitos

**Arquivo:** `src/components/crm/ActivityFormDialog.tsx`

O input `datetime-local` nativo aceita até 6 dígitos no ano. Vou adicionar:
- `min="2000-01-01T00:00"` e `max="2099-12-31T23:59"` no input de Vencimento, o que força o navegador a limitar a 4 dígitos.
- Validação no `submit()` rejeitando datas fora do intervalo razoável (ex.: ano > 2100).

## 3. Unificar tabs "Negócios" e "Atividades"

**Arquivo:** `src/components/crm/DealDetailModal.tsx`

Hoje a tab **Negócios** mostra os checkpoints do processo XPLO + tarefas, e **Atividades** mostra as mesmas tarefas agrupadas por status (atraso/pendentes/concluídas) — duplicando informação.

Plano:
- Remover a tab **Atividades**.
- Renomear **Negócios** para **Tarefas & Checkpoints** (ou manter "Negócios" se preferir).
- Adicionar no topo da tab atual um resumo compacto: 🔴 X em atraso · 🟠 Y pendentes · 🟣 Z concluídas (clicáveis para filtrar).
- Botão **"Criar atividade"** (que vivia em Atividades) sobe para o cabeçalho da tab unificada.

## 4. Checkpoints concluídos vão para o fim

**Arquivo:** `src/components/crm/DealDetailModal.tsx` (linha ~375)

Hoje os grupos são ordenados só por `code.localeCompare`. Vou trocar a ordenação para:

1. Grupos com tarefas pendentes/atrasadas primeiro (ordenados por código asc).
2. Grupos 100% concluídos no fim (ordenados por código asc entre si).

Critério: `done === total` → vai para o final.

## 5. Mostrar última data de conclusão em tarefas recorrentes

**Arquivo:** `src/components/crm/DealDetailModal.tsx`

Para tarefas com `recurrence_days` (ex: "Programar 30 dias de Instagram"), além de "Vence em DD/MM", mostrar logo abaixo:

> Última conclusão: DD/MM/YYYY

Fonte: precisa do histórico de conclusões. Hoje `activities` armazena só o `completed_at` da instância atual. Como tarefas recorrentes são reabertas (status volta para pending), o `completed_at` é zerado.

Solução: consultar `deal_history` para `event_type = 'activity_completed'` filtrando por `event_data.activity_id = a.id` e pegando o `created_at` mais recente. Já temos `history` carregado no modal — basta indexar por `activity_id` e exibir.

## 6. Responsável = pessoas reais, não funções

**Arquivo:** `src/components/crm/ActivityFormDialog.tsx`

Hoje o campo "Função responsável" lista `JOB_FUNCTIONS` (Designer, Copywriter, etc.). O usuário quer atribuir a **pessoas ativas da plataforma**.

Plano:
- Manter o campo `required_function` como está (já é usado em filtros e cores), mas **renomear o label** para "Função (opcional)".
- Adicionar **novo campo "Responsável"** que lista usuários da plataforma:
  - Buscar via edge function `get-user-emails` ou query a `profiles` (verificar qual está disponível com RLS).
  - Salvar em `activities.responsible_id` (coluna já existe no schema).
  - Default: usuário logado.
- O Select mostra nome (ou email) de cada usuário aprovado/ativo.

**Observação:** preciso confirmar se há tabela `profiles` com lista de usuários ativos acessível via RLS, ou se devo usar a edge function `get-user-emails` para listar todos. Vou inspecionar antes de implementar.

## Arquivos tocados

- `src/components/crm/DealDetailModal.tsx` (itens 1, 3, 4, 5)
- `src/components/crm/ActivityFormDialog.tsx` (itens 2, 6)
- Possível pequena edge function update ou novo helper para listar usuários ativos (item 6)

Sem mudanças de schema do banco.
