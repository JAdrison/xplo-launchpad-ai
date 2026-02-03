
## Objetivo
Fazer o Dashboard “contabilizar de verdade” (tirar os zeros fixos) puxando métricas do backend e exibindo também “Últimos Clientes” reais.

Hoje o `src/pages/Dashboard.tsx` está 100% estático (valores “0”), então mesmo com clientes/ativos no banco ele nunca vai mudar.

---

## O que será contabilizado (regras)
Vamos calcular 4 números no Dashboard:

1) **Total de Clientes**
- Contagem de linhas em `clients` (excluindo `archived` se você quiser; por padrão vou contar todos, e podemos ajustar depois).

2) **Em Onboarding**
- Contagem de `clients` com `status = 'ppp_in_progress'`.

3) **PPP Concluídos**
- Contagem de `clients` com status em:
  - `ppp_completed`
  - `offer_generated`
  - `assets_generated`
  
Isso reflete “PPP já concluído e pronto para gerar/usar ativos”.

4) **Ativos Gerados**
- Soma de contagens:
  - `offers_hormozi`
  - `landing_pages`
  - `ads`

---

## “Últimos Clientes” (lista real)
Substituir o placeholder por:
- Query em `clients` ordenando por `updated_at desc`
- Limite: 5 (ou 8) clientes
- Exibir: nome, nicho (se existir), badge de status (usando o mesmo mapeamento do `Clients.tsx`)
- CTA “Ver detalhes” para `/clients/:id`
- Se não houver clientes: manter o empty-state atual (“Criar primeiro cliente”)

---

## Como vamos buscar os dados (performance e confiabilidade)
### Estratégia de queries
No `Dashboard.tsx`, fazer um `useEffect` com `Promise.all` para buscar tudo em paralelo:

- `clients` total:
  - `supabase.from("clients").select("id", { count: "exact", head: true })`
- onboarding:
  - `.eq("status","ppp_in_progress")` (também com `head: true`)
- ppp concluído:
  - `.in("status", ["ppp_completed","offer_generated","assets_generated"])`
- assets:
  - `offers_hormozi` count
  - `landing_pages` count
  - `ads` count
- últimos clientes:
  - `supabase.from("clients").select("id,name,niche,status,updated_at").order("updated_at",{ascending:false}).limit(5)`

### Estados de UI
Adicionar estados no Dashboard:
- `isLoading` (true enquanto busca)
- `stats` como números
- `recentClients` array
- `error` opcional

Mostrar `Skeleton` nos cards enquanto carrega (padrão já existe no projeto em outras telas, ex: `Assets.tsx`).

### Tratamento de erro
- Se alguma query falhar:
  - Log no `console.error`
  - Mostrar toast “Não foi possível carregar as métricas do dashboard”
  - Renderizar 0 como fallback, para não quebrar a tela

---

## Arquivos que serão modificados
1) `src/pages/Dashboard.tsx`
- Trocar `const stats = [...]` estático por dados vindos do backend.
- Adicionar fetch de métricas + últimos clientes.
- Reutilizar o mapeamento de status (label/variant) igual ao `Clients.tsx` para consistência.

Nenhuma mudança de banco é necessária (só leitura).

---

## Edge cases previstos
- **Nenhum cliente no banco**: dashboard mostra 0 e o bloco “Criar primeiro cliente”.
- **Muitos clientes/ativos**: queries de contagem são eficientes (head:true) e não trazem payload grande.
- **RLS/Permissão bloqueando leitura**: as queries retornarão erro; vamos exibir fallback e toast. Se isso acontecer, o próximo passo é revisar permissões do backend, mas primeiro vamos implementar a contagem para confirmar o comportamento.

---

## Checklist de validação (o que você vai testar quando eu implementar)
1) Criar 1 cliente → “Total de Clientes” deve ir para 1.
2) Iniciar PPP (status vira `ppp_in_progress`) → “Em Onboarding” deve aumentar.
3) Concluir PPP (status `ppp_completed`) → “PPP Concluídos” deve aumentar.
4) Gerar oferta/LP/ads → “Ativos Gerados” deve refletir as quantidades.
5) “Últimos Clientes” deve listar os 5 mais recentes (ou atualizados recentemente).

---

## Pequena pergunta de alinhamento (para eu aplicar na regra)
- Em **“Total de Clientes”**, você quer contar clientes **arquivados** (`status = archived`) ou prefere excluir do total?
  - Se preferir excluir, eu aplico `.neq("status","archived")` no total.
