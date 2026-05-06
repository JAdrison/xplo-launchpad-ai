## Diagnóstico — por que está confuso hoje

Hoje o Kanban tem **duas colunas separadas** logo após "05 Entrega":

| Coluna atual | Significado original | Problema |
|---|---|---|
| **Manutenção pendente** (`maint_pending`) | Para onde o deal vai automaticamente quando termina a etapa 05. Espera alguém **mover manualmente** para "Manutenção ativa" para começar. | O nome sugere "tem tarefa atrasada", mas é só uma sala de espera. |
| **Manutenção ativa** (`maint_active`) | Quando o deal entra aqui, o sistema **gera automaticamente** as 5 tarefas recorrentes (Instagram 30d, tráfego 7/15/30d, IA 15d). | Confunde com "está ativo agora", mesmo quando não há tarefa pendente. |

Resultado: o usuário não sabe a diferença entre "pendente" (coluna) e "pendente" (status da tarefa), e fica sem entender quando um cliente está em dia, quando tem tarefa atrasada, ou quando a manutenção ainda nem começou.

Você também disse uma regra importante:
> "pode ser manutenção pendente e concluída quando não tiver manutenção para fazer"

Ou seja: o estado "pendente" ou "em dia" deve vir do **status real das tarefas**, não de uma coluna fixa.

---

## Proposta — uma coluna só, com estado dinâmico

Substituir as duas colunas por **uma única coluna chamada "Manutenção"** (entre "05 Entrega" e "Clientes finalizados"). O estado de cada cliente dentro dela é mostrado por um **badge colorido** no card, calculado em tempo real a partir das tarefas:

```text
┌─────────────────────────────┐
│  Manutenção                 │
│  ─────────────────────────  │
│  ⚪ Pousada Mar Azul        │  → Aguardando início
│     Sem tarefas geradas     │
│                             │
│  🟢 Clínica Bem-Estar       │  → Em dia
│     Próx.: 7d (tráfego)     │
│                             │
│  🟡 Hotel Serra              │  → Tem pendência
│     2 tarefas para hoje     │
│                             │
│  🔴 Restaurante X            │  → Atrasado
│     3 atrasadas há 5d       │
└─────────────────────────────┘
```

### Os 4 estados do badge

| Badge | Quando aparece | Cor |
|---|---|---|
| **⚪ Aguardando início** | Cliente acabou de chegar na coluna; nenhuma tarefa de manutenção foi gerada ainda. Botão "Iniciar manutenção" gera as 5 tarefas recorrentes. | Cinza |
| **🟢 Em dia** | Tem tarefas de manutenção, nenhuma vencida, nenhuma para hoje. | Verde |
| **🟡 Para hoje** | Tem tarefa(s) com vencimento hoje, mas nada atrasado. | Amarelo |
| **🔴 Atrasado** | Tem 1+ tarefa com vencimento já passado. Mostra quantas e há quantos dias. | Vermelho |

> **Importante:** "concluída quando não tiver manutenção para fazer" = quando o usuário marca todas como concluídas e ainda não chegou a data da próxima recorrência, o cliente fica **🟢 Em dia** (não some da coluna). Ele só sai dessa coluna se você arrastar para "Clientes finalizados".

### Iniciar a manutenção

Hoje a geração das tarefas só dispara quando alguém move o deal para "Manutenção ativa". Com uma coluna só, a geração passa a acontecer de duas formas:

- **Automático:** quando o deal cai automaticamente nessa coluna ao terminar a etapa 05. As 5 tarefas são criadas na hora.
- **Manual:** se o deal já está na coluna sem tarefas (cliente antigo, ou alguém arrastou), aparece um botão **"Iniciar manutenção"** no card e no modal do deal, que gera as 5 tarefas.

### Resumo lateral no topo da coluna

No cabeçalho da coluna, um pequeno resumo:
```
Manutenção (12)
🔴 2 atrasados • 🟡 1 hoje • 🟢 8 em dia • ⚪ 1 aguardando
```

---

## O que muda em cada lugar

### Banco de dados
- **Renomear** a coluna `maint_active` para apenas `Manutenção` (mantém `checkpoint_code = 'maint_active'` internamente para não quebrar triggers e tarefas já criadas — só muda o **nome visível**).
- **Remover** a coluna `Manutenção pendente` (`maint_pending`). Deals que estiverem nela hoje são movidos para `maint_active`.
- **Ajustar** o trigger `handle_activity_completion` (que hoje manda etapa 05 → `maint_pending`) para mandar direto para `maint_active`.
- **Ajustar** o trigger `seed_maintenance_tasks` para também ser chamado quando o deal já está em `maint_active` mas ainda não tem tarefas (suporta o botão manual "Iniciar manutenção").

### Frontend
- `KanbanColumn` / `DealCard` (`src/components/crm/`): calcular o estado do deal a partir das `activities` com `checkpoint_code = '06'` e renderizar o badge colorido + linha de status.
- Cabeçalho da coluna "Manutenção": mostrar o resumo agregado.
- `DealDetailModal`: botão "Iniciar manutenção" quando o deal está na coluna mas sem tarefas geradas.
- Atualizar memória `mem://crm/pipeline-entrega-manutencao` para refletir a nova estrutura.

### O que **não** muda
- Tarefas já existentes continuam funcionando (template_key, recurrence_days, prazos atuais).
- Lógica de tarefas atrasadas (badge vermelho na lista) já implementada continua valendo.
- Colunas "Clientes finalizados", "Ganho", "Perdido" não mexem.

---

## Pergunta antes de executar

Você concorda com a proposta de **fundir as duas colunas em uma única "Manutenção"** com badges dinâmicos por estado? Ou prefere manter duas colunas mas só **renomear** para nomes mais claros (ex.: "Aguardando manutenção" e "Em manutenção")?

Se aprovar a fusão, sigo com o plano acima. Se preferir só renomear, ajusto o plano para uma versão mais leve (só muda nomes + textos de ajuda, sem mexer em triggers).
