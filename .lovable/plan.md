
# Sistema de Login com Aprovacao de Usuarios

## Visao Geral

Implementar autenticacao completa no XPLO Starter onde:
- **Login Master**: `xplolabcreator@gmail.com` (admin)
- Novos usuarios se cadastram e aguardam aprovacao
- Somente o admin pode aprovar cadastros pendentes
- Rotas internas protegidas por autenticacao

---

## Arquitetura de Seguranca

```text
┌─────────────────────────────────────────────────────────────────┐
│                      FLUXO DE ACESSO                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Novo Usuario                                                   │
│       │                                                         │
│       ▼                                                         │
│  [Cadastro] ─────────────────────────────────────────────────┐  │
│       │                                                      │  │
│       ▼                                                      │  │
│  auth.users (Supabase Auth)                                  │  │
│       │                                                      │  │
│       ▼                                                      │  │
│  [Trigger] → Cria registro em user_roles                     │  │
│              com role = 'pending'                            │  │
│       │                                                      │  │
│       ▼                                                      │  │
│  "Aguardando aprovacao..."                                   │  │
│                                                              │  │
│  ────────────────────────────────────────────────────────    │  │
│                                                              │  │
│  Admin (xplolabcreator@gmail.com)                            │  │
│       │                                                      │  │
│       ▼                                                      │  │
│  [Painel Admin] → Lista usuarios pendentes                   │  │
│       │                                                      │  │
│       ▼                                                      │  │
│  Aprova → Muda role para 'user'                              │  │
│  Rejeita → Deleta usuario                                    │  │
│                                                              │  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Banco de Dados

### 1. Enum para Roles

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'pending');
```

### 2. Tabela user_roles

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

