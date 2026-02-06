
# Corrigir Logo XPLO Aparecendo no Canto Superior Direito

## Problema Identificado

Os templates de PDF (usados para exportar documentos) contêm uma logo XPLO com `position: fixed`. Quando esses templates são renderizados na página para gerar o PDF, a logo com posição fixa "escapa" do container escondido e aparece no canto superior direito da viewport.

```
Container escondido (left: -9999px)
┌─────────────────────┐
│  Template PDF       │      ┌──────────────────────┐
│  ...conteúdo...     │      │   Viewport           │
│                     │  --> │                XPLO  │ <-- Logo aparece aqui!
│  [Logo position:fixed] ────┼──────────────────────┤
└─────────────────────┘      │   Página normal      │
                             └──────────────────────┘
```

## Solução

Alterar `position: fixed` para `position: absolute` nas logos dos templates PDF. Isso fará com que as logos se posicionem relativas ao container do template, mantendo-as escondidas junto com o resto do conteúdo.

---

## Arquivos a Modificar

### 1. src/components/export/OnboardingPDFTemplate.tsx

Linha ~187: Alterar de `position: "fixed"` para `position: "absolute"`

### 2. src/components/export/AdsPDFTemplate.tsx

Linha ~211: Alterar de `position: "fixed"` para `position: "absolute"`

### 3. src/components/export/OfferPDFTemplate.tsx

Linha ~170: Alterar de `position: "fixed"` para `position: "absolute"`

### 4. src/components/export/LandingPagePDFTemplate.tsx

Linha ~163: Alterar de `position: "fixed"` para `position: "absolute"`

---

## Mudança em Cada Arquivo

```typescript
// ANTES:
style={{ 
  position: "fixed",
  top: "5mm",
  right: "5mm",
  ...
}}

// DEPOIS:
style={{ 
  position: "absolute",
  top: "5mm",
  right: "5mm",
  ...
}}
```

---

## Resultado

- A logo XPLO não aparecerá mais no canto superior direito da tela
- Os PDFs exportados continuarão funcionando normalmente com a logo no lugar correto
- A experiência de visualização da página será limpa e sem elementos estranhos
