

## Integrar Configurações do CRM dentro do próprio Kanban

Hoje as configurações vivem em uma rota separada `/crm/config` no menu lateral. Vou trazer tudo para dentro do `/crm` via botões contextuais, deixando a sidebar mais enxuta.

### Mudanças na navegação

- **Remover do menu lateral**: itens "Atividades", "Contatos" e "CRM Config" deixam de ser links de primeiro nível.
- Sidebar fica apenas com **CRM** (que abre o Kanban) — as outras telas viram abas/botões dentro dele.
- Rotas continuam existindo (`/crm/atividades`, `/crm/contatos`, `/crm/config`) para deep-linking, só não aparecem mais no menu.

### Nova barra de ações no topo do `/crm`

Substituo o cabeçalho atual por uma barra com 2 níveis:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  [Kanban] [Atividades] [Contatos]              ⚙ Configurar ▾        │  ← abas + menu config
├──────────────────────────────────────────────────────────────────────┤
│  [Pipeline ▾]  [+ Pipeline] [+ Coluna]  [🔍 Buscar...]  [+ Negócio] │  ← contexto Kanban
└──────────────────────────────────────────────────────────────────────┘
```

**Linha 1 — Abas internas** (`Tabs` shadcn) controlando 3 visões na mesma página:
- **Kanban** (atual)
- **Atividades** (conteúdo de `CrmActivities` embutido)
- **Contatos** (conteúdo de `CrmContacts` embutido)

**Linha 1 (canto direito) — Menu "⚙ Configurar"** (`DropdownMenu`) com 4 opções que abrem **diálogos modais** (não saem da página):
- Pipelines
- Tags
- Campos customizáveis
- Templates de atividade

Cada opção abre um `Dialog` grande com o conteúdo de cada aba que hoje vive em `/crm/config` — reaproveito `PipelinesTab`, `TagsTab`, `FieldsTab`, `TemplatesTab` extraindo-os de `CrmConfig.tsx` para arquivos próprios em `src/components/crm/config/`.

**Linha 2 — Ações do Kanban** (só aparece quando a aba ativa é Kanban):
- **+ Pipeline** (botão direto, abre o mesmo diálogo de criar pipeline)
- **+ Coluna** (novo — hoje não existe; abre diálogo para criar coluna no pipeline ativo)
- Seletor de pipeline, busca, **+ Negócio** (mantidos)

### Diagrama do fluxo

```text
/crm
 ├── Tabs: [Kanban] [Atividades] [Contatos]
 │    └── Kanban → barra de ações + board atual
 │    └── Atividades → componente embutido (era /crm/atividades)
 │    └── Contatos → componente embutido (era /crm/contatos)
 └── Menu "⚙ Configurar"
      ├── Dialog Pipelines  (CRUD pipelines)
      ├── Dialog Tags
      ├── Dialog Campos customizáveis
      └── Dialog Templates de atividade
```

### Detalhes técnicos

**Arquivos editados:**
- `src/pages/CrmKanban.tsx` → vira hospedeiro de tudo: `Tabs` + barra de ações + menu Configurar.
- `src/components/layout/AppSidebar.tsx` → remove os 3 itens (Atividades, Contatos, CRM Config) do array `navigation`.
- `src/pages/CrmActivities.tsx` e `src/pages/CrmContacts.tsx` → exportam o conteúdo como componentes (`<CrmActivitiesView />`, `<CrmContactsView />`) reaproveitáveis. As páginas em si continuam existindo como wrapper para a rota direta funcionar.
- `src/pages/CrmConfig.tsx` → quebrado em 4 arquivos de componente:
  - `src/components/crm/config/PipelinesConfig.tsx`
  - `src/components/crm/config/TagsConfig.tsx`
  - `src/components/crm/config/FieldsConfig.tsx`
  - `src/components/crm/config/TemplatesConfig.tsx`
  - Cada um aceita prop opcional `inDialog?: boolean` para ajustar layout (sem `Card` wrapper quando dentro de Dialog).
- Novo: `src/components/crm/NewColumnDialog.tsx` para o botão **+ Coluna** (cria `pipeline_columns` com `pipeline_id` ativo, `sort_order = columns.length`).

**Estado da página `CrmKanban.tsx`:**
```ts
const [tab, setTab] = useState<"kanban" | "atividades" | "contatos">("kanban");
const [configDialog, setConfigDialog] = useState<null | "pipelines" | "tags" | "fields" | "templates">(null);
const [newColumnOpen, setNewColumnOpen] = useState(false);
const [newPipelineOpen, setNewPipelineOpen] = useState(false);
```

**Sincronização**: ao salvar algo em qualquer Dialog de configuração (ex: criar nova tag, novo pipeline), chamar `refetch()` do Kanban para refletir.

**Deep-link preservado**: usuário que tinha `/crm/atividades` salvo continua abrindo a tela cheia daquela visão (via `CrmActivities.tsx` standalone). Dentro de `/crm`, é só uma aba.

### Memória

- Atualizar `mem://crm/fase3-contatos-config` notando que a navegação foi consolidada dentro de `/crm` via abas + menu de configurações.
- Atualizar `mem://crm/arquitetura-modulo` mencionando o ponto único de entrada.

### Fora do escopo

- Não mexo em RLS, schema ou edge functions — só reorganização de UI.
- Mantenho as rotas antigas funcionando (não quebra links salvos pelo usuário).

