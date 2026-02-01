
# Corrigir Quebra de Paginas no PDF da Landing Page

## Problema Identificado

O PDF gerado esta cortando texto entre paginas porque:
1. O `react-to-pdf` nao tem controle nativo de quebra de pagina
2. O HTML e renderizado como imagem e dividido em fatias fixas
3. Elementos ficam "cortados" no meio quando caem na transicao de pagina

### Evidencias do Problema

- "Totalmente Digital" aparece como "Iotalmente Digital" (letra cortada)
- Linhas de texto separadas pela metade
- Secoes divididas de forma abrupta

---

## Solucao Proposta

### Abordagem 1: CSS Page Break (Recomendada)

Usar propriedades CSS de controle de quebra de pagina em cada secao:

```css
page-break-inside: avoid;
break-inside: avoid;
page-break-before: auto;
page-break-after: auto;
```

Isso instrui o renderizador a:
- Evitar quebrar uma secao no meio
- Mover secao inteira para proxima pagina se nao couber

### Implementacao

Modificar o estilo de cada secao no template:

```typescript
const sectionStyle = {
  marginBottom: "20px",
  pageBreakInside: "avoid" as const,
  breakInside: "avoid" as const,
};
```

---

## Alteracoes no LandingPagePDFTemplate.tsx

### 1. Estilo Base de Secao

```typescript
const sectionStyle = {
  marginBottom: "20px",
  pageBreakInside: "avoid",
  breakInside: "avoid",
};
```

### 2. Elementos Grandes (Testimonials, FAQ)

Para elementos que podem ser grandes individualmente:

```typescript
// Cada testimonial individual
<div style={{ 
  pageBreakInside: "avoid",
  breakInside: "avoid",
  marginBottom: "8px"
}}>
```

### 3. Container Principal

Adicionar estilos de impressao no container:

```typescript
<div style={{ 
  width: "210mm", 
  minHeight: "297mm", 
  padding: "15mm",
  // ... outros estilos
}}>
```

---

## Mapeamento de Alteracoes

| Secao | Alteracao |
|-------|-----------|
| Hero | `pageBreakInside: avoid` |
| Problemas e Dores | `pageBreakInside: avoid` |
| Solucao | `pageBreakInside: avoid` |
| Beneficios | `pageBreakInside: avoid` em cada item |
| Como Funciona | `pageBreakInside: avoid` |
| Prova Social | `pageBreakInside: avoid` em cada testimonial |
| Garantia | `pageBreakInside: avoid` |
| Pilha de Valor | `pageBreakInside: avoid` |
| FAQ | `pageBreakInside: avoid` em cada pergunta |
| Final CTA | `pageBreakInside: avoid` |

---

## Codigo Atualizado

### sectionStyle atualizado

```typescript
const sectionStyle = {
  marginBottom: "20px",
  pageBreakInside: "avoid" as const,
  breakInside: "avoid" as const,
};
```

### Elementos individuais (testimonials, FAQ items)

```typescript
{complete.social_proof.testimonials?.map((t, i) => (
  <div key={i} style={{ 
    border: "1px solid #e5e7eb", 
    padding: "10px", 
    borderRadius: "4px",
    marginBottom: "8px",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  }}>
```

### Boxes com destaque (CTA, Mecanismo Unico)

```typescript
<div style={{ 
  backgroundColor: "#f5f3ff", 
  padding: "10px", 
  borderRadius: "4px",
  marginTop: "8px",
  pageBreakInside: "avoid",
  breakInside: "avoid",
}}>
```

---

## Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/export/LandingPagePDFTemplate.tsx` | Adicionar `pageBreakInside: avoid` em todas as secoes e elementos individuais |

---

## Resultado Esperado

Apos a alteracao:
- Secoes nao serao mais cortadas pela metade
- Se uma secao nao couber no final da pagina, ela vai inteira para a proxima
- Texto permanece legivel e integro
- Layout profissional mantido

---

## Nota Tecnica

O `pageBreakInside: avoid` funciona com `html2canvas` quando o PDF tem multiplas paginas. O renderizador respeita essas propriedades CSS ao calcular onde dividir o conteudo.

Se ainda houver problemas com secoes muito grandes, podemos adicionar logica para dividir apenas em pontos seguros (entre itens de lista, por exemplo).
