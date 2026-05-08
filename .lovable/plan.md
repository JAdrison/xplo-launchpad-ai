## Reordenar tarefas concluídas para o final

No modal de detalhes do deal (`DealDetailModal.tsx`), as tarefas dentro de cada checkpoint hoje são ordenadas por: atrasadas primeiro → demais por data agendada. Isso faz com que tarefas **concluídas** apareçam misturadas no meio (especialmente as concluídas com data antiga viram "atrasadas visualmente" na ordenação).

### Mudança

Ajustar o comparador de ordenação em `src/components/crm/DealDetailModal.tsx` (linha ~390) para que a regra fique:

1. **Não-concluídas sempre antes das concluídas** (status `completed` vai para o fim do grupo).
2. Entre as não-concluídas: atrasadas primeiro, depois por `scheduled_at` ascendente.
3. Entre as concluídas: ordenar por `completed_at` desc (mais recente no topo da subseção concluída) — opcional, ajuda na leitura.

Resultado visual em cada checkpoint:
```text
☐ Tarefa atrasada
☐ Tarefa pendente (vence amanhã)
☐ Tarefa pendente (vence semana que vem)
─────────────
☑ Tarefa concluída (mais recente)
☑ Tarefa concluída (antiga)
```

### Escopo

- **Apenas** o agrupamento por checkpoint dentro do modal do deal.
- A aba "Listar tudo" (`overdue / pending / done`) já está separada por seções, então não precisa mexer.
- A página `/crm/atividades` não está incluída — confirme se também quer aplicar lá.

### Arquivo afetado

- `src/components/crm/DealDetailModal.tsx` (1 ajuste no `.sort()` da linha ~390-396)