### 3. Funcao Security Definer

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;
```

### 4. Trigger para Novos Usuarios

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin master recebe role 'admin', outros recebem 'pending'
  IF NEW.email = 'xplolabcreator@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'pending');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Politicas RLS

```sql
-- Usuarios podem ver sua propria role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin pode ver todas as roles
CREATE POLICY "Admin can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin pode atualizar roles
CREATE POLICY "Admin can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin pode deletar usuarios pendentes
CREATE POLICY "Admin can delete pending users"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/pages/Auth.tsx` | Novo | Pagina de login/cadastro |
| `src/pages/PendingApproval.tsx` | Novo | Tela para usuarios pendentes |
| `src/pages/AdminUsers.tsx` | Novo | Painel admin para aprovar usuarios |
| `src/hooks/useAuth.tsx` | Novo | Hook de autenticacao |
| `src/components/auth/ProtectedRoute.tsx` | Novo | Componente para proteger rotas |
| `src/components/layout/AppSidebar.tsx` | Editar | Adicionar link admin e logout |
| `src/components/layout/AppHeader.tsx` | Editar | Mostrar usuario logado |
| `src/App.tsx` | Editar | Adicionar rotas e protecao |

---

## Implementacao Detalhada

### 1. Hook useAuth

```typescript
// src/hooks/useAuth.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "user" | "pending" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: Role;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Setup listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role fetch to avoid deadlock
          setTimeout(() => fetchUserRole(session.user.id), 0);
        } else {
          setRole(null);
        }
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.rpc("get_user_role", { _user_id: userId });
    setRole(data as Role);
  };

  // ... signIn, signUp, signOut methods

  return (
    <AuthContext.Provider value={{
      user, session, role, isLoading,
      signIn, signUp, signOut,
      isAdmin: role === "admin",
      isApproved: role === "admin" || role === "user"
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
```

### 2. Pagina de Login/Cadastro

```typescript
// src/pages/Auth.tsx
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Form com validacao Zod
  // Toggle entre Login e Cadastro
  // Redirect apos autenticacao baseado na role
}
```

### 3. Tela de Aprovacao Pendente

```typescript
// src/pages/PendingApproval.tsx
export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardHeader>
          <Clock className="h-12 w-12 text-yellow-500" />
          <CardTitle>Aguardando Aprovacao</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Seu cadastro foi recebido e esta aguardando aprovacao.</p>
          <p>Voce sera notificado quando sua conta for aprovada.</p>
          <Button onClick={signOut}>Sair</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4. Painel Admin

```typescript
// src/pages/AdminUsers.tsx
export default function AdminUsers() {
  // Lista usuarios com role 'pending'
  // Botoes para Aprovar (muda para 'user') ou Rejeitar (deleta)
  
  const approveUser = async (userId: string) => {
    await supabase
      .from("user_roles")
      .update({ role: "user" })
      .eq("user_id", userId);
  };

  const rejectUser = async (userId: string) => {
    // Deleta da user_roles (cascade deleta do auth.users)
    await supabase.auth.admin.deleteUser(userId);
  };
}
```

### 5. Componente ProtectedRoute

```typescript
// src/components/auth/ProtectedRoute.tsx
export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, role, isLoading, isApproved, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (role === "pending") {
    return <Navigate to="/pending" replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

### 6. Atualizar App.tsx

```typescript
// src/App.tsx
<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/pending" element={<PendingApproval />} />
      <Route path="/register" element={<ClientRegister />} />
      <Route path="/onboarding/external/:token" element={<OnboardingExternal />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        {/* ... outras rotas ... */}
        
        {/* Admin only */}
        <Route path="/admin/users" element={
          <ProtectedRoute requireAdmin>
            <AdminUsers />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

---

## Fluxo de Usuario

```text
1. NOVO USUARIO
   └── Acessa /auth
       └── Clica "Criar conta"
           └── Preenche email, senha, nome
               └── Cadastro criado com role 'pending'
                   └── Redirecionado para /pending
                       └── "Aguardando aprovacao..."

2. ADMIN (xplolabcreator@gmail.com)
   └── Acessa /auth
       └── Faz login
           └── Role = 'admin' (definido no trigger)
               └── Acesso total ao sistema
                   └── Menu "Usuarios" no sidebar
                       └── /admin/users
                           └── Lista usuarios pendentes
                               └── Aprovar ou Rejeitar

3. USUARIO APROVADO
   └── Tenta acessar o sistema
       └── Role agora = 'user'
           └── Acesso liberado
               └── Usa o XPLO normalmente
```

---

## UI do Painel Admin

```text
┌─────────────────────────────────────────────────────────────────┐
│  Gerenciar Usuarios                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Usuarios Pendentes (2)                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  joao@empresa.com                                         │ │
│  │  Cadastro: 05/02/2026                                     │ │
│  │                              [Aprovar] [Rejeitar]         │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  maria@cliente.com                                        │ │
│  │  Cadastro: 04/02/2026                                     │ │
│  │                              [Aprovar] [Rejeitar]         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Usuarios Ativos (3)                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  xplolabcreator@gmail.com              [Admin] [Master]   │ │
│  │  pedro@time.com                        [User]             │ │
│  │  ana@equipe.com                        [User]             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Seguranca

| Aspecto | Implementacao |
|---------|---------------|
| Credenciais admin | Nunca hardcoded no frontend |
| Verificacao de role | Server-side via RLS e functions |
| Trigger automatico | Role 'admin' apenas para email especifico |
| Protecao de rotas | Componente ProtectedRoute |
| Funcoes SECURITY DEFINER | Evita bypass de RLS |

---

## Resumo das Migracoes

1. Criar enum `app_role`
2. Criar tabela `user_roles`
3. Criar funcoes `has_role` e `get_user_role`
4. Criar trigger `handle_new_user`
5. Criar politicas RLS

---

## Proximo Passo

Apos aprovar este plano, criarei:
1. Migracoes SQL para o banco de dados
2. Pagina `/auth` (login + cadastro)
3. Pagina `/pending` (aguardando aprovacao)
4. Pagina `/admin/users` (painel admin)
5. Hook `useAuth` e contexto
6. Componente `ProtectedRoute`
7. Atualizacoes no layout e rotas
