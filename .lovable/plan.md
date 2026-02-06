
# Exibir Email dos Usuarios no Painel Admin

## Problema Atual

A pagina de gerenciamento de usuarios exibe apenas o `user_id` truncado (ex: `a1b2c3d4...`) porque:
- A tabela `user_roles` so armazena o `user_id`, nao o email
- A tabela `auth.users` (onde os emails estao) nao pode ser acessada diretamente pelo cliente por questoes de seguranca

## Solucao

Criar uma edge function que busca os emails dos usuarios usando a service role key (que tem acesso a `auth.users`).

---

## Arquitetura

```text
┌──────────────────┐     ┌───────────────────────┐     ┌──────────────┐
│   AdminUsers.tsx │────>│  Edge Function        │────>│  auth.users  │
│   (cliente)      │     │  get-user-emails      │     │  (emails)    │
└──────────────────┘     └───────────────────────┘     └──────────────┘
         │                        │
         │                        v
         │               ┌───────────────────────┐
         └──────────────>│     user_roles        │
                         │  (roles existentes)   │
                         └───────────────────────┘
```

---

## Implementacao

### 1. Criar Edge Function: `get-user-emails`

Nova funcao em `supabase/functions/get-user-emails/index.ts`:

- Recebe uma lista de `user_ids`
- Usa a service role key para consultar `auth.users`
- Retorna um mapeamento `{ user_id: email }`
- Valida que apenas admins podem chamar esta funcao

### 2. Atualizar AdminUsers.tsx

- Apos buscar os dados de `user_roles`, chamar a edge function passando os `user_ids`
- Combinar os emails com os dados existentes
- Exibir o email completo ao inves do codigo truncado

---

## Detalhes Tecnicos

### Edge Function (get-user-emails)

```typescript
// Verificar se usuario e admin
// Buscar emails de auth.users usando supabaseAdmin
// Retornar mapeamento user_id -> email
```

### Frontend (AdminUsers.tsx)

```typescript
// Apos fetchUsers():
const userIds = data.map(u => u.user_id);
const emailsResponse = await supabase.functions.invoke('get-user-emails', {
  body: { userIds }
});

// Combinar emails com usuarios
const usersWithEmails = data.map(user => ({
  ...user,
  email: emailsResponse.data?.[user.user_id] || 'Email nao disponivel'
}));
```

---

## Resultado Visual

**Antes:**
```
a1b2c3d4...
Cadastro: 05/02/2026 as 20:30
```

**Depois:**
```
joao@empresa.com.br
Cadastro: 05/02/2026 as 20:30
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/get-user-emails/index.ts` | Criar - Edge function para buscar emails |
| `src/pages/AdminUsers.tsx` | Modificar - Integrar com edge function e exibir emails |
