## Nova área "Vendas" (admin-only)

Adiciona em `/admin/vendas` uma área completa de acompanhamento financeiro de clientes vendidos, inspirada na aba Vendas do XPLO Metrics. Acesso restrito a admins, item visível na sidebar logo abaixo de "Usuários", dentro do bloco **Administração**.

---

### 1. Backend (migrations Supabase)

Criar 3 tabelas novas + função auxiliar; dados compartilhados entre admins.

```text
clientes_vendidos
  id, nome, valor_mensal_cents, valor_setup_cents,
  vendedor_id (uuid → auth user), sdr_id (uuid → auth user),
  dia_vencimento (1–31), ativo (bool, default true),
  meta_leads_mes (int, opcional), observacoes,
  created_at (define o "mês da venda"), updated_at

pagamentos_clientes
  id, cliente_id, mes (1–12), ano, pago_em, valor_cents
  UNIQUE(cliente_id, mes, ano)

gastos_anuncios
  id, mes, ano, valor_cents, leads_manual, reunioes_manual
  UNIQUE(mes, ano)
```

Campos `leads_manual` e `reunioes_manual` permitem **override manual** sobre o que vier do CRM (resposta híbrida do usuário).

**RLS:** todas as 3 tabelas só permitem SELECT/INSERT/UPDATE/DELETE para `has_role(auth.uid(), 'admin')`.

Triggers: `update_updated_at_column` em `clientes_vendidos`.

---

### 2. Funil — origem dos números (CRM + manual)

KPIs CPL/CPR usam, para cada mês:

- **Leads** = nº de deals criados no mês (`deals.created_at`) — sobreescrito por `leads_manual` se preenchido.
- **Reuniões** = nº de deals que entraram em alguma coluna do tipo `meeting` no mês (heurística: `pipeline_columns.checkpoint_code` específico OU coluna marcada como reunião). Como não há esse marcador hoje, na primeira versão usamos **apenas o campo manual** `reunioes_manual` e leads vêm dos deals. Pode ser refinado depois.
- **Vendas** = nº de `clientes_vendidos` criados no mês.

---

### 3. Vendedores e SDRs

Vêm de `user_job_functions` filtrando `job_function IN ('vendedor', 'sdr')` (já existem no enum). Selects no formulário listam usuários com a função correspondente, exibindo o email (via edge `get-user-emails`).

---

### 4. Frontend — nova página `/admin/vendas`

Rota protegida com `requireAdmin`. Item de sidebar "Vendas" (ícone `DollarSign`) adicionado em `adminNavigation` no `AppSidebar.tsx`.

**Estrutura da página** (espelha o screenshot):

```text
Header
  Título "Vendas" + subtítulo
  Botão olho (ocultar valores — persiste em localStorage)
  Seletor Mês/Ano (controla métricas)

Grid 4 cards principais
  Total de Vendas (Σ mensal+setup do mês) + Δ% MoM + meta opcional
  Ticket Médio
  MRR (Σ valor_mensal de ativos até o mês) + Δ% MoM + meta opcional
  Qtd de Vendas + Δ% MoM + meta opcional

Grid 4 cards de custo
  Gasto em Anúncios (mês)
  CPL = gasto / leads
  CPR = gasto / reuniões
  CAC = gasto / vendas

Card "Clientes Ativos"
  Header com:
    Botão "Gasto em Anúncios" → modal 12 meses do ano
    Botão "+ Novo Cliente"
  Sub-header "Pagamentos de [Mês]":
    Badge X de Y pagos · Recebido: R$ X · barra de progresso
    Seletor mês independente (de pagamento)
  Filtros: Ordenar por · Pagos/Pendentes · Vendedor · SDR
  Tabela: Status (toggle) · Nome · Vencimento · Mensal · Setup · Vendedor · SDR · Ações (editar/remover-soft)

Gráfico (Recharts)
  "Evolução de Vendas e MRR" — barras dos últimos 6 meses
  Vendas do mês + MRR acumulado, badge crescimento MRR
```

**Componentes a criar** (em `src/components/admin/vendas/`):
- `VendasHeader.tsx`
- `MetricsCards.tsx`, `CostCards.tsx`
- `ClientesAtivosTable.tsx` (filtros, toggle pagamento via upsert)
- `NewClientDialog.tsx` / `EditClientDialog.tsx`
- `GastoAnunciosDialog.tsx` (12 meses + leads/reuniões manual)
- `EvolucaoChart.tsx`
- `useVendas.ts` (hook único com queries do mês selecionado, MoM, gráfico, vendedores/SDRs)

**Página:** `src/pages/AdminVendas.tsx` + rota em `src/App.tsx`.

---

### 5. UX / Segurança

- Soft delete (`ativo=false`), nunca apaga histórico.
- Mascarar valores monetários quando o "olho" está fechado, salvo em `localStorage`.
- Variação MoM com cor (verde/vermelho) e seta.
- Toasts em todas ações.
- Responsivo: 2 colunas mobile → 4 desktop.
- Tudo segue tokens do design system (light mode, primary `#8B5CF6`).

---

### 6. Memória a salvar após implementar

`mem://admin/vendas-modulo` — descreve tabelas, RLS admin-only, fonte de vendedor/SDR (job_functions), e regra de funil híbrido (CRM + manual).

---

### Detalhes técnicos (resumo para devs)

- Migrations: 3 CREATE TABLE + RLS policies via `has_role`.
- Armazenar valores em **centavos** (bigint) para evitar float.
- Δ% MoM = `((atual − anterior) / anterior) × 100`, tratando divisão por zero.
- MRR do mês N = soma `valor_mensal` de clientes com `created_at <= último dia do mês N` AND (`ativo=true` OR desativados após mês N — para versão 1, usar simplesmente `ativo=true`).
- Toggle de pagamento faz `upsert` em `pagamentos_clientes` por `(cliente_id, mes, ano)`.
- Gastos em anúncios: `upsert` por `(mes, ano)`.
- Sem alterar tabelas existentes do CRM.
