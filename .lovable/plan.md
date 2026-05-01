## Objetivo

Permitir que admins/funcionários da XPLO armazenem **login e senha do XPLO LAB** de cada cliente. Esse dado **não aparece no onboarding** (interno ou externo) e é gerenciado apenas dentro do painel interno em `/clients/:id`.

## Onde será exibido / editado

Card **"Informações do Cliente"** em `src/pages/ClientDetails.tsx`. Adiciono uma nova seção **"Acesso XPLO LAB"** abaixo de "Dados do Responsável", com:

- **Login XPLO LAB** (texto)
- **Senha XPLO LAB** (mascarada por padrão `••••••••` com botão olho para revelar — segue o mesmo padrão já usado em Instagram/Facebook)
- Botão **"Editar credenciais XPLO LAB"** que abre um Dialog dedicado com dois campos (login + senha) e botão Salvar.

Quando vazio, mostra estado "Nenhuma credencial cadastrada" com CTA "Adicionar credenciais".

## Onde NÃO aparece

- Onboarding interno (`OnboardingWizard` em `src/components/onboarding/`)
- Onboarding externo (`/onboarding/external/:token` — `OnboardingExternal.tsx`)
- Nenhum step (`StepCompany`, `StepRegistration`, etc.)

O cliente final nunca vê nem preenche este campo.

## Mudanças técnicas

### 1. Banco de dados (migration)

Adicionar duas colunas em `public.clients`:

```sql
ALTER TABLE public.clients
  ADD COLUMN xplo_lab_login text,
  ADD COLUMN xplo_lab_password text;
```

Observação sobre RLS: a tabela `clients` hoje tem políticas públicas (`Allow public ...`). Como esses campos são sensíveis e devem ser restritos a admins/funcionários, recomendo **endurecer o acesso** — mas isso afetaria todo o app. Para escopo desta task: as colunas ficam protegidas apenas pela camada de UI (não exibidas em telas externas). Se quiser RLS estrita por role, posso fazer numa task separada.

### 2. Frontend (`src/pages/ClientDetails.tsx`)

- Estender state `client` para incluir `xplo_lab_login` / `xplo_lab_password` (vem automático via `Tables<"clients">` após regenerar tipos).
- Adicionar nova seção visual no card "Informações do Cliente" entre "Dados do Responsável" e "Produto", com ícone `KeyRound` (lucide).
- Reusar padrão de toggle de senha (`showXploPassword` state + botão `Eye`/`EyeOff`).
- Adicionar Dialog "Editar Credenciais XPLO LAB" com 2 inputs (login text, senha com toggle) e ação que faz `supabase.from("clients").update({ xplo_lab_login, xplo_lab_password }).eq("id", id)`.

### 3. Memória do projeto

Criar `mem://features/xplo-lab-credenciais` documentando:
- Campos `xplo_lab_login`/`xplo_lab_password` em `clients`
- Visíveis apenas em `/clients/:id`
- NUNCA exibir/coletar no onboarding interno ou externo
- Senha sempre mascarada por padrão (regra LGPD)

## Resumo visual

```text
Card "Informações do Cliente"
├─ Dados da Empresa
├─ Dados do Responsável
├─ 🔑 Acesso XPLO LAB         ← NOVO
│   ├─ Login: usuario@xplo
│   ├─ Senha: ••••••••  [👁]
│   └─ [Editar credenciais]
├─ Produto / Serviço
└─ Criado em / Notas
```
