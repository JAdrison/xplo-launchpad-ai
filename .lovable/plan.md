

# Adicionar Logo XPLO em Todas as Páginas dos PDFs

## Visão Geral

Adicionar a logo XPLO em **todas as páginas** dos documentos PDF exportados, posicionada no **canto superior direito** de forma pequena e discreta.

---

## Solução Técnica

Utilizar `position: fixed` com CSS de impressão para garantir que a logo apareça em todas as páginas do documento, não apenas na primeira.

### Estilo da Logo em Todas as Páginas

```css
position: fixed;
top: 5mm;
right: 5mm;
height: 20px;
opacity: 0.7;
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/export/AdsPDFTemplate.tsx` | Adicionar logo fixa no canto superior direito |
| `src/components/export/OfferPDFTemplate.tsx` | Adicionar logo fixa no canto superior direito |
| `src/components/export/OnboardingPDFTemplate.tsx` | Adicionar logo fixa no canto superior direito |
| `src/components/export/LandingPagePDFTemplate.tsx` | Adicionar logo fixa no canto superior direito |

---

## Implementação

### Componente de Logo Fixa (a ser adicionado em todos os templates)

```tsx
{/* Logo fixa em todas as páginas - canto superior direito */}
<img 
  src={logoXplo} 
  alt="XPLO" 
  style={{ 
    position: "fixed",
    top: "5mm",
    right: "5mm",
    height: "20px",
    width: "auto",
    opacity: 0.7,
    zIndex: 1000,
  }} 
/>
```

Este elemento será inserido **logo após a abertura do container principal** de cada template, antes do header existente.

---

## Detalhes por Template

### 1. AdsPDFTemplate.tsx

**Linha 205** - Após `<div style={containerStyle}>`:
```tsx
{/* Logo fixa em todas as páginas */}
<img src={logoXplo} alt="XPLO" style={{ 
  position: "fixed", top: "5mm", right: "5mm", 
  height: "20px", width: "auto", opacity: 0.7 
}} />
```

O header existente (linha 207-210) permanece intacto na primeira página.

---

### 2. OfferPDFTemplate.tsx

**Linha 155** - Após `<div style={{...}}>`:
```tsx
{/* Logo fixa em todas as páginas */}
<img src={logoXplo} alt="XPLO" style={{ 
  position: "fixed", top: "5mm", right: "5mm", 
  height: "20px", width: "auto", opacity: 0.7 
}} />
```

---

### 3. OnboardingPDFTemplate.tsx

**Linha 169** - Após `<div style={{...}}>`:
```tsx
{/* Logo fixa em todas as páginas */}
<img src={logoXplo} alt="XPLO" style={{ 
  position: "fixed", top: "5mm", right: "5mm", 
  height: "20px", width: "auto", opacity: 0.7 
}} />
```

---

### 4. LandingPagePDFTemplate.tsx

**Linha 148** - Após `<div style={{...}}>`:
```tsx
{/* Logo fixa em todas as páginas */}
<img src={logoXplo} alt="XPLO" style={{ 
  position: "fixed", top: "5mm", right: "5mm", 
  height: "20px", width: "auto", opacity: 0.7 
}} />
```

---

## Resultado Visual

```text
┌──────────────────────────────────────────┐
│                                   [XPLO] │ ← Logo pequena (20px)
│  ┌────────────────────────────────────┐  │
│  │  XPLO (grande)      05 fev 2026    │  │ ← Header normal (1ª página)
│  └────────────────────────────────────┘  │
│                                          │
│              CONTEÚDO                    │
│                                          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│                                   [XPLO] │ ← Logo aparece aqui também
│                                          │
│              PÁGINA 2                    │
│                                          │
└──────────────────────────────────────────┘
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Logo apenas no header da 1ª página | Logo em **todas as páginas** no canto superior direito |
| — | Logo pequena (20px) e semi-transparente (70% opacidade) |
| — | Não interfere com o conteúdo existente |

