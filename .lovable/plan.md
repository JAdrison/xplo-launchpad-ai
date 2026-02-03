

## Objetivo

Adicionar um botão ao lado de "Novo Cliente" na página de Clientes para copiar o link de registro (`/register`).

---

## Alteração

### Arquivo: `src/pages/Clients.tsx`

**Mudanças:**
1. Importar ícones `Link2` e `Check` do lucide-react
2. Importar o hook `useToast` para feedback
3. Adicionar estado `copied` para controlar o ícone do botão
4. Criar função `handleCopyLink` que copia o link e mostra toast
5. Adicionar botão `variant="outline"` ao lado do botão "Novo Cliente"

**Layout do header atualizado:**

```text
+----------------------------------------------------------+
|  Clientes                                                |
|  Gerencie seus clientes e projetos                       |
|                                                          |
|          [Copiar Link de Registro]  [+ Novo Cliente]     |
+----------------------------------------------------------+
```

**Comportamento do botão:**
- Ao clicar: copia `${window.location.origin}/register`
- Mostra ícone de check por 2 segundos
- Exibe toast "Link copiado!"

---

## Código previsto

```typescript
// Novo estado
const [copied, setCopied] = useState(false);

// Função de copiar
const handleCopyLink = async () => {
  const url = `${window.location.origin}/register`;
  await navigator.clipboard.writeText(url);
  setCopied(true);
  toast({
    title: "Link copiado!",
    description: "Envie para o cliente se cadastrar.",
  });
  setTimeout(() => setCopied(false), 2000);
};

// No header, ao lado do botão existente
<div className="flex gap-2">
  <Button variant="outline" onClick={handleCopyLink} className="gap-2">
    {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
    Copiar Link de Registro
  </Button>
  <Button asChild className="gap-2">
    <Link to="/clients/new">
      <Plus className="h-4 w-4" />
      Novo Cliente
    </Link>
  </Button>
</div>
```

---

## Resultado

- Usuário pode copiar rapidamente o link `/register` direto da página de Clientes
- Feedback visual imediato (ícone muda para check)
- Toast confirma a ação

