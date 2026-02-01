
# Corrigir Margens Entre Páginas no PDF

## Problema Identificado

O `react-to-pdf` usa `html2canvas` que renderiza o HTML como uma **imagem única** e depois divide em páginas. As propriedades CSS `pageBreakInside: avoid` não funcionam bem porque:

1. O conteúdo é tratado como uma imagem contínua
2. A divisão acontece em intervalos fixos de altura
3. Não há margem entre o final de uma página e início da próxima

---

## Solução

### Abordagem 1: Adicionar Margem via Opções do react-to-pdf

O `react-to-pdf` suporta margens em todas as páginas através da opção `Margin`:

```typescript
import { usePDF, Margin } from "react-to-pdf";

const { toPDF, targetRef } = usePDF({
  filename,
  page: {
    margin: Margin.MEDIUM, // ou valor numérico em MM
    format: "A4",
    orientation: "portrait"
  }
});
```

### Abordagem 2: Dividir Conteúdo em Páginas Virtuais

Criar um componente que divide o conteúdo em blocos de altura fixa (considerando a altura de uma página A4 menos margens):

- Altura útil de uma página A4: ~247mm (297mm - 50mm de margens)
- Cada "página virtual" terá altura máxima definida
- Adicionar margem inferior em cada página virtual

---

## Alterações Necessárias

### 1. PDFExportButton.tsx

Adicionar margem nas opções do PDF:

```typescript
import { usePDF, Margin } from "react-to-pdf";

const { toPDF, targetRef } = usePDF({
  filename,
  page: {
    margin: Margin.MEDIUM, // 20mm de margem
    format: "A4",
    orientation: "portrait"
  }
});
```

### 2. LandingPagePDFTemplate.tsx

Ajustar o container principal para considerar as margens:

```typescript
<div style={{ 
  width: "210mm",
  // Remover padding interno (a margem será adicionada pelo PDF)
  padding: "0",
  backgroundColor: "#ffffff",
  // ...
}}>
  {/* Cada seção como bloco independente */}
  <div style={{
    padding: "10mm",
    marginBottom: "5mm",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  }}>
    {/* Conteúdo da seção */}
  </div>
</div>
```

### 3. Criar Componente de Página (Opcional)

Para controle mais preciso, criar um wrapper de página:

```typescript
const PDFPage = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    minHeight: "247mm", // Altura útil de A4 - margens
    pageBreakAfter: "always",
    pageBreakInside: "avoid",
    padding: "10mm 0",
  }}>
    {children}
  </div>
);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/export/PDFExportButton.tsx` | Adicionar `Margin.MEDIUM` nas opções |
| `src/components/export/LandingPagePDFTemplate.tsx` | Ajustar padding e estrutura |
| `src/components/export/OfferPDFTemplate.tsx` | Ajustar padding e estrutura |

---

## Valores de Margin Disponíveis

O `react-to-pdf` oferece:

| Constante | Valor |
|-----------|-------|
| `Margin.NONE` | 0mm |
| `Margin.SMALL` | 10mm |
| `Margin.MEDIUM` | 20mm |
| `Margin.LARGE` | 30mm |

---

## Resultado Esperado

- Margem de 20mm em todas as bordas de cada página
- Conteúdo não será cortado nas transições de página
- Espaço adequado entre final de uma página e início da próxima
- Layout profissional e legível

