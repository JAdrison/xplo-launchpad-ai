
# Atualização: VideoAdCard + Exportação PDF de Anúncios

## Visão Geral

Implementar três funcionalidades:
1. **VideoAdCard**: Componente com checkboxes para selecionar seções + edição inline de texto
2. **PDF de Anúncios**: Exportar todos os anúncios (estáticos e vídeos) em PDF profissional
3. **Sincronização**: PDF atualiza automaticamente quando salvar, excluir ou personalizar textos

---

## Parte 1: VideoAdCard com Seleção e Edição

### Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| Checkboxes por seção | Escolher quais seções incluir ao copiar |
| Opacidade visual | Seções desmarcadas ficam esmaecidas |
| Edição inline | Ícone de lápis abre textarea para editar |
| Salvamento | Atualiza no banco e dispara refresh do PDF |

### Estrutura do Componente

```text
VideoAdCard
├── Header (tipo, duração, botões)
├── Seções (7 seções com checkbox + edição)
│   ├── [✓] HOOK          [✏️]
│   ├── [✓] PROBLEMA      [✏️]
│   ├── [✓] POR QUE RUIM  [✏️]
│   ├── [✓] SOLUÇÃO       [✏️]
│   ├── [✓] PROVA         [✏️]
│   ├── [✓] CTA           [✏️]
│   └── [✓] NOTAS VISUAIS [✏️]
└── Modo Edição (textarea + Salvar/Cancelar)
```

### Props do Componente

| Prop | Tipo | Descrição |
|------|------|-----------|
| `ad` | `Ad` | Objeto do anúncio |
| `onDelete` | `() => void` | Callback de exclusão |
| `onRefine` | `() => void` | Abre chat de refinamento |
| `onUpdate` | `(ad: Ad) => void` | Atualiza estado local após edição |

---

## Parte 2: PDF de Anúncios

### Estrutura do Template

```text
┌─────────────────────────────────────┐
│  [LOGO XPLO]              [Data]   │
│  ═══════════════════════════════   │
│          ANÚNCIOS GERADOS          │
│          Cliente: [Nome]            │
├─────────────────────────────────────┤
│                                     │
│  ═══ ESTÁTICOS (DORES) ═══          │
│  ┌─────────────────────────────┐    │
│  │ Dor Principal               │    │
│  │ Headline: ...               │    │
│  │ Subheadline: ...            │    │
│  │ Copy: ...                   │    │
│  │ • SEM X • SEM Y • SEM Z     │    │
│  │ CTA: ...                    │    │
│  └─────────────────────────────┘    │
│  (repete para cada anúncio)         │
│                                     │
│  ═══ ESTÁTICOS (DESEJOS) ═══        │
│  (mesma estrutura)                  │
│                                     │
│  ═══ ROTEIROS DE VÍDEO ═══          │
│  ┌─────────────────────────────┐    │
│  │ [Quebra de Padrão] [30s]    │    │
│  │ ─────────────────────────── │    │
│  │ HOOK: ...                   │    │
│  │ PROBLEMA: ...               │    │
│  │ POR QUE RUIM: ...           │    │
│  │ SOLUÇÃO: ...                │    │
│  │ PROVA: ...                  │    │
│  │ CTA: ...                    │    │
│  │ ─────────────────────────── │    │
│  │ NOTAS VISUAIS: ...          │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Controle de Quebra de Página

| Elemento | Regra CSS |
|----------|-----------|
| Cada card de anúncio | `page-break-inside: avoid; break-inside: avoid` |
| Seções principais | `margin-bottom: 15mm` (buffer de segurança) |
| Título de categoria | `page-break-after: avoid` |
| Container global | `padding: 15mm` (margens seguras) |

---

## Parte 3: Sincronização com PDF

### Mecanismo de Atualização

```text
Ação do Usuário         →    Dispara refreshKey    →    PDF Regenera
─────────────────────────────────────────────────────────────────────
Editar texto inline      →    setRefreshKey(+1)     →    Template atualiza
Salvar via Refiner       →    setRefreshKey(+1)     →    Template atualiza
Excluir anúncio          →    setAds(filtered)      →    Template atualiza
```

### Estado a Gerenciar

```text
// No GeneratedContentViewer
const [adsRefreshKey, setAdsRefreshKey] = useState(0);

