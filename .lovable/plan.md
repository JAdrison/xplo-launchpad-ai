## Objetivo

Permitir editar os dados cadastrais do cliente direto pelo card do deal no CRM (modal `DealDetailModal` — sidebar à esquerda com nome, telefone, e-mail).

Hoje a sidebar mostra os campos do cliente em modo somente-leitura. A única forma de editar é abrir `/clients/:id` ou recadastrar via onboarding.

## Solução

### 1. Novo componente `EditClientDialog`
Arquivo: `src/components/crm/EditClientDialog.tsx`

Modal dedicado que carrega o cliente por id e permite editar os mesmos campos do `ClientNew`:
- Nome do cliente *
- CNPJ (com máscara)
- Nicho
- Nome do responsável
- CPF do responsável (com máscara)
- E-mail
- Telefone (com máscara)
- Descrição do produto
- Observações

Validação com Zod (mesma estrutura usada em `ClientRegister`/`ClientNew`): nome obrigatório, e-mail válido se preenchido, limites de tamanho.

Salva em `clients` com `update().eq("id", clientId)` e dispara `onSaved()` no sucesso.

### 2. Integração no `DealDetailModal`
- Adicionar botão **"Editar dados"** (ícone `Pencil`) na sidebar, logo abaixo do bloco com nome/telefone/email do cliente (entre o bloco "Etapa atual / Valor / Mail / Phone" e o `Separator` dos botões de ação).
- Ao clicar, abre o `EditClientDialog` com `clientId={client.id}`.
- No `onSaved`, chama `refetch()` (que já recarrega `client`) e `onChanged()` para atualizar o Kanban.

### 3. Reaproveitamento
O `ClientNew` continua existindo para criação. O novo `EditClientDialog` é só para edição inline — não duplica a página inteira, é um modal compacto.

## Detalhes técnicos

- Reusa máscaras `maskCPF`, `maskCNPJ`, `maskPhone` de `@/lib/utils`.
- Schema Zod local no próprio dialog (mesmo padrão do `ClientRegister`).
- Não mexe no `deal.name` — esse continua sendo editado pelo botão de editar do deal (se houver) ou via Kanban; o foco aqui é o **cadastro do cliente**.
- Sem mudanças no banco — RLS de `clients` já permite update para `has_crm_access`.

## Fora de escopo

- Edição de plano XPLO/bônus (já existe via `PlanBadge`).
- Edição dos campos de onboarding (SWOT, ICPs, ofertas) — esses continuam só em `/clients/:id`.
