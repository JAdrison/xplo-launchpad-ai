
# Documento PDF do Onboarding X1

## Resumo

Criar um documento PDF formatado para download com todas as informacoes coletadas durante o Onboarding X1: Produto, ICPs (Publico), Dores (Problema) e Promessa.

---

## 1. Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/export/OnboardingPDFTemplate.tsx` | Template visual do PDF do Onboarding com logo XPLO |

---

## 2. Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/export/PDFExportButton.tsx` | Adicionar suporte ao tipo "onboarding" |
| `src/components/client/OnboardingX1Section.tsx` | Adicionar botao de download PDF |

---

## 3. Controle de Margens e Quebra de Pagina

### Estrategia de Margens

Para garantir que o conteudo nunca chegue ate o final da pagina e nao seja cortado:

```typescript
// Margem inferior de seguranca (equivalente a ~3 linhas de texto)
const BOTTOM_MARGIN = "15mm"; // ~3 linhas de 12pt

// Estilo base para cada secao
const sectionStyle = {
  marginBottom: "20px",
  paddingBottom: "15mm", // Margem de seguranca
  pageBreakInside: "avoid" as const,
  breakInside: "avoid" as const,
};

// Container com area util limitada
const containerStyle = {
  width: "210mm",
  padding: "5mm",
  paddingBottom: "20mm", // Margem extra no final de cada "pagina virtual"
};
```

### Regras de Quebra de Pagina

1. Cada secao tera `pageBreakInside: avoid` para nao ser dividida
2. Padding inferior de 15mm em cada secao (3 linhas de seguranca)
3. Se uma secao nao couber, vai inteira para a proxima pagina
4. Elementos individuais (ICPs, dores) tambem terao protecao contra corte

---

## 4. Template do PDF do Onboarding

```text
+----------------------------------------------------------+
| [LOGO XPLO]                     01 de Fevereiro de 2026  |
+----------------------------------------------------------+
|                                                          |
|              ONBOARDING X1                               |
|              Cliente: Nome do Cliente                    |
|                                                          |
|  --------------------------------------------------------|
|                                                          |
|  PRODUTO                                                 |
|  Nome: Consultoria de Marketing Digital                  |
|  Descricao: [texto descritivo]                           |
|                                                          |
|  Diferenciais:                                           |
|  - Atendimento personalizado                             |
|  - Metodologia propria                                   |
|                                                          |
|                                                          |
|  [MARGEM DE 3 LINHAS ANTES DO FINAL DA PAGINA]           |
|                                                          |
+----------------------------------------------------------+
                    QUEBRA DE PAGINA
+----------------------------------------------------------+
|                                                          |
|  PERFIL DO CLIENTE IDEAL (ICPs)                          |
|                                                          |
|  1. Empresarios de Tecnologia                            |
|     Segmento: B2B SaaS                                   |
|     ...                                                  |
```

---

## 5. Interface do OnboardingPDFTemplate

```typescript
interface OnboardingPDFTemplateProps {
  clientName: string;
  createdAt: string;
  product: {
    name: string;
    description: string;
    differentiators: string[];
  };
  icps: Array<{
    name: string;
    segment: string;
    characteristics: string;
    current_situation: string;
  }>;
  pains: Array<{
    icp_name: string;
    main_pain: string;
    consequence: string;
    daily_impacts: string[];
  }>;
  promise: string;
}
```

---

## 6. Estilos com Protecao de Margem

```typescript
// Estilo para secoes principais
const sectionStyle = {
  marginBottom: "25px",
  paddingBottom: "15mm", // 3 linhas de margem de seguranca
  pageBreakInside: "avoid" as const,
  breakInside: "avoid" as const,
};

// Estilo para itens individuais (cada ICP, cada dor)
const itemStyle = {
  marginBottom: "12px",
  paddingBottom: "8px",
  pageBreakInside: "avoid" as const,
  breakInside: "avoid" as const,
};

// Estilo para o titulo de secao
const sectionTitleStyle = {
  fontSize: "14pt",
  fontWeight: "600" as const,
  color: "#7c3aed",
  marginBottom: "12px",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "6px",
  pageBreakAfter: "avoid" as const, // Nunca quebrar logo apos um titulo
};
```

---

## 7. Alteracao no PDFExportButton

Adicionar suporte ao novo tipo:

```typescript
type: "offer" | "landing-page" | "onboarding"
```

---

## 8. Botao de Download no OnboardingX1Section

Adicionar botao ao lado do badge de status, visivel quando houver dados:

```text
+----------------------------------------------------------+
| Onboarding X1    [Concluido] [PDF]                       |
+----------------------------------------------------------+
```

---

## 9. Fluxo do Usuario

1. Usuario acessa o perfil do cliente
2. Na secao "Onboarding X1", clica no botao "PDF"
3. Sistema gera PDF com todas as informacoes do onboarding
4. Download inicia automaticamente
   - Nome do arquivo: `onboarding-x1-nome-cliente-01-02-2026.pdf`

---

## 10. Checklist de Margens

| Elemento | Margem Inferior | pageBreakInside |
|----------|-----------------|-----------------|
| Container principal | 20mm | - |
| Secao Produto | 15mm | avoid |
| Secao ICPs | 15mm | avoid |
| Cada ICP individual | 8px | avoid |
| Secao Dores | 15mm | avoid |
| Cada Dor individual | 8px | avoid |
| Secao Promessa | 15mm | avoid |
| Titulo de secao | - | pageBreakAfter: avoid |

---

## Resultado Esperado

- Documento profissional com marca XPLO
- Margem de seguranca de 3 linhas (~15mm) antes do final de cada pagina
- Secoes nunca cortadas no meio
- Titulos nunca separados do conteudo
- Transicao suave entre paginas com espaco adequado
