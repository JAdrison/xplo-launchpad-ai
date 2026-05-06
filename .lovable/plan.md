
# Pipelines XPLO + Manutenção recorrente

## Objetivo

Reorganizar o CRM em **um único pipeline "Entrega de Serviços"** com colunas que espelham o processo operacional, e adicionar duas colunas de manutenção pós-entrega com tarefas recorrentes que se reagendam automaticamente ao serem concluídas.

## 1. Estrutura final do pipeline

Pipeline único: **Entrega de Serviços** (renomeia o atual). Colunas (em ordem):

```
01 Cadastro → 02 Início → 03 Estratégia → 04 Tráfego → 05 Entrega
  → Manutenção pendente → Manutenção ativa
  → Ganho   → Perdido
```

- Colunas 01–05: cada uma representa um checkpoint do processo. O deal **avança automaticamente** para a próxima coluna quando todas as tarefas daquele checkpoint (que se aplicam ao plano/bônus do cliente) estão concluídas.
- **Manutenção pendente**: deal cai aqui logo após sair de "05 Entrega" (entrega concluída). Significa "cliente entregue, aguardando início do ciclo de manutenção". Equipe move manualmente para "ativa" quando inicia.
- **Manutenção ativa**: ao entrar nesta coluna pela primeira vez, gera as **tarefas recorrentes iniciais** (Instagram, Tráfego, IA-pro). A partir daí, sempre que uma tarefa recorrente é marcada como concluída, a próxima é criada automaticamente com `scheduled_at = now() + intervalo`.
- **Ganho / Perdido**: encerram o deal (mantêm comportamento atual via `column_type`).

## 2. Catálogo de tarefas recorrentes (Manutenção)

Adicionar ao `xploProcessTemplate.ts` um novo bloco `06 Manutenção`, marcado como `recurring: true`:

| Tarefa | Intervalo | Plano |
|---|---|---|
| Programar 30 dias de Instagram (2 vídeos feed + 6 estáticos + 8 stories) | 30 dias | Basic |
| Verificação de resultado de tráfego | 7 dias | Basic |
| Entrega de relatório de resultado (quinzenal) | 15 dias | Basic |
| Trocar campanhas de tráfego | 30 dias | Basic |
| Verificar fechamento, atendimento e Follow Up (IA) | 15 dias | Pro |

A descrição da tarefa de Instagram detalha o conteúdo (Feed: 2 vídeos curtos + 6 estáticos; Stories: 8).

## 3. Recorrência automática

Mecanismo: **trigger no Postgres em `activities`**.

- Novo campo em `activities`: `recurrence_days int` (nullable). Preenchido pelas tarefas recorrentes ao serem criadas.
- Trigger `AFTER UPDATE ON activities`: quando `status` muda para `completed` E `recurrence_days IS NOT NULL` E não existe ainda uma "próxima ocorrência" pendente com mesmo `template_key` e `deal_id`, **insere uma nova activity** clonando subject/description/checkpoint/template_key/recurrence_days, com `scheduled_at = now() + recurrence_days` e `status = 'pending'`.
- Idempotência: a verificação "não existe próxima pendente" evita loop quando o usuário marca/desmarca.

## 4. Avanço automático de coluna 01→05

Trigger `AFTER UPDATE ON activities` (mesma função ou complementar):

- Quando uma activity vai para `completed`, recalcula para o `deal_id` quantas tarefas estão pendentes em cada `checkpoint_code` aplicável ao plano.
- Se o checkpoint da coluna atual do deal está 100% concluído E existe uma coluna seguinte na ordem 01→05, **atualiza `deals.column_id`** para a próxima.
- Não move automaticamente para "Manutenção pendente" → ao concluir "05 Entrega", move para "Manutenção pendente" (essa transição é automática, marca o fim da entrega).
- Não toca em deals que estão em Ganho/Perdido.

Mapeamento coluna ↔ checkpoint: nova coluna `pipeline_columns.checkpoint_code` (text, nullable).

## 5. Migração de dados

Seed/migration que, no pipeline padrão existente:
1. Renomeia para "Entrega de Serviços".
2. Cria as colunas faltantes (01–05, Manutenção pendente, Manutenção ativa) com `checkpoint_code` correto, preservando colunas Ganho/Perdido existentes.
3. Move deals existentes que estão em colunas antigas para "01 Cadastro" (default seguro).
4. Remove colunas antigas órfãs **somente se não tiverem deals** (senão mantém para o usuário decidir).

## 6. Geração inicial das tarefas de Manutenção

No trigger de mudança de coluna (`handle_deal_column_change_after`): quando o deal entra em **Manutenção ativa** pela primeira vez (verifica via `deal_history` se já entrou antes), executa um INSERT do bloco `06 Manutenção` filtrado por plano/bônus do cliente. Datas iniciais escalonadas: cada tarefa começa com `scheduled_at = now() + recurrence_days`.

