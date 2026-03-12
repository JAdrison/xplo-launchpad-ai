
## Exibir Investimento em Tráfego na Página Principal do Cliente

### O que o usuário quer
Mostrar o investimento em tráfego (`initial_traffic_investment`) de forma destacada na página do cliente, igual ao card de senhas Meta Ads — visível sem precisar abrir o Onboarding X1.

### Análise do código atual
Em `ClientDetails.tsx`:
- O estado `clientProfile` só busca: `instagram_link, instagram_login, instagram_password, facebook_login, facebook_password`
- Há um card separado "Acesso às Redes Sociais (Meta Ads)" que exibe as credenciais com visibilidade (eye icon)
- Os dados de investimento (`initial_traffic_investment`, `monthly_investment`, `current_revenue`) existem na tabela `client_profile` mas não são exibidos nessa página

### Plano de implementação (1 arquivo)

**`src/pages/ClientDetails.tsx`**:

1. Adicionar `initial_traffic_investment`, `monthly_investment`, `current_revenue` e `revenue_goal` ao tipo do estado `clientProfile`
2. Atualizar a query do Supabase para buscar esses campos junto com os demais
3. Adicionar um novo card **"Investimento em Tráfego"** abaixo do card Meta Ads, exibindo:
   - Investimento em tráfego pago: `R$ {initial_traffic_investment}`
   - Investimento mensal atual: `{monthly_investment}` (se preenchido)
   - Faturamento atual: `{current_revenue}` (se preenchido)
   - Meta de faturamento: `{revenue_goal}` (se preenchido)
4. Card só aparece se ao menos um dos campos estiver preenchido (mesmo padrão do card Meta Ads)
5. Visual com ícone `TrendingUp` e `DollarSign`, no mesmo estilo das outras seções

```text
┌─────────────────────────────────────────┐
│ 💰 Investimento em Tráfego              │
├─────────────────────────────────────────┤
│  Invest. inicial tráfego:  R$ 2.000     │
│  Investimento mensal:      R$ 5.000     │
│  Faturamento atual:        R$ 30.000    │
│  Meta de faturamento:      R$ 100.000   │
└─────────────────────────────────────────┘
```
