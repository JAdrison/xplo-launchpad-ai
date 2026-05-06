---
name: Pipeline de entrega e manutenção
description: Estrutura do Kanban XPLO com checkpoints 01–05, coluna única de Manutenção com badges de estado e Clientes finalizados
type: feature
---
# Pipeline "Entrega de Serviços"

Colunas (na ordem):
1. **01 Cadastro** (`01`) — prazo 3d
2. **02 Início** (`02`) — prazo 5d
3. **03 Estratégia** (`03`) — prazo 10d
4. **04 Tráfego** (`04`) — prazo 10d
5. **05 Entrega** (`05`) — prazo 7d
6. **Manutenção** (`maint_active`) — coluna única, sem prazo de coluna; estado vem das tarefas
7. **Clientes finalizados** (`finished`)
8. **Ganho** (`won`) / **Perdido** (`lost`)

## Coluna Manutenção — estados dinâmicos por deal
Calculado a partir das `activities` com `checkpoint_code = '06'`:
- ⚪ **Aguardando início** — nenhuma tarefa de manutenção criada. Card mostra hint e o modal exibe botão **"Iniciar manutenção"** que chama RPC `start_maintenance_for_deal(_deal_id)`.
- 🟢 **Em dia** — tem tarefas, nenhuma vencida nem para hoje. Mostra "Próx. em Nd".
- 🟡 **Para hoje** — alguma tarefa pendente vence hoje.
- 🔴 **Atrasado** — alguma tarefa pendente já passou do `scheduled_at`. Mostra "N há Xd".

Cabeçalho da coluna mostra resumo agregado: 🔴 X atrasado · 🟡 Y hoje · 🟢 Z em dia · ⚪ W aguardando.

## Geração das tarefas de manutenção
5 tarefas recorrentes (Instagram 30d, tráfego 7/15/30d, IA 15d) são criadas:
- Automaticamente quando o trigger `seed_maintenance_tasks` detecta entrada em `maint_active` (incluindo o salto automático vindo da etapa 05).
- Manualmente via RPC `start_maintenance_for_deal` quando o usuário clica em "Iniciar manutenção" no modal.

## Migração realizada (2026-05-06)
- Removida a coluna intermediária "Manutenção pendente" (`maint_pending`).
- Trigger `handle_activity_completion` agora envia o deal de `05` direto para `maint_active`.
- Deals que estavam em `maint_pending` foram migrados para `maint_active`.
