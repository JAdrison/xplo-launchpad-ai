
# Plano e bônus do cliente → checkpoints + tarefas automáticas

## Objetivo

Permitir escolher **Plano (Basic/Pro)** e **Bônus (Google Meu Negócio, Vitrine Instagram)** de cada cliente, e gerar automaticamente as tarefas do processo operacional XPLO, organizadas em **checkpoints (01 Cadastro → 05 Entrega)**, dentro do card do CRM.

## 1. Onde a escolha aparece

### a) Onboarding (passo de cadastro)
- Adicionar bloco "Plano XPLO" no `StepRegistration.tsx` com:
  - Radio: **Basic** / **Pro**
  - Tooltip/descrição:
    - Basic: Estratégia de demanda, tráfego, site, Instagram
    - Pro: Tudo do Basic + CRM + Inteligência Artificial
  - Checkboxes de bônus: **Google Meu Negócio**, **Vitrine Instagram**
- Ao salvar o cliente, persiste a escolha.

### b) Card do cliente (`/clients/:id`) — selo
- Selo no topo, em formato de pill/botão (sem ação), ao lado do nome:
  - **Pro** → preenchido com gradient roxo (primary)
  - **Basic** → outline preto-e-branco
- Ao lado, badges menores dos bônus ativos.
- Clicando no selo abre um popover para **trocar plano/bônus** (admin/equipe).

### c) Modal do deal no CRM (informativo)
- Mesmo selo aparece na sidebar do `DealDetailModal`, abaixo do nome do cliente.

## 2. Checkpoints visuais nas tarefas

Na aba **Negócios** do `DealDetailModal` (e em `/crm/atividades`), as tarefas auto-geradas ficam agrupadas por checkpoint:

```
▸ 01 Cadastro do cliente            (3/8 concluídas)
   ☐ Criar grupo no WhatsApp
   ☐ Enviar mensagem inicial
   …
▸ 02 Início do projeto              (0/5)
▸ 03 Estratégia de posicionamento   (0/14)
▸ 04 Configuração de tráfego        (0/12)
▸ 05 Entrega de resultado           (0/7)
```

- Cada grupo é colapsável, mostra contador e barra de progresso.
- Tarefas Pro recebem badge `PRO` roxo.
- Tarefas de bônus recebem badge `Bônus`.

## 3. Geração automática

Ao definir/atualizar plano + bônus do cliente, o sistema:
1. Carrega o catálogo de tarefas do template universal (Basic + extras Pro + extras de bônus).
2. Calcula quais devem existir para a combinação escolhida.
3. **Insere apenas as que faltam** (compara por `checkpoint + subject`). Nunca remove nem duplica. Concluídas são preservadas.
4. Trocar Basic → Pro adiciona as tarefas Pro faltantes; desmarcar bônus mantém o que já existe.

Botão manual **"Sincronizar tarefas do plano"** no popover do selo, para regerar sob demanda.

## 4. Catálogo (template universal — Hospedagens por enquanto)

Baseado nos PDFs:
- **01 Cadastro** (8 tarefas Basic)
- **02 Início** (4 Basic + 1 Pro: Onboarding I.A)
- **03 Estratégia** (14 Basic)
- **04 Tráfego** (10 Basic + 2 Pro: Configurar CRM, Conectar WhatsApp ao CRM)
- **05 Entrega** (4 Basic + 2 bônus: Google Meu Negócio, Vitrine Instagram + 1 Pro: Configurar I.A SDR)

Total: ~41 tarefas (varia conforme plano/bônus).

---

## Detalhes técnicos

### Banco

