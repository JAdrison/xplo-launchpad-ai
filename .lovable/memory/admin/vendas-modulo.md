---
name: Admin Vendas (XPLO Metrics-style)
description: Tabelas, RLS admin-only, e regras do módulo /admin/vendas (clientes vendidos, pagamentos mensais, gastos em anúncios)
type: feature
---

Rota `/admin/vendas` (protegida com `requireAdmin`), item na sidebar em Administração logo abaixo de Usuários.

## Tabelas (RLS: somente admin)
- `clientes_vendidos` — nome, valor_mensal_cents, valor_setup_cents, vendedor_id, sdr_id, dia_vencimento (1-31), ativo (soft delete), observacoes
- `pagamentos_clientes` — UNIQUE(cliente_id, mes, ano); toggle de pagamento via upsert/delete
- `gastos_anuncios` — UNIQUE(mes, ano); valor_cents + leads_manual + reunioes_manual

## Vendedores e SDRs
Vêm de `user_job_functions` filtrando `job_function IN ('vendedor','sdr')`. Emails resolvidos via edge `get-user-emails`.

## Funil híbrido (CRM + manual)
- Leads = `leads_manual` se preenchido, senão count de `deals` criados no mês.
- Reuniões = `reunioes_manual` (não há marcador de coluna de reunião ainda).
- Vendas = count de `clientes_vendidos` criados no mês.

## Regras numéricas
- Valores em centavos (bigint). Variação MoM = ((atual-anterior)/anterior)*100.
- MRR (mês N) = soma valor_mensal de clientes ativos com created_at ≤ último dia de N.
- Soft delete: `ativo=false`, nunca `DELETE`.

## UX
- Botão olho mascara valores (localStorage `vendas:masked`).
- Mês de métricas e mês de pagamento são independentes.
- Gráfico Recharts: últimos 6 meses (Vendas do mês + MRR acumulado).
