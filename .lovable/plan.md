

# Adicionar 6º Vídeo "Caixinha de Perguntas" à Geração de Anúncios

## Visão Geral

Manter os 5 primeiros vídeos com tipos livres (como está hoje) e adicionar um **6º vídeo obrigatório** do tipo "Caixinha de Perguntas", que sempre terá uma pergunta do cotidiano que abre margem para promover o produto.

---

## Conceito do 6º Vídeo

| Aspecto | Descrição |
|---------|-----------|
| **Tipo** | `question_box` (Caixinha de Perguntas) |
| **Hook** | Uma pergunta real que muitas pessoas fazem no dia-a-dia |
| **Estrutura** | A pergunta funciona como gancho, criando curiosidade |
| **Objetivo** | A resposta abre margem natural para apresentar e promover o produto |
| **Exemplo** | "Por que meus leads não fecham?" → resposta que leva ao produto |

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-content/index.ts` | Atualizar prompt para gerar 6 vídeos (5 livres + 1 caixinha obrigatória) |

---

## Alterações Detalhadas

### Edge Function - generate-content/index.ts

**Linha 231 - Atualizar system prompt:**

```text
De:
sys = 'Ads expert. Crie 5 vídeos (5 seções: HOOK,PROBLEMA,POR QUE É RUIM,SOLUÇÃO,CTA, 20-80s) + 10 estáticos (5 dor, 5 desejo).';

Para:
sys = `Ads expert brasileiro. Crie 6 anúncios de vídeo:
- 5 vídeos criativos com estilos variados (20-80s cada)
- 1 vídeo OBRIGATÓRIO tipo "question_box" (Caixinha de Perguntas): O HOOK deve ser uma pergunta real do cotidiano que muitas pessoas se fazem, uma dúvida genuína que abre margem para responder e naturalmente promover o produto.

Cada vídeo: 5 seções (HOOK, PROBLEMA, POR QUE É RUIM, SOLUÇÃO, CTA).
+ 10 anúncios estáticos (5 baseados em dor, 5 baseados em desejo).`;
```

**Linha 232 - Atualizar user prompt com JSON template:**

```text
De:
prompt = `${ctx}\n${oCtx}\n${bp}\nJSON: {"video_scripts":[{"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""}],...}`;

Para:
prompt = `${ctx}\n${oCtx}\n${bp}

IMPORTANTE para o 6º vídeo (question_box):
- O HOOK deve ser uma PERGUNTA genuína do cotidiano (ex: "Por que eu nunca consigo...", "Será que é normal...", "Como fazer para...")
- A pergunta deve ser algo que o público-alvo realmente se pergunta
- A resposta deve abrir margem natural para apresentar o produto como solução
- video_type DEVE ser "question_box" para este vídeo

JSON: {"video_scripts":[
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"question_box","title":"Caixinha de Perguntas","duration":"","hook":"[PERGUNTA DO COTIDIANO]","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""}
],"static_ads":{...}}`;
```

---

## Exemplo de Saída Esperada

### 6º Vídeo - Caixinha de Perguntas

Para um negócio de energia solar:

| Seção | Conteúdo |
|-------|----------|
| **HOOK** | "Por que a minha conta de luz continua alta mesmo economizando?" |
| **PROBLEMA** | "Você já tentou de tudo: desligar as luzes, trocar lâmpadas, reduzir o ar condicionado..." |
| **POR QUE É RUIM** | "O problema é que a energia que você usa ainda vem da rede, e a tarifa só aumenta" |
| **SOLUÇÃO** | "A energia solar zera sua conta porque você gera sua própria energia" |
| **CTA** | "Simule grátis quanto você pode economizar, link na bio" |

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| 5 vídeos com tipos livres | 5 vídeos com tipos livres |
| — | **+1 vídeo "Caixinha de Perguntas"** |
| Total: 5 vídeos | Total: **6 vídeos** |

O 6º vídeo sempre terá:
- `video_type: "question_box"`
- Hook em formato de pergunta genuína
- Estrutura que naturalmente leva à promoção do produto

