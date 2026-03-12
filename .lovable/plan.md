
## PDF de Vídeos: Um vídeo por página

### Situação atual
O `renderVideoAd` usa `cardStyle` com `pageBreakInside: avoid` — isso evita que o conteúdo de um único vídeo seja cortado, mas não força cada vídeo a começar em uma nova página.

### O que será feito

**Apenas `src/components/export/AdsPDFTemplate.tsx`** — 1 arquivo, 1 mudança simples:

Substituir o `cardStyle` dos vídeos por um novo `videoCardStyle` que adiciona `pageBreakBefore: "always"` em todos exceto o primeiro (`idx === 0`).

```text
Antes: cardStyle → breakInside: avoid, marginBottom: 10mm
Depois: videoCardStyle → breakBefore: "page" (exceto índice 0)
        + pageBreakBefore: "always" (exceto índice 0)
        + keepInside intacto
```

O título da seção "🎬 ROTEIROS DE VÍDEO" também receberá `pageBreakBefore: "always"` para garantir que a seção de vídeos sempre comece numa página limpa (separada dos estáticos).

### Resultado visual no PDF
```
Página 1-N: Anúncios estáticos (comportamento atual)
Página N+1: Título "ROTEIROS DE VÍDEO" + Vídeo 1
Página N+2: Vídeo 2
Página N+3: Vídeo 3
...
```