Migration:
```sql
-- enums
CREATE TYPE xplo_plan AS ENUM ('basic','pro');
CREATE TYPE xplo_bonus AS ENUM ('google_my_business','instagram_showcase');

-- clients: novos campos
ALTER TABLE clients
  ADD COLUMN xplo_plan xplo_plan DEFAULT 'basic',
  ADD COLUMN xplo_bonuses xplo_bonus[] DEFAULT ARRAY[]::xplo_bonus[];

-- activities: campos para checkpoint e origem
ALTER TABLE activities
  ADD COLUMN checkpoint_code text,    -- '01'..'05'
  ADD COLUMN checkpoint_label text,   -- 'Cadastro do cliente'
  ADD COLUMN required_plan xplo_plan, -- nulo = Basic (vale para todos)
  ADD COLUMN required_bonus xplo_bonus, -- nulo = não é bônus
  ADD COLUMN template_key text;       -- chave única p/ idempotência

CREATE UNIQUE INDEX activities_deal_template_unique
  ON activities(deal_id, template_key) WHERE template_key IS NOT NULL;
```

Sem alterar tabelas Supabase reservadas. RLS já existente em `activities` e `clients` cobre os novos campos.

### Catálogo em código

`src/lib/xploProcessTemplate.ts`:
```ts
export const XPLO_TEMPLATE = [
  { code: '01', label: 'Cadastro do cliente', tasks: [
    { key: 'cad_grupo_wa', subject: 'Criar grupo no WhatsApp', description: '...', type: 'task' },
    // ...
  ]},
  { code: '02', label: 'Início do projeto', tasks: [
    // ...
    { key: 'ini_onboarding_ia', subject: 'Onboarding I.A', requiredPlan: 'pro' },
  ]},
  // 03, 04 (com Pro: configurar CRM, conectar WhatsApp CRM), 05 (com bônus + Pro)
];
```

### Sync helper

`src/lib/syncDealTasks.ts`:
- `syncDealTasksFromPlan(dealId, clientId, plan, bonuses)`:
  1. Busca `activities` existentes do deal com `template_key`.
  2. Filtra catálogo: inclui se `requiredPlan` é nulo OU igual ao plano do cliente; se `requiredBonus` é nulo OU está nos bônus selecionados.
  3. Faz `INSERT` apenas das que não existem (ON CONFLICT DO NOTHING via unique index).
  4. Nunca DELETE.

### Pontos de chamada

- Após criar cliente no onboarding (com plano definido).
- Após `auto_create_deal_for_client` (trigger): chamar `syncDealTasksFromPlan` no front quando o usuário abrir o deal pela primeira vez (ou via edge function se preferir 100% server-side — fase 2).
- Ao mudar plano/bônus no popover do selo.
- Botão "Sincronizar tarefas".

### UI — componentes novos/alterados

| Arquivo | Mudança |
|---|---|
| `src/components/onboarding/steps/StepRegistration.tsx` | Bloco Plano + Bônus |
| `src/components/client/PlanBadge.tsx` (novo) | Selo Pro/Basic + bônus, com popover de troca |
| `src/components/client/PlanPickerPopover.tsx` (novo) | Radio plano + checkboxes bônus + botão sincronizar |
| `src/pages/ClientDetails.tsx` | Renderiza `<PlanBadge>` no header |
| `src/components/crm/DealDetailModal.tsx` | `<PlanBadge size="sm">` na sidebar; aba Negócios agrupa tarefas por `checkpoint_code` |
| `src/lib/xploProcessTemplate.ts` (novo) | Catálogo das ~41 tarefas |
| `src/lib/syncDealTasks.ts` (novo) | Lógica de sincronização idempotente |
| `src/integrations/supabase/types.ts` | Auto-gerado após migration |

### Estilo do selo

- Pro: `bg-gradient-to-r from-primary to-primary/70 text-primary-foreground` + ícone Sparkles
- Basic: `border border-foreground text-foreground bg-background`
- Forma de pill (rounded-full px-3 py-1), tipografia bold sm.
- Bônus: badges menores (`variant="outline"`) ao lado.

### Não escopo (fica para depois)

- Templates por nicho (todos usam o mesmo template "Hospedagens" agora).
- Datas/prazos automáticos por tarefa (criadas sem `scheduled_at`; usuário agenda manualmente).
- Remover tarefas quando desmarca bônus (decidido: nunca remover).
- Refletir Plano/Bônus em cobrança/contrato.

### Memória a salvar (após build)

- `mem://crm/plano-bonus-tarefas-automaticas` — modelo de dados, regras de sync idempotente, catálogo Hospedagens.
- Atualizar índice.
