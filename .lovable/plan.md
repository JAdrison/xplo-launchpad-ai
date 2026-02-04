
# Correcoes do PDF de Ofertas e Plano de Geracao de Demanda

## Problemas Identificados

Analisando o PDF enviado e o codigo, identifiquei 4 problemas principais:

| Problema | Causa Raiz |
|----------|------------|
| Edicoes com caneta nao salvam | Estado local nao sincroniza com o PDF |
| Plano de Geracao ausente no PDF | Template nao inclui a secao demand_generation_strategies |
| PDF nao atualiza | Componente recebe dados antigos do banco |
| Sem edicao do Plano de Demanda | Nao existe UI para personalizar |

---

## Solucao Proposta

### 1. Sincronizar Edicoes com PDF

O problema esta no fluxo de dados:
- Usuario edita texto com caneta: atualiza estado local
- Usuario clica em PDF: renderiza template com dados antigos
- Dados editados nao sao passados para o PDF

**Correcao:**
- Passar localOptions e localSelected do OfferOptionsSelector para o componente pai
- Atualizar o PDFExportButton para usar os dados mais recentes
- Forcar re-render do PDF quando houver edicoes pendentes

### 2. Adicionar Plano de Demanda ao PDF

O OfferPDFTemplate.tsx precisa incluir uma nova secao completa com:
- Analise do Contexto (nicho, ICP, insight)
- Estrategia Principal (canal, tipo campanha, publicos, criativos)
- Estrategias Complementares
- Funil de Aquisicao (TOFU, MOFU, BOFU)
- Sinergias entre Canais
- Cronograma de Implementacao

### 3. Atualizar o PDF ao Editar

Criar sistema de refresh:
- PDFExportButton recebe key ou refreshKey para forcar re-render
- GeneratedContentViewer passa dados atualizados para o PDF

### 4. Editor do Plano de Demanda

Criar novo componente DemandPlanEditor com:
- Campos editaveis para cada secao do plano
- Botao de salvar alteracoes
- Opcao de regenerar com IA

---

## Alteracoes Tecnicas

### Arquivo: src/components/export/OfferPDFTemplate.tsx

Adicionar interface DemandPlan e nova secao no template:

```text
interface DemandPlan {
  context_analysis?: {...}
  primary_strategy?: {...}
  complementary_strategies?: [...]
  acquisition_funnel?: {...}
  channel_synergies?: string[]
  implementation_timeline?: {...}
}

// Nova secao apos CTA Principal:
{demandPlan && (
  <div>
    <h2>PLANO DE GERACAO DE DEMANDA</h2>
    {/* Analise do Contexto */}
    {/* Estrategia Principal */}
    {/* Estrategias Complementares */}
    {/* Funil de Aquisicao */}
    {/* Sinergias */}
    {/* Cronograma */}
  </div>
)}
```

### Arquivo: src/components/generator/OfferOptionsSelector.tsx

Adicionar callback para notificar edicoes pendentes:

```text
interface OfferOptionsSelectorProps {
  // ... existente
  onEditChange?: (hasUnsavedEdits: boolean, currentOptions: GeneratedOptions) => void;
}

// Chamar o callback quando editar
const handleEditOption = (field, idx, newText) => {
  // ... atualiza estado
  onEditChange?.(true, localOptions);
};
```

### Arquivo: src/components/generator/GeneratedContentViewer.tsx

- Passar dados atualizados para o PDFExportButton
- Criar estado para armazenar edicoes pendentes por oferta
- Adicionar editor do Plano de Demanda

### Novo Arquivo: src/components/generator/DemandPlanEditor.tsx

Componente para editar o plano de geracao de demanda com:
- Secao de Analise do Contexto (3 campos texto)
- Secao de Estrategia Principal (canal, campanha, publicos, criativos, budget)
- Secao de Estrategias Complementares (array de items editaveis)
- Secao de Funil (TOFU, MOFU, BOFU)
- Secao de Sinergias (lista editavel)
- Secao de Cronograma (3 periodos)
- Botao Salvar e Regenerar

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/export/OfferPDFTemplate.tsx` | Adicionar secao completa do Plano de Demanda |
| `src/components/generator/OfferOptionsSelector.tsx` | Callback para edicoes pendentes |
| `src/components/generator/GeneratedContentViewer.tsx` | Passar dados atualizados ao PDF + integrar DemandPlanEditor |
| `src/components/export/PDFExportButton.tsx` | Suporte a refresh key |
| `src/components/generator/DemandPlanEditor.tsx` | NOVO - Editor do Plano de Demanda |

---

## Fluxo de Dados Corrigido

```text
Usuario edita texto com caneta
        ↓
OfferOptionsSelector atualiza estado local
        ↓
Callback notifica GeneratedContentViewer
        ↓
GeneratedContentViewer atualiza estado das edicoes
        ↓
PDFExportButton recebe dados atualizados
        ↓
PDF renderiza com dados mais recentes
```

---

## Resultado Esperado

1. Edicoes feitas com caneta aparecem no PDF imediatamente (apos salvar)
2. PDF inclui secao completa do Plano de Geracao de Demanda
3. PDF sempre atualiza quando dados sao modificados
4. Usuario pode editar/personalizar cada parte do Plano de Demanda
5. Botao para regenerar secoes especificas do plano com IA
