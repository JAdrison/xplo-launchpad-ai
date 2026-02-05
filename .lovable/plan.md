

# Remover Bloco "PROVA" dos Anúncios de Vídeo

## Visão Geral

Remover completamente a seção "PROVA" (proof) da estrutura de anúncios de vídeo em todos os componentes, templates e edge function.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/generator/VideoAdCard.tsx` | Remover "proof" do array SECTIONS, VideoContent, COLUMN_MAP e selectedSections |
| `src/components/export/AdsPDFTemplate.tsx` | Remover bloco de renderização do video_proof |
| `supabase/functions/generate-content/index.ts` | Remover "proof" dos prompts e mapeamentos |

---

## Alterações Detalhadas

### 1. VideoAdCard.tsx

**Remover de SECTIONS (linha 61):**
```text
De:
  { key: "solution", label: "SOLUÇÃO" },
  { key: "proof", label: "PROVA" },
  { key: "cta", label: "CTA" },

Para:
  { key: "solution", label: "SOLUÇÃO" },
  { key: "cta", label: "CTA" },
```

**Remover de VideoContent (linha 48):**
```text
De:
  solution: string;
  proof: string;
  cta: string;

Para:
  solution: string;
  cta: string;
```

**Remover de COLUMN_MAP (linha 71):**
```text
Remover: proof: "video_proof",
```

**Remover de videoContent (linha 94):**
```text
Remover: proof: ad.video_proof || "",
```

**Remover de selectedSections inicial (linha 105):**
```text
Remover: proof: true,
```

---

### 2. AdsPDFTemplate.tsx

**Remover bloco de renderização (linhas 189-194):**
```text
Remover:
      {ad.video_proof && (
        <div style={videoSectionStyle}>
          <p style={...}>PROVA</p>
          <p style={...}>{ad.video_proof}</p>
        </div>
      )}
```

---

### 3. Edge Function (generate-content/index.ts)

**Remover de extractVisualNotes (linha 66):**
```text
De:
  const fields = ['hook', 'problem', 'why_bad', 'solution', 'proof', 'cta'];

Para:
  const fields = ['hook', 'problem', 'why_bad', 'solution', 'cta'];
```

**Atualizar prompt refine-ad (linha 120):**
```text
De:
  `Refine vídeo:\nHOOK: ${c.hook}\nPROBLEMA: ${c.problem}\nPOR QUE: ${c.why_bad}\nSOLUÇÃO: ${c.solution}\nPROVA: ${c.proof}\nCTA: ${c.cta}\n\nInstrução: ${instruction}\nJSON: {"hook":"","problem":"","why_bad":"","solution":"","proof":"","cta":"","duration":"","visual_notes":""}`

Para:
  `Refine vídeo:\nHOOK: ${c.hook}\nPROBLEMA: ${c.problem}\nPOR QUE: ${c.why_bad}\nSOLUÇÃO: ${c.solution}\nCTA: ${c.cta}\n\nInstrução: ${instruction}\nJSON: {"hook":"","problem":"","why_bad":"","solution":"","cta":"","duration":"","visual_notes":""}`
```

**Atualizar videoSys create-video-ad (linha 186):**
```text
De:
  'Estrutura: HOOK (captura atenção nos primeiros 3s), PROBLEMA (identifica a dor), POR QUE É RUIM (agita o problema), SOLUÇÃO (apresenta o produto), PROVA (credibilidade), CTA (chamada para ação).'

Para:
  'Estrutura: HOOK (captura atenção nos primeiros 3s), PROBLEMA (identifica a dor), POR QUE É RUIM (agita o problema), SOLUÇÃO (apresenta o produto), CTA (chamada para ação).'
```

**Atualizar videoPrompt create-video-ad (linha 187):**
```text
Remover "proof" do JSON esperado
```

**Remover video_proof do insert (linha 200):**
```text
Remover: video_proof: extractText(videoRes.proof),
```

**Atualizar prompt ads batch (linha 217-218):**
```text
De:
  'Crie 5 vídeos (6 seções: HOOK,PROBLEMA,POR QUE É RUIM,SOLUÇÃO,PROVA,CTA, 20-80s)'

Para:
  'Crie 5 vídeos (5 seções: HOOK,PROBLEMA,POR QUE É RUIM,SOLUÇÃO,CTA, 20-80s)'
```

**Remover proof do JSON template ads (linha 218):**
```text
Remover "proof" do objeto video_scripts no JSON
```

**Remover video_proof do insert em batch (linha 222):**
```text
Remover: video_proof: v.proof,
```

---

## Nova Estrutura de Vídeo

| Antes (6 seções) | Depois (5 seções) |
|------------------|-------------------|
| HOOK | HOOK |
| PROBLEMA | PROBLEMA |
| POR QUE É RUIM | POR QUE É RUIM |
| SOLUÇÃO | SOLUÇÃO |
| ~~PROVA~~ | *(removido)* |
| CTA | CTA |
| NOTAS VISUAIS | NOTAS VISUAIS |

---

## Resultado Esperado

1. Anúncios de vídeo terão 5 seções em vez de 6
2. O campo "PROVA" não aparecerá mais no card de vídeo
3. O PDF não incluirá mais a seção "PROVA"
4. Novos anúncios gerados pela IA não terão o campo proof
5. O fluxo de refinamento não pedirá mais proof

