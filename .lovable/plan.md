# Unificar Clientes + Onboarding X1 + Gerador IA + Ativos em uma única tela "Workspace"

## Objetivo

Substituir os 4 itens da sidebar por **um único item "Workspace"** (`/workspace`), reaproveitando o layout limpo da página Ativos. Cada cliente vira um card único com indicador discreto de status, contagem de ativos e botões contextuais.

## Sidebar

Remover de `AppSidebar.tsx`:
- Clientes (`/clients`)
- Onboarding X1 (`/onboarding`)
- Gerador IA (`/generator`)
- Ativos (`/assets`)

Adicionar:
- **Workspace** (`/workspace`) — ícone `LayoutGrid` ou `Briefcase`.

(CRM, Configurações, Admin Usuários permanecem.)

## Rotas

Em `src/App.tsx`:
- Nova rota `/workspace` → `Workspace` (página nova).
- `/clients`, `/onboarding`, `/assets`, `/generator` viram `<Navigate to="/workspace" replace />`.
- Mantidas intactas: `/clients/new`, `/clients/:id`, `/onboarding/:clientId/wizard` (a tela do wizard de onboarding continua acessível pelos botões), `/onboarding-external/...`.

## Página `src/pages/Workspace.tsx` (substitui Assets)

Estrutura herda diretamente do layout de `Assets.tsx`:

1. **Header**
   - Título: "Workspace" · subtítulo: "Seus clientes, onboarding e ativos em um só lugar".
   - Botões à direita: **Copiar link de registro** (de Clientes) + **Novo Cliente** (de Clientes).

2. **Cards de resumo (3 colunas, igual Ativos)**
   - Total de Ofertas / Landing Pages / Anúncios — mantidos.
   - Adicionar um 4º card opcional: "Clientes ativos" (count de não arquivados).

3. **Filtros**
   - Select "Cliente" (já existe).
   - Tabs/segmento simples adicional: **Todos · Em onboarding · Concluídos · Com ativos** (apenas filtra a grade abaixo, sem mudar o layout).

4. **Grade de cards de cliente (estilo Ativos, limpo)**
   Cada card contém:
   - Header: ícone `Building2` + **nome** + **bolinha de status** colorida ao lado:
     - 🔴 cinza: Pendente (`draft` sem etapas)
     - 🟡 amarelo: Em onboarding (`ppp_in_progress` ou draft com etapas)
     - 🟢 verde: X1 concluído (`ppp_completed+`)
   - Tooltip na bolinha com o label e "X/7 etapas".
   - Linha sutil com niche/produto se houver.
   - Bloco de contagens (Ofertas / LPs / Anúncios) — exatamente como hoje no Assets.
   - Footer com botões contextuais (1 ou 2, sem poluir):
     - Status pendente → **Iniciar onboarding** (primário) + **Ver detalhes** (ghost).
     - Em onboarding → **Continuar** (primário) + **Ver detalhes** (ghost).
     - Concluído → **Gerar com IA** (primário, abre modal) + **Ver detalhes** (ghost).

## Modal "Gerar com IA"

Novo componente `src/components/workspace/GenerateAIDialog.tsx`. Encapsula a lógica essencial do `Generator.tsx` atual:
- Input: `clientId` (passado do card).
- Carrega ICPs do cliente + ofertas do banco.
- Permite escolher: tipos a gerar (`offer`, `ads`), ICP (se gerar oferta), oferta do banco (se gerar ads).
- Botão **Gerar** dispara as mesmas funções já existentes (chama edge functions `generate-offer` e `generate-ads` ou as funções equivalentes que `Generator.tsx` usa hoje).
- Após gerar, fecha modal, mostra toast de sucesso e navega para `/clients/:id?tab=ofertas` (ou `?tab=anuncios`) para o usuário ver o resultado.

A página `Generator.tsx` é **excluída** (a lógica útil é reaproveitada no modal).

## Excluir / arquivar

- `src/pages/Clients.tsx` — deletar (substituído pelo Workspace).
- `src/pages/Onboarding.tsx` + `src/components/onboarding/OnboardingDashboard.tsx` — Onboarding.tsx fica só para o wizard externo via clientId param? **Solução**: manter `Onboarding.tsx` apenas se ainda for usado pela rota `/onboarding?client=...` (botão "Continuar" navega para essa rota). Sim, é usado — então `Onboarding.tsx` permanece, mas o `OnboardingDashboard` (caso sem `clientId`) passa a redirecionar para `/workspace` em vez de listar.
- `src/pages/Generator.tsx` — deletar; `GeneratedContentViewer` continua sendo usado em `ClientDetails.tsx`.
- `src/pages/Assets.tsx` — deletar (virou `Workspace.tsx`).

## Detalhes técnicos

- **Fetch único**: na carga, buscar `clients` + `client_profile (status fields)` + `icps (count)` + `client_promise` + counts de `offers_hormozi`, `landing_pages`, `ads` por cliente — em paralelo, como já faz Onboarding/Assets, montando um único objeto `ClientCard`.
- **Status helper**: pequena função `getOnboardingState(client, completedSteps)` retornando `"pending" | "in_progress" | "completed"`, alimentando bolinha + filtro.
- **Progresso (X/7)**: copiar a contagem de `OnboardingDashboard` para preencher o tooltip da bolinha.
- **Toolbar do generator**: o estado/seleção que hoje vive em `Generator.tsx` (selectedClientId, selectedIcpId, selectedBankKey, selectedTypes, handleGenerate) move para `GenerateAIDialog`, que é montado e desmontado por card.
- **Imports a remover** após o cleanup: itens da sidebar e suas rotas mortas. Verificar `Sparkles`, `Users`, `ClipboardList`, `FileStack` ainda usados antes de remover do `AppSidebar`.

## Fora do escopo

- Não mexer em `/clients/:id` (página de detalhe permanece como hoje).
- Não mexer no wizard de onboarding em si (apenas no dashboard de listagem).
- Não tocar no CRM nem no Dashboard.
- Sem migrações de banco.
