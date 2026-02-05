
# Correção: Scripts de Vídeo Não Aparecem

## Diagnóstico

O problema é que existem **dois componentes diferentes** renderizando anúncios de vídeo:

| Componente | Usado Em | Status |
|------------|----------|--------|
| `GeneratedContentViewer.tsx` | Página Generator | Usa `VideoAdCard` - Funciona |
| `GeneratedAssetsSection.tsx` | Página ClientDetails | Usa formato legado - NAO funciona |

### Causa Raiz

O `GeneratedAssetsSection.tsx` (linhas 660-732) ainda tenta ler os dados do campo `script` (formato antigo):

```text
const script = ad.script as VideoScript;
// ...
{script?.hook && <p>{script.hook}</p>}
{script?.body && <p>{script.body}</p>}
{script?.cta && <p>{script.cta}</p>}
```

Porém os novos anúncios armazenam os dados nas colunas diretas:
- `video_hook`
- `video_problem`
- `video_why_bad`
- `video_solution`
- `video_proof`
- `video_cta`
- `video_visual_notes`
- `video_duration`

A consulta ao banco confirmou que o campo `script` está `nil` (nulo), enquanto as colunas `video_*` contêm o conteúdo.

---

## Solucao

Atualizar o `GeneratedAssetsSection.tsx` para usar o componente `VideoAdCard` que já funciona corretamente no `GeneratedContentViewer.tsx`.

### Alteracoes no GeneratedAssetsSection.tsx

1. **Importar o componente VideoAdCard**
2. **Adicionar estado para gerenciar atualizações** (handleAdUpdate)
3. **Substituir o renderizador de vídeos legado pelo VideoAdCard**

### Codigo Atualizado

**Imports:**
```typescript
import { VideoAdCard } from "@/components/generator/VideoAdCard";
```

**Handler para atualizações:**
```typescript
const handleAdUpdate = (updatedAd: Ad) => {
  setAds((prev) => prev.map((a) => (a.id === updatedAd.id ? updatedAd : a)));
};
```

**Seção de Video Ads (substituir linhas 656-733):**
```typescript
{videoAds.length > 0 && (
  <div className="space-y-3">
    <h4 className="text-sm font-medium">Scripts de Vídeo</h4>
    {videoAds.map((ad) => (
      <VideoAdCard
        key={ad.id}
        ad={ad}
        onDelete={() => handleDeleteAd(ad.id)}
        onRefine={() => {}} // Refiner não disponível nesta view
        onUpdate={handleAdUpdate}
        isDeleting={deletingId === ad.id}
      />
    ))}
  </div>
)}
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/client/GeneratedAssetsSection.tsx` | Usar `VideoAdCard` em vez do renderer legado |

---

## Resultado Esperado

1. Os scripts de vídeo aparecerao com todo o conteúdo (Hook, Problema, Por que é ruim, Solucao, Prova, CTA, Notas Visuais)
2. Checkboxes para selecionar secoes ao copiar
3. Edicao inline de cada secao
4. Compatibilidade tanto com dados legados quanto novos