## 7. UI

- `KanbanColumn`: badge pequeno `01..05` no header da coluna quando tem `checkpoint_code`.
- `DealDetailModal` (aba Negócios): tarefas com `recurrence_days` recebem badge `🔁 a cada Nd` ao lado do título.
- `ClientPipelineBar`: já mostra colunas; passa a mostrar todas as novas (01..05, Manutenção, Ganho, Perdido).

## 8. Não-escopo (fica para depois)

- Pipeline 02 separado (decidido: tudo num pipeline só).
- Notificações/lembretes nas datas das recorrências.
- Dashboard de manutenção.

---

## Detalhes técnicos

### Migration (schema)

```sql
ALTER TABLE pipeline_columns ADD COLUMN checkpoint_code text;
ALTER TABLE activities ADD COLUMN recurrence_days int;

-- trigger de recorrência + auto-advance
CREATE OR REPLACE FUNCTION handle_activity_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_next_col uuid;
  v_curr_chk text;
  v_pending int;
  v_plan xplo_plan;
  v_bonuses xplo_bonus[];
BEGIN
  IF TG_OP='UPDATE' AND NEW.status='completed' AND OLD.status<>'completed' THEN
    -- 1) recorrência
    IF NEW.recurrence_days IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM activities
        WHERE deal_id=NEW.deal_id AND template_key=NEW.template_key
          AND status='pending' AND id<>NEW.id
      ) THEN
        INSERT INTO activities(
          deal_id, client_id, type, subject, description,
          checkpoint_code, checkpoint_label, template_key,
          required_plan, required_bonus, recurrence_days,
          scheduled_at, status, auto_generated
        ) VALUES (
          NEW.deal_id, NEW.client_id, NEW.type, NEW.subject, NEW.description,
          NEW.checkpoint_code, NEW.checkpoint_label, NEW.template_key,
          NEW.required_plan, NEW.required_bonus, NEW.recurrence_days,
          now() + (NEW.recurrence_days || ' days')::interval, 'pending', true
        );
      END IF;
    END IF;

    -- 2) auto-advance coluna 01..05
    SELECT pc.checkpoint_code INTO v_curr_chk
    FROM deals d JOIN pipeline_columns pc ON pc.id=d.column_id
    WHERE d.id=NEW.deal_id;

    IF v_curr_chk IS NOT NULL AND v_curr_chk BETWEEN '01' AND '05' THEN
      SELECT c.xplo_plan, c.xplo_bonuses INTO v_plan, v_bonuses
      FROM clients c JOIN deals d ON d.client_id=c.id WHERE d.id=NEW.deal_id;

      SELECT count(*) INTO v_pending FROM activities
      WHERE deal_id=NEW.deal_id AND checkpoint_code=v_curr_chk
        AND status<>'completed'
        AND (required_plan IS NULL OR required_plan=v_plan OR (required_plan='basic' AND v_plan='pro'))
        AND (required_bonus IS NULL OR required_bonus = ANY(v_bonuses));

      IF v_pending=0 THEN
        SELECT pc.id INTO v_next_col
        FROM pipeline_columns pc
        WHERE pc.pipeline_id=(SELECT pipeline_id FROM deals WHERE id=NEW.deal_id)
          AND pc.checkpoint_code = (
            CASE v_curr_chk
              WHEN '01' THEN '02' WHEN '02' THEN '03'
              WHEN '03' THEN '04' WHEN '04' THEN '05'
              WHEN '05' THEN 'maint_pending' END
          )
        LIMIT 1;
        IF v_next_col IS NOT NULL THEN
          UPDATE deals SET column_id=v_next_col WHERE id=NEW.deal_id;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_activity_completion
AFTER UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION handle_activity_completion();
```

Adicionalmente, estender `handle_deal_column_change_after` para detectar entrada em coluna `checkpoint_code='maint_active'` e seedar as tarefas de manutenção (somente se ainda não existem para aquele deal+template_key).

### Seed de colunas

Migration cria/garante via `INSERT ... ON CONFLICT DO NOTHING` (usando uma `UNIQUE (pipeline_id, checkpoint_code) WHERE checkpoint_code IS NOT NULL`) as 7 colunas no pipeline default.

### Código TS

- `xploProcessTemplate.ts`: adiciona array `MAINTENANCE_TEMPLATE` com `recurrenceDays`.
- `syncDealTasks.ts`: ignora tarefas com `recurrenceDays` (são geradas só ao entrar em manutenção ativa, via trigger).
- `KanbanColumn.tsx`, `DealDetailModal.tsx`: badges visuais (mudança pequena).
- `xplo_bonus` enum / lookup: nada muda.

### Memória a salvar

- `mem://crm/pipeline-entrega-manutencao` — estrutura final, mapeamento checkpoint→coluna, auto-advance e recorrência idempotente.
- Atualizar índice.

