## Objetivo

Adicionar uma **barra de pipeline** no topo da página `/clients/:id` (acima do nome do cliente — entre o header com "← TESTE / Hospedagem" e o card "Informações do Cliente") que mostra **em qual coluna o lead está** no CRM e permite **movê-lo** clicando em qualquer etapa. O visual deve combinar com a identidade da plataforma (light, primário `#8B5CF6`, cantos arredondados, bordas suaves).

## Componente novo: `ClientPipelineBar`

Arquivo: `src/components/client/ClientPipelineBar.tsx`

Props: `clientId: string`

Comportamento:

1. Busca o **deal ativo** do cliente:
   ```
   supabase.from("deals")
     .select("id, pipeline_id, column_id, status")
     .eq("client_id", clientId)
     .order("created_at", { ascending: false })
     .limit(1)
   ```
   (Existe trigger `auto_create_deal_for_client` — todo cliente já tem um deal.)

2. Busca pipeline + colunas:
   - `pipelines` (nome do pipeline para exibir como rótulo discreto à esquerda)
   - `pipeline_columns` filtrando por `pipeline_id`, ordenado por `sort_order`

3. Renderiza um **stepper horizontal**:

```text
Pipeline Principal:  [Novo] ─ [Qualificação] ─ ●Proposta ─ [Negociação] ─ [Ganho]
```

   - Cada etapa é um "chip" clicável.
   - Etapa atual: fundo na cor da coluna (`column.color`, fallback `#8B5CF6`), texto branco, `ring-2 ring-primary/20`, com `CheckCircle2` se for tipo `won` ou check.
   - Etapas anteriores (sort_order < atual): fundo `bg-primary/10`, texto `text-primary`, conector preenchido com `bg-primary`.
   - Etapas posteriores: fundo `bg-muted`, texto `text-muted-foreground`, conector `bg-border`.
   - Conectores: linha fina (`h-0.5`) entre os chips.
   - Mobile (`< sm`): scroll horizontal (`overflow-x-auto`) preservando os chips lado a lado.

4. Ao clicar em uma etapa:
   - Otimista: atualiza UI imediatamente.
   - `supabase.from("deals").update({ column_id: newColumnId }).eq("id", deal.id)` — os triggers `handle_deal_column_change_*` cuidam de status (won/lost), `entered_current_column_at`, `deal_history` e automações.
   - Toast de sucesso/erro (já segue padrão do projeto).

5. Estado vazio:
   - Se não houver deal: card discreto com link "Configurar pipeline" → `/crm`.
   - Loading: skeleton fino do mesmo height da barra.

6. **Realtime** (opcional, leve): assina `postgres_changes` em `deals` filtrando pelo `id` do deal para refletir mudanças feitas em outros lugares (ex.: Kanban).

## Integração em `src/pages/ClientDetails.tsx`

- Importar `ClientPipelineBar`.
- Renderizar **logo após** o bloco do header (linha onde fecha o `<div>` com nome + nicho), **antes** do `Card` "Informações do Cliente":

```tsx
<ClientPipelineBar clientId={client.id} />
```

Não modifica nenhum outro card existente.

## Detalhes visuais (design system)

- Container: `Card` shadcn com `p-4 sm:p-5`, `rounded-xl`, `border-border/60`.
- Título pequeno acima: `Pipeline · {pipeline.name}` em `text-xs uppercase tracking-wide text-muted-foreground`.
- Chips: `px-3 py-1.5 rounded-full text-xs font-medium transition-all` com hover sutil (`hover:scale-[1.02]`).
- Acessibilidade: cada chip é `<button>` com `aria-current="step"` na atual e `aria-label="Mover para {nome}"`.

## Resumo visual

```text
┌─────────────────────────────────────────────────────────────┐
│ PIPELINE · Pipeline Principal                                │
│                                                              │
│  ✓Novo ─── ✓Qualif. ─── ●Proposta ─── Negoc. ─── Ganho      │
│                          (atual)                             │
└─────────────────────────────────────────────────────────────┘

[Card "Informações do Cliente"]
[Card "Acesso XPLO LAB"]
...
```

## Memória do projeto

Criar `mem://crm/pipeline-bar-cliente` documentando: barra de pipeline em `/clients/:id`, lê deal ativo do cliente, click move via update direto em `deals.column_id` (triggers cuidam do resto), sincroniza com Kanban via realtime.
