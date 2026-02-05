
# PDF de Anúncios + Refinar com IA na Página de Detalhes

## Visão Geral

Adicionar duas funcionalidades na página de detalhes do cliente (`GeneratedAssetsSection.tsx`):
1. **Botão PDF** - Exportar todos os anúncios (estáticos + vídeos) em documento profissional
2. **Refinar com IA** - O botão "Refinar" abre o chat para enviar prompts à IA

---

## Parte 1: Botão de Exportar PDF

### Localização

O botão será adicionado no header da seção de Anúncios, similar ao que já existe no `GeneratedContentViewer.tsx`:

```text
┌─────────────────────────────────────────────────────────┐
│ ▼ Anúncios (5 estáticos, 5 vídeos) [Gerados]     [PDF] │
├─────────────────────────────────────────────────────────┤
│   ...conteúdo dos anúncios...                          │
└─────────────────────────────────────────────────────────┘
```

### Implementação

1. Importar `PDFExportButton` (já está importado no arquivo)
2. Adicionar estado `adsRefreshKey` para sincronização
3. Adicionar o botão no AccordionTrigger ou logo após o AccordionContent abrir

---

## Parte 2: Integração do AdsRefinerChat

### Problema Atual

O componente `VideoAdCard` recebe `onRefine={() => {}}` - uma função vazia que não faz nada.

### Solução

1. Importar `AdsRefinerChat`
2. Adicionar estados para controlar o dialog:
   - `refinerOpen: boolean`
   - `selectedAd: { ad: Ad; type: "video" | "static" } | null`
3. Criar funções:
   - `openRefiner(ad, type)` - abre o dialog
   - `handleApplyRefinement(newContent)` - salva no banco e atualiza estado local
4. Adicionar o componente `AdsRefinerChat` no final do JSX
5. Passar `onRefine={() => openRefiner(ad, "video")}` para VideoAdCard

---

## Alterações Detalhadas

### Estados a Adicionar

```text
const [refinerOpen, setRefinerOpen] = useState(false);
const [selectedAd, setSelectedAd] = useState<{ ad: Ad; type: "video" | "static" } | null>(null);
const [adsRefreshKey, setAdsRefreshKey] = useState(0);
```

### Funções a Adicionar

```text
const openRefiner = (ad: Ad, type: "video" | "static") => {
  setSelectedAd({ ad, type });
  setRefinerOpen(true);
};

const handleApplyRefinement = async (newContent: any) => {
  if (!selectedAd) return;
  
  const updateData = selectedAd.type === "video" 
    ? { video_hook: newContent.hook, video_problem: newContent.problem, ... }
    : { headline: newContent.headline, subheadline: newContent.subheadline, ... };
  
  await supabase.from("ads").update(updateData).eq("id", selectedAd.ad.id);
  
  // Atualiza estado local
  handleAdUpdate({ ...selectedAd.ad, ...updateData });
  setAdsRefreshKey(k => k + 1);
  toast.success("Anúncio refinado com sucesso!");
};
```

### VideoAdCard - Atualizar onRefine

De:
```text
onRefine={() => {}}
```

Para:
```text
onRefine={() => openRefiner(ad, "video")}
```

### Adicionar AdsRefinerChat no JSX

Adicionar antes do fechamento do return, similar ao `GeneratedContentViewer`:

```text
{selectedAd && (
  <AdsRefinerChat
    isOpen={refinerOpen}
    onClose={() => { setRefinerOpen(false); setSelectedAd(null); }}
    adId={selectedAd.ad.id}
    adType={selectedAd.type}
    currentContent={...}
    onApply={handleApplyRefinement}
  />
)}
```

### Adicionar Botão PDF

Dentro do AccordionContent da seção de Anúncios:

```text
<AccordionContent className="space-y-4 pt-4">
  {/* PDF Export Button */}
  <div className="flex justify-end mb-2">
    <PDFExportButton
      type="ads"
      clientName={clientName || "cliente"}
      content={{ videoAds, staticAds }}
      createdAt={new Date().toISOString()}
      refreshKey={adsRefreshKey}
    />
  </div>
  
  {/* Static Ads */}
  ...
</AccordionContent>
```

---

## Arquivo a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/components/client/GeneratedAssetsSection.tsx` | Adicionar estados, funções, AdsRefinerChat, botão PDF |

---

## Imports a Adicionar

```text
import { AdsRefinerChat } from "@/components/generator/AdsRefinerChat";
```

---

## Resultado Esperado

1. Botão "PDF" visível na seção de Anúncios da página de detalhes do cliente
2. Ao clicar no PDF, exporta todos os anúncios (estáticos e vídeos) com formatação profissional
3. Ao clicar em "Refinar" em qualquer vídeo, abre dialog para digitar instruções
4. Usuário digita "mais agressivo", IA refina o anúncio
5. Ao aplicar, salva no banco e atualiza a visualização + PDF automaticamente
