
# Animacao Suave nos Icones da Sidebar

## O Que Sera Feito

### 1. Animacao nos Icones
Adicionar transicoes suaves nos icones quando a sidebar colapsar/expandir:
- Scale (escala) - icones aumentam levemente quando colapsados para melhor visibilidade
- Transicao de posicao - movimento suave ao centralizar

### 2. Scroll da Sidebar
A sidebar ja esta configurada como elemento estatico (nao `fixed`), entao ela ja desce junto com o scroll da pagina. Vou verificar se esta funcionando corretamente.

---

## Alteracoes no AppSidebar.tsx

### Icones com Animacao

```tsx
// Antes:
<item.icon className="h-5 w-5 shrink-0" />

// Depois:
<item.icon 
  className={cn(
    "shrink-0 transition-all duration-300",
    collapsed ? "h-6 w-6" : "h-5 w-5"
  )} 
/>
```

### Transicoes no Container do Link

```tsx
// Antes:
className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"

// Depois:
className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300"
```

### Logo com Animacao

```tsx
// Antes:
<img src={logoXplo} alt="XPLO" className="h-8 w-auto" />

// Depois:
<img 
  src={logoXplo} 
  alt="XPLO" 
  className={cn(
    "w-auto transition-all duration-300",
    collapsed ? "h-10" : "h-8"
  )} 
/>
```

---

## Comportamento Visual

```text
EXPANDIDA                    COLAPSADA
┌────────────────────┐       ┌────────┐
│ [Logo] Starter     │  -->  │ [Logo] │
│ 🏠 Dashboard       │       │   🏠   │  <- icone maior
│ 👥 Clientes        │       │   👥   │
│ 📋 Onboarding      │       │   📋   │
└────────────────────┘       └────────┘

Animacao: 300ms ease-out
```

---

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/layout/AppSidebar.tsx` | Adicionar transicoes CSS nos icones e elementos |
