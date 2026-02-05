

# Sidebar com Scroll Junto ao Conteudo

## Situacao Atual

A sidebar esta configurada com `position: fixed` (`fixed inset-y-0`), o que faz ela ficar "grudada" na tela enquanto o conteudo principal rola independentemente.

## Solucao

Mudar a sidebar de `fixed` para `sticky` ou simplesmente usar posicionamento estatico dentro de um container flex, permitindo que ela role junto com a pagina.

---

## Alteracoes Necessarias

### 1. AppSidebar.tsx

Remover o posicionamento fixo e usar posicionamento estatico:

**De:**
```tsx
<aside
  className={cn(
    "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar...",
    // ...
  )}
>
```

**Para:**
```tsx
<aside
  className={cn(
    "hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-shrink-0",
    // Mobile continua com posicionamento fixo quando aberto
  )}
>
```

Na versao mobile, manteremos o comportamento de overlay fixo para boa experiencia em telas pequenas.

### 2. AppLayout.tsx

Ajustar o layout para garantir que o scroll aconteca na pagina inteira:

```tsx
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

## Resumo Visual

```text
ANTES (fixed):
┌──────────────────────────────────────────┐
│ ┌────────┐ ┌──────────────────────────┐  │
│ │Sidebar │ │      Conteudo            │  │
│ │ FIXA   │ │        ↕                 │  │
│ │        │ │      (rola)              │  │
│ └────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────┘

DEPOIS (static/sticky):
┌──────────────────────────────────────────┐
│ ┌────────┐ ┌──────────────────────────┐  │
│ │Sidebar │ │      Conteudo            │  │
│ │   ↕    │ │        ↕                 │  │
│ │ (rola) │ │      (rola)              │  │
│ └────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────┘
        ↕ Pagina inteira rola ↕
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/layout/AppSidebar.tsx` | Remover `fixed inset-y-0` do desktop, manter comportamento mobile |
| `src/components/layout/AppLayout.tsx` | Ajustar classes flex se necessario |

