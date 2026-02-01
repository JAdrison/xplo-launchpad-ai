
# Formatacao de Texto e Exportacao PDF com Logo XPLO

## Resumo

Implementar duas funcionalidades principais:
1. **Formatacao de texto** nas secoes da LP
2. **Exportacao PDF** para Ofertas e Landing Pages com a logo XPLO no canto do documento

---

## 1. Arquivos a Criar

### Novos Componentes

| Arquivo | Descricao |
|---------|-----------|
| `src/components/ui/text-editor.tsx` | Editor de texto simples com formatacao (negrito, italico, etc.) |
| `src/components/export/PDFExportButton.tsx` | Botao que dispara exportacao PDF |
| `src/components/export/OfferPDFTemplate.tsx` | Template visual do PDF da Oferta com logo XPLO |
| `src/components/export/LandingPagePDFTemplate.tsx` | Template visual do PDF da LP com logo XPLO |

---

## 2. Template do PDF com Logo XPLO

A logo existente em `src/assets/logo-xplo.png` sera utilizada no canto superior esquerdo dos PDFs:

```text
+----------------------------------------------------------+
| [LOGO XPLO]                     Data: 01/02/2026         |
| (pequeno, ~60px)                                         |
|----------------------------------------------------------|
|                                                          |
|  TITULO DO DOCUMENTO                                     |
|  Cliente: Nome do Cliente                                |
|                                                          |
|  ────────────────────────────────────────────            |
|                                                          |
|  CONTEUDO DO DOCUMENTO                                   |
|  ...                                                     |
|                                                          |
+----------------------------------------------------------+
```

---

## 3. Dependencia Necessaria

Instalar a biblioteca `react-to-pdf` para geracao de PDF:

```json
"react-to-pdf": "^1.0.1"
```

---

## 4. Componente TextEditor

Editor de texto simples com barra de ferramentas:

- Botao **Negrito** (B)
- Botao **Italico** (I)  
- Botao **Sublinhado** (U)
- Botao **Lista com marcadores**

O texto formatado sera salvo como HTML no banco de dados.

---

## 5. Alteracoes em Arquivos Existentes

| Arquivo | Acao |
|---------|------|
| `package.json` | Adicionar dependencia react-to-pdf |
| `src/components/generator/LandingPageViewer.tsx` | Adicionar botao PDF no cabecalho |
| `src/components/client/GeneratedAssetsSection.tsx` | Adicionar botao PDF em ofertas e LPs |
| `src/components/generator/GeneratedContentViewer.tsx` | Adicionar botao PDF |

---

## 6. Estrutura do PDFExportButton

```typescript
import { usePDF } from 'react-to-pdf';
import logoXplo from "@/assets/logo-xplo.png";

const PDFExportButton = ({ content, type, clientName }) => {
  const { toPDF, targetRef } = usePDF({ 
    filename: `${type}-${clientName}-${new Date().toLocaleDateString('pt-BR')}.pdf` 
  });
  
  return (
    <>
      <Button onClick={() => toPDF()}>
        <FileDown className="h-4 w-4 mr-1" />
        PDF
      </Button>
      
      {/* Template invisivel para geracao */}
      <div ref={targetRef} className="absolute left-[-9999px]">
        {type === 'offer' ? (
          <OfferPDFTemplate content={content} logo={logoXplo} clientName={clientName} />
        ) : (
          <LandingPagePDFTemplate content={content} logo={logoXplo} clientName={clientName} />
        )}
      </div>
    </>
  );
};
```

---

## 7. Template PDF da Oferta

```text
+----------------------------------------------------------+
| [LOGO XPLO]                     01 de Fevereiro de 2026  |
+----------------------------------------------------------+
|                                                          |
|              OFERTA IRRESISTIVEL                         |
|              Cliente: XPLO Solar                         |
|                                                          |
|  ────────────────────────────────────────────            |
|                                                          |
|  PROMESSA PRINCIPAL                                      |
|  [Conteudo formatado]                                    |
|                                                          |
|  MECANISMO UNICO                                         |
|  [Conteudo formatado]                                    |
|                                                          |
|  GARANTIA                                                |
|  [Conteudo formatado]                                    |
|                                                          |
|  PILHA DE VALOR                                          |
|  • Item 1 ...................... R$ 997                  |
|  • Item 2 ...................... R$ 497                  |
|                                                          |
|  CTA PRINCIPAL                                           |
|  [Conteudo formatado]                                    |
|                                                          |
+----------------------------------------------------------+
```

---

## 8. Template PDF da Landing Page

```text
+----------------------------------------------------------+
| [LOGO XPLO]                     01 de Fevereiro de 2026  |
+----------------------------------------------------------+
|                                                          |
|              LANDING PAGE - CONSULTIVA                   |
|              Cliente: Nome do Cliente                    |
|                                                          |
|  ────────────────────────────────────────────            |
|                                                          |
|  HERO                                                    |
|  Headline: [texto]                                       |
|  Subheadline: [texto]                                    |
|                                                          |
|  PROBLEMAS E DORES                                       |
|  • Problema 1                                            |
|  • Problema 2                                            |
|                                                          |
|  SOLUCAO                                                 |
|  [Descricao]                                             |
|                                                          |
|  BENEFICIOS                                              |
|  • Beneficio 1: descricao                                |
|  • Beneficio 2: descricao                                |
|                                                          |
|  ... (demais 6 secoes)                                   |
|                                                          |
+----------------------------------------------------------+
```

---

## 9. Interface do Botao PDF

O botao sera adicionado ao lado do botao de excluir:

```text
+----------------------------------------------------------+
| LP Consultiva             [Data] [📋] [📄 PDF] [🗑️]      |
|----------------------------------------------------------|
| Hero                                                      |
| ...                                                       |
+----------------------------------------------------------+
```

---

## 10. Fluxo do Usuario

### Exportacao PDF
1. Usuario visualiza uma Oferta ou LP
2. Clica no botao "PDF" ao lado do documento
3. PDF e gerado com a logo XPLO no canto superior esquerdo
4. Download inicia automaticamente
   - Nome do arquivo: `oferta-nome-cliente-01-02-2026.pdf`
   - ou `landing-page-nome-cliente-01-02-2026.pdf`

### Formatacao de Texto (futuro)
1. Usuario clica em "Editar" em uma secao
2. Editor aparece com barra de formatacao
3. Usuario formata o texto
4. Salva as alteracoes no banco

---

## Beneficios

- Logo XPLO presente em todos os PDFs gerados
- Documentos profissionais para compartilhar com clientes
- Formatacao persistida no banco de dados
- Facil exportacao com um clique
