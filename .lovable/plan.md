

# Correção: Conteúdo Aparecendo como JSON Bruto

## Diagnóstico

A IA está retornando cada seção como um **objeto JSON aninhado** em vez de strings simples:

| Campo | Esperado | Retornado |
|-------|----------|-----------|
| `video_hook` | `"Seu sistema de energia..."` | `{"text":"Seu sistema...", "visual_notes":"..."}` |
| `video_problem` | `"Você investiu em..."` | `{"text":"Você investiu...", "visual_notes":"..."}` |

### Causa Raiz

O prompt na edge function pede um formato, mas a IA está usando outro. O modelo está combinando `text` + `visual_notes` em cada campo em vez de separá-los.

---

## Solução

Duas correções paralelas para garantir robustez:

### 1. Ajustar o Prompt (prevenção)

Deixar o prompt mais explícito sobre o formato esperado:

```text
JSON esperado (strings simples, NÃO objetos):
{
  "video_type": "tipo",
  "duration": "30s",
  "hook": "texto do hook aqui",
  "problem": "texto do problema aqui",
  "why_bad": "texto aqui",
  "solution": "texto aqui",
  "proof": "texto aqui", 
  "cta": "texto aqui",
  "visual_notes": "notas visuais combinadas aqui"
}
```

### 2. Tratar Resposta da IA (correção)

Adicionar lógica para extrair o texto se a IA retornar objeto:

```text
// Se a IA retornar objeto, extrair o texto
const extractText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    return (value as any).text || JSON.stringify(value);
  }
  return '';
};
```

---

## Alterações Detalhadas

### Arquivo: supabase/functions/generate-content/index.ts

**Handler `create-video-ad` - Melhorar prompt:**

```text
const videoPrompt = `${adCtx}

Instrução do usuário: ${instruction}

IMPORTANTE: Retorne APENAS strings simples em cada campo, NÃO objetos.
Retorne visual_notes como um único campo com todas as notas visuais combinadas.

JSON (valores devem ser strings, não objetos):
{
  "video_type": "tipo do vídeo",
  "duration": "duração em segundos",
  "hook": "texto do hook",
  "problem": "texto do problema",
  "why_bad": "texto de por que é ruim",
  "solution": "texto da solução",
  "proof": "texto da prova",
  "cta": "texto do CTA",
  "visual_notes": "todas as notas visuais combinadas"
}`;
```

**Adicionar função de extração:**

```text
function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    // Se tiver campo 'text', usar ele
    if (typeof obj.text === 'string') return obj.text;
    // Senão, serializar
    return JSON.stringify(value);
  }
  return '';
}

function extractVisualNotes(res: Record<string, unknown>): string {
  // Coletar visual_notes de cada seção se existirem
  const notes: string[] = [];
  const fields = ['hook', 'problem', 'why_bad', 'solution', 'proof', 'cta'];
  
  for (const f of fields) {
    if (typeof res[f] === 'object' && res[f] !== null) {
      const vn = (res[f] as any).visual_notes;
      if (vn) notes.push(`${f.toUpperCase()}: ${vn}`);
    }
  }
  
  // Se tiver visual_notes global, adicionar
  if (res.visual_notes) {
    notes.push(extractText(res.visual_notes));
  }
  
  return notes.join('\n\n') || '';
}
```

**Atualizar inserção no banco:**

```text
const { data: newAd, error: insertError } = await supabase.from('ads').insert({
  client_id: clientId,
  asset_type: 'video_ad',
  video_type: extractText(videoRes.video_type) || 'Personalizado',
  video_hook: extractText(videoRes.hook),
  video_problem: extractText(videoRes.problem),
  video_why_bad: extractText(videoRes.why_bad),
  video_solution: extractText(videoRes.solution),
  video_proof: extractText(videoRes.proof),
  video_cta: extractText(videoRes.cta),
  video_duration: extractText(videoRes.duration),
  video_visual_notes: extractVisualNotes(videoRes),
  headline: extractText(videoRes.video_type) || 'Anúncio Personalizado'
}).select().single();
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-content/index.ts` | Melhorar prompt + adicionar extração de texto |

---

## Correção dos Dados Existentes

Após implementar a correção, o anúncio problemático pode ser:
1. **Excluído** e recriado com o novo fluxo
2. Ou **editado manualmente** usando o ícone de lápis para remover o JSON

---

## Resultado Esperado

1. Novos anúncios criados aparecem com texto limpo
2. Cada seção mostra apenas o texto, sem `{"text":"...", "visual_notes":"..."}`
3. Notas visuais são combinadas e exibidas corretamente na seção dedicada