// Passa como prop para VideoAdCard
onUpdate={(updatedAd) => {
  setAds(prev => prev.map(a => a.id === updatedAd.id ? updatedAd : a));
  setAdsRefreshKey(k => k + 1);
}}
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/generator/VideoAdCard.tsx` | Card de vídeo com seleção e edição |
| `src/components/export/AdsPDFTemplate.tsx` | Template PDF para anúncios |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/export/PDFExportButton.tsx` | Adicionar type "ads" |
| `src/components/generator/GeneratedContentViewer.tsx` | Usar VideoAdCard, adicionar botão PDF, gerenciar refreshKey |

---

## Implementação Detalhada

### 1. VideoAdCard.tsx

**Estado Local:**
```text
selectedSections: Record<string, boolean>  // Quais seções estão marcadas
editingSection: string | null              // Qual seção está em modo edição
editValue: string                          // Valor temporário durante edição
isSaving: boolean                          // Loading de salvamento
```

**Fluxo de Edição:**
1. Clica no ícone de lápis → `setEditingSection("hook")`
2. Digita no textarea → `setEditValue(novoTexto)`
3. Clica Salvar → Chama `supabase.from('ads').update()` → `onUpdate(adAtualizado)`
4. Clica Cancelar → `setEditingSection(null)`

**Cópia Seletiva:**
```text
const copyScript = () => {
  const parts = [];
  if (selectedSections.hook) parts.push(`HOOK:\n${content.hook}`);
  if (selectedSections.problem) parts.push(`PROBLEMA:\n${content.problem}`);
  // ... etc
  navigator.clipboard.writeText(parts.join('\n\n'));
};
```

### 2. AdsPDFTemplate.tsx

**Props:**
```text
interface AdsPDFTemplateProps {
  clientName: string;
  createdAt: string;
  videoAds: Ad[];
  staticAds: Ad[];
}
```

**Estilos para Evitar Quebra:**
```text
const cardStyle = {
  pageBreakInside: "avoid",
  breakInside: "avoid",
  marginBottom: "10mm",
  padding: "12px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px"
};

const sectionDividerStyle = {
  marginTop: "20px",
  marginBottom: "15mm",
  pageBreakAfter: "avoid"
};
```

### 3. PDFExportButton.tsx

**Adicionar novo tipo:**
```text
interface PDFExportButtonProps {
  type: "offer" | "landing-page" | "onboarding" | "ads";  // ← Adiciona "ads"
  // ...
  ads?: Ad[];  // ← Nova prop para anúncios
}

// No template hidden
{type === "ads" && (
  <AdsPDFTemplate 
    clientName={clientName}
    createdAt={createdAt}
    videoAds={content.videoAds}
    staticAds={content.staticAds}
  />
)}
```

### 4. GeneratedContentViewer.tsx

**Adicionar no header da seção de anúncios:**
```text
<div className="flex items-center gap-1">
  <PDFExportButton
    type="ads"
    clientName={clientName}
    content={{
      videoAds: videoAds,
      staticAds: staticAds
    }}
    refreshKey={adsRefreshKey}
  />
</div>
```

**Substituir `renderVideoAd` por componente:**
```text
{videoAds.map(ad => (
  <VideoAdCard
    key={ad.id}
    ad={ad}
    onDelete={() => handleDeleteAd(ad.id)}
    onRefine={() => openRefiner(ad, "video")}
    onUpdate={(updated) => {
      setAds(prev => prev.map(a => a.id === updated.id ? updated : a));
      setAdsRefreshKey(k => k + 1);
    }}
  />
))}
```

---

## Resultado Esperado

1. Cada roteiro de vídeo tem checkboxes para selecionar seções
2. Seções desmarcadas aparecem com opacidade reduzida
3. Botão de copiar respeita apenas seções selecionadas
4. Ícone de lápis em cada seção permite edição inline
5. Edições salvam no banco e atualizam PDF automaticamente
6. Botão "PDF" na seção de anúncios exporta documento profissional
7. PDF inclui todos os estáticos (separados por Dores/Desejos) + vídeos
8. Cada card no PDF não quebra entre páginas
9. Margens seguras de 15mm no início e fim das páginas
