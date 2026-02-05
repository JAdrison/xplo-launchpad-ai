
# Criar Novos Anúncios de Vídeo com IA

## Visão Geral

Adicionar um botão "Criar Novo" na seção de Scripts de Vídeo que abre um dialog onde o usuário digita instruções em linguagem natural sobre como quer que o novo anúncio de vídeo seja criado.

---

## Interface do Usuário

### Botão no Header de Scripts de Vídeo

```text
┌─────────────────────────────────────────────────────────┐
│ Scripts de Vídeo                          [+ Criar Novo]│
├─────────────────────────────────────────────────────────┤
│   VideoAdCard 1...                                      │
│   VideoAdCard 2...                                      │
└─────────────────────────────────────────────────────────┘
```

### Dialog de Criação

```text
┌─────────────────────────────────────────────────────────┐
│  ✨ Criar Novo Anúncio de Vídeo com IA                  │
│─────────────────────────────────────────────────────────│
│                                                         │
│  Descreva como você quer o anúncio:                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Ex: Quero um anúncio focado em urgência, para   │   │
│  │ donos de pet shop, destacando a economia de     │   │
│  │ tempo. Tom mais agressivo e direto.             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Cancelar]                          [Criar ✨]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Arquitetura da Solução

### 1. Novo Componente: CreateVideoAdDialog

| Prop | Tipo | Descrição |
|------|------|-----------|
| `isOpen` | `boolean` | Controla visibilidade |
| `onClose` | `() => void` | Fecha o dialog |
| `clientId` | `string` | ID do cliente |
| `onCreated` | `(ad: Ad) => void` | Callback quando anúncio é criado |

### 2. Nova Rota na Edge Function

Adicionar `type: "create-video-ad"` no `generate-content/index.ts`:

```text
if (type === "create-video-ad") {
  // Busca contexto do cliente (PPP, oferta, etc.)
  // Envia para IA com instrução do usuário
  // Retorna anúncio criado no formato padrão
}
```

---

## Fluxo de Criação

```text
1. Usuário clica [+ Criar Novo]
          ↓
2. Dialog abre com textarea
          ↓
3. Usuário digita: "Quero focado em economia, tom amigável"
          ↓
4. Clica [Criar]
          ↓
5. Edge Function:
   - Busca dados do cliente (PPP, oferta)
   - Monta prompt com contexto + instrução do usuário
   - IA gera anúncio completo (6 seções)
          ↓
6. Insere no banco de dados (tabela ads)
          ↓
7. Retorna para frontend
          ↓
8. Dialog fecha, novo card aparece na lista
```

---

## Alterações na Edge Function

### Novo Handler `create-video-ad`

Recebe:
- `clientId` - ID do cliente
- `instruction` - Descrição do usuário (ex: "focado em urgência, tom agressivo")
- `offerId` (opcional) - Se quiser vincular a uma oferta específica

Processo:
1. Busca PPP do cliente para contexto
2. Busca oferta se offerId fornecido
3. Monta prompt combinando contexto + instrução
4. Gera anúncio com 6 seções + duração + notas visuais
5. Salva no banco
6. Retorna anúncio criado

---

## Prompt para IA

```text
Sistema: Você é um copywriter especialista em anúncios de vídeo para redes sociais.
Crie um roteiro completo seguindo a estrutura:
- HOOK (captura atenção nos primeiros 3 segundos)
- PROBLEMA (identifica a dor do público)
- POR QUE É RUIM (agita o problema)
- SOLUÇÃO (apresenta o produto/serviço)
- PROVA (credibilidade, resultados)
- CTA (chamada para ação)

Contexto do Cliente:
{contexto do PPP}

Instrução do Usuário:
{instrução digitada}

Retorne JSON:
{
  "video_type": "tipo identificado",
  "duration": "30s",
  "hook": "...",
  "problem": "...",
  "why_bad": "...",
  "solution": "...",
  "proof": "...",
  "cta": "...",
  "visual_notes": "..."
}
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/generator/CreateVideoAdDialog.tsx` | Dialog de criação |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/client/GeneratedAssetsSection.tsx` | Adicionar botão e integrar dialog |
| `supabase/functions/generate-content/index.ts` | Adicionar handler `create-video-ad` |

---

## Implementação Detalhada

### CreateVideoAdDialog.tsx

**Estados:**
```text
instruction: string        // Texto que o usuário digita
isCreating: boolean        // Loading durante criação
```

**UI:**
- Dialog com título e descrição
- Textarea para instrução (placeholder com exemplos)
- Botões Cancelar e Criar
- Loading state durante criação

### GeneratedAssetsSection.tsx

**Adicionar estado:**
```text
const [createDialogOpen, setCreateDialogOpen] = useState(false);
```

**Adicionar no header de Scripts de Vídeo:**
```text
<div className="flex items-center justify-between">
  <h4 className="text-sm font-medium">Scripts de Vídeo</h4>
  <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
    <Plus className="h-4 w-4 mr-1" />
    Criar Novo
  </Button>
</div>
```

**Adicionar callback:**
```text
const handleVideoAdCreated = (newAd: Ad) => {
  setAds(prev => [...prev, newAd]);
  setAdsRefreshKey(k => k + 1);
  toast.success("Novo anúncio de vídeo criado!");
};
```

### Edge Function - Handler create-video-ad

```text
if (type === "create-video-ad") {
  const { instruction } = b;
  if (!instruction || !clientId) {
    return new Response(JSON.stringify({ error: 'Missing instruction or clientId' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  // Busca contexto do cliente
  const { data: profile } = await supabase
    .from('client_profile')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();
  
  const { data: promise } = await supabase
    .from('ppp_promise')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();
  
  // Monta contexto
  let ctx = '';
  if (profile?.product_name) ctx += `Produto: ${profile.product_name}\n`;
  if (profile?.product_description) ctx += `Descrição: ${profile.product_description}\n`;
  if (profile?.main_pain) ctx += `Dor principal: ${profile.main_pain}\n`;
  if (promise?.promise_text) ctx += `Promessa: ${promise.promise_text}\n`;
  
  // Prompt
  sys = 'Copywriter de anúncios de vídeo. Estrutura: HOOK, PROBLEMA, POR QUE É RUIM, SOLUÇÃO, PROVA, CTA. Duração 20-60s.';
  prompt = `${ctx}\n\nInstrução: ${instruction}\n\nJSON: {"video_type":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","proof":"","cta":"","visual_notes":""}`;
  
  const res = await ai(KEY, sys, prompt, 0.8);
  
  // Insere no banco
  const { data: newAd, error } = await supabase.from('ads').insert({
    client_id: clientId,
    asset_type: 'video_ad',
    video_type: res.video_type,
    video_hook: res.hook,
    video_problem: res.problem,
    video_why_bad: res.why_bad,
    video_solution: res.solution,
    video_proof: res.proof,
    video_cta: res.cta,
    video_duration: res.duration,
    video_visual_notes: res.visual_notes,
    headline: res.video_type
  }).select().single();
  
  if (error) throw error;
  
  return new Response(JSON.stringify({ success: true, ad: newAd }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```

---

## Resultado Esperado

1. Botão "Criar Novo" visível no header da seção de Scripts de Vídeo
2. Ao clicar, abre dialog com textarea
3. Usuário digita instruções em linguagem natural (ex: "focado em economia, tom mais leve")
4. IA gera anúncio completo usando contexto do cliente + instrução
5. Novo card aparece na lista com todas as 6 seções
6. PDF é atualizado automaticamente com o novo anúncio
