

# Pagina de Detalhes do Cliente

## Objetivo
Criar a pagina `/clients/:id` que exibe as informacoes do cliente de forma fixa e permite:
- Visualizar todos os dados do cliente
- Editar/personalizar informacoes
- Deletar o cliente
- Iniciar o onboarding PPP

---

## Interface Proposta

```text
+----------------------------------------------------------+
|  [<-] Empresa ABC                                         |
|       Nicho: Tecnologia              [Rascunho]           |
|----------------------------------------------------------|
|                                                           |
|  +-----------------------------------------------------+  |
|  | INFORMACOES DO CLIENTE                              |  |
|  |-----------------------------------------------------|  |
|  |  Nome:    Empresa ABC Ltda                          |  |
|  |  Nicho:   Tecnologia                                |  |
|  |  Status:  Rascunho                                  |  |
|  |  Notas:   Cliente interessado em automacao...       |  |
|  |  Criado:  31/01/2026                                |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  +-----------------------------------------------------+  |
|  | PROXIMA ETAPA                                       |  |
|  |-----------------------------------------------------|  |
|  |  Inicie o processo de discovery para este cliente.  |  |
|  |                                                      |  |
|  |  [ Iniciar Onboarding PPP -> ]                      |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  +-----------------------------------------------------+  |
|  | ACOES                                               |  |
|  |-----------------------------------------------------|  |
|  |  [ Editar Cliente ]    [ Deletar Cliente ]          |  |
|  +-----------------------------------------------------+  |
|                                                           |
+----------------------------------------------------------+
```

---

## Funcionalidades

### 1. Visualizacao de Dados (Fixa)
- Exibe nome, nicho, status, notas e data de criacao
- Badge colorido para o status atual
- Layout limpo e organizado em cards

### 2. Iniciar Onboarding
- Botao proeminente para iniciar o processo PPP
- Redireciona para `/onboarding?client=<id>`
- Atualiza status do cliente para `ppp_in_progress`

### 3. Editar Cliente (Dialog)
- Abre um modal com formulario de edicao
- Campos: nome, nicho, notas
- Salva alteracoes no banco de dados
- Toast de confirmacao

### 4. Deletar Cliente (AlertDialog)
- Confirmacao antes de deletar
- Mensagem clara sobre a acao irreversivel
- Redireciona para `/clients` apos deletar
- Toast de confirmacao

---

## Detalhes Tecnicos

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/ClientDetails.tsx` | Criar (nova pagina) |
| `src/App.tsx` | Modificar (adicionar rota) |

### Rota a Adicionar

```typescript
<Route path="/clients/:id" element={<ClientDetails />} />
```

### Componentes Utilizados
- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Layout
- `Badge` - Status do cliente
- `Button` - Acoes
- `Dialog` - Modal de edicao
- `AlertDialog` - Confirmacao de exclusao
- `Input`, `Textarea`, `Label` - Formulario de edicao
- `Loader2` - Estado de carregamento

### Estrutura do Componente

```typescript
// Estados principais
const { id } = useParams();
const [client, setClient] = useState<Client | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [isEditOpen, setIsEditOpen] = useState(false);
const [isDeleteOpen, setIsDeleteOpen] = useState(false);
const [isSaving, setIsSaving] = useState(false);

// Buscar cliente
useEffect(() => {
  fetchClient(id);
}, [id]);

// Funcoes
const handleUpdate = async (formData) => { ... };
const handleDelete = async () => { ... };
const handleStartOnboarding = async () => {
  // Atualiza status para ppp_in_progress
  // Navega para /onboarding?client=id
};
```

### Queries do Supabase

```typescript
// Buscar cliente
const { data } = await supabase
  .from("clients")
  .select("*")
  .eq("id", id)
  .maybeSingle();

// Atualizar cliente
await supabase
  .from("clients")
  .update({ name, niche, notes })
  .eq("id", id);

// Deletar cliente
await supabase
  .from("clients")
  .delete()
  .eq("id", id);

// Iniciar onboarding (atualizar status)
await supabase
  .from("clients")
  .update({ status: "ppp_in_progress" })
  .eq("id", id);
```

---

## Fluxo de Usuario

```text
Lista de Clientes
       |
       v
 [Ver Detalhes]
       |
       v
 Pagina de Detalhes
       |
       +-- [Editar] --> Dialog de Edicao --> Salvar
       |
       +-- [Deletar] --> Confirmacao --> Lista de Clientes
       |
       +-- [Iniciar Onboarding] --> Atualiza Status --> /onboarding?client=id
```

---

## Tratamento de Erros

- Cliente nao encontrado: Exibe mensagem amigavel com link para lista
- Erro ao salvar: Toast com mensagem de erro
- Erro ao deletar: Toast com mensagem de erro

