

## Gestão completa de usuários (revogar acesso, redefinir senha, suspender)

Hoje a tela `/admin/users` só permite **aprovar** ou **rejeitar** (apagar) usuários pendentes. Não há como bloquear um usuário ativo, redefinir a senha dele nem trocá-la manualmente. Vou adicionar essas três funcionalidades.

### O que será adicionado na tela "Gerenciar Usuários"

Para cada **usuário ativo** (admin ou usuário comum), aparecerão novas ações:

1. **Revogar acesso** — remove o usuário definitivamente (apaga login + papel + dados de auth). Confirmação obrigatória.
2. **Suspender / Reativar** — bloqueia o login sem apagar a conta (toggle). Usuário suspenso aparece com badge laranja "Suspenso".
3. **Enviar e-mail de redefinição de senha** — dispara o e-mail nativo de "esqueci minha senha" para o endereço do usuário.
4. **Definir nova senha manualmente** — abre um diálogo onde o admin digita uma senha temporária (mínimo 8 caracteres, mascarada por padrão com botão "mostrar"). Conforme regra LGPD do projeto, a senha nunca é exibida depois de salva.

Admin master (`xplolabcreator@gmail.com`) fica **protegido**: nenhum dos 4 botões acima aparece para ele, evitando auto-bloqueio.

### Diagrama da linha do usuário ativo

```text
┌─────────────────────────────────────────────────────────────────────┐
│ fulano@email.com           [Usuário] [Ativo]                        │
│ Desde: 12/03/2026                                                   │
│                                                                     │
│ [Enviar reset senha] [Definir senha] [Suspender] [Revogar acesso]  │
└─────────────────────────────────────────────────────────────────────┘
```

### Detalhes técnicos

**1. Nova edge function `admin-user-actions`** (única, com `action` no body):
- Verifica JWT do chamador e confirma `has_role(uid, 'admin')` (mesmo padrão do `get-user-emails`).
- Usa `SUPABASE_SERVICE_ROLE_KEY` para chamar a API admin de auth.
- Ações suportadas:
  - `delete` → `supabase.auth.admin.deleteUser(userId)` + `DELETE FROM user_roles WHERE user_id`
  - `ban` → `supabase.auth.admin.updateUserById(userId, { ban_duration: '876000h' })` (~100 anos)
  - `unban` → `supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })`
  - `reset_password` → `supabase.auth.admin.generateLink({ type: 'recovery', email })` e o link é enviado pelo template já configurado, OU `resetPasswordForEmail` (escolho `generateLink` para não depender de sessão)
  - `set_password` → `supabase.auth.admin.updateUserById(userId, { password })` com validação Zod (`min 8`)
- Bloqueia qualquer ação contra `xplolabcreator@gmail.com` no servidor (defesa extra além do front).
- Retorna `{ success, message }` e loga ação.

**2. Atualização de `src/pages/AdminUsers.tsx`:**
- Buscar também `banned_until` por usuário (vindo da edge function `get-user-emails` estendida → retorna `{ email, banned_until }`).
- Calcular `isSuspended = banned_until && new Date(banned_until) > new Date()`.
- Renderizar 4 novos botões na linha de cada usuário ativo (oculto para admin master).
- Diálogo de "Definir nova senha" com Input `type="password"`, toggle olho/olho-cortado, validação mínima e toast de sucesso (sem ecoar a senha).
- Confirmação `AlertDialog` para "Revogar acesso" e "Suspender".
- Após cada ação, refazer `fetchUsers()`.

**3. Atualização de `get-user-emails`:**
- Passa a retornar `Record<string, { email: string; banned_until: string | null }>` em vez de só email — assim a tela mostra status sem outra chamada.
- O front de `AdminUsers.tsx` é ajustado para o novo shape.

**4. Sem mudanças de schema** — usa apenas Supabase Auth (campo `banned_until` já existe em `auth.users`). Nenhuma migração SQL necessária.

**5. Memória** — registro nova regra: `mem://funcionalidades/admin-gestao-usuarios` descrevendo as 4 ações, proteção do admin master e mascaramento de senha (LGPD).

### Pós-implementação
A função `admin-user-actions` é deployada automaticamente. Você poderá, na tela `/admin/users`: revogar, suspender/reativar, enviar e-mail de reset e definir senha manual para qualquer usuário (exceto o master).

