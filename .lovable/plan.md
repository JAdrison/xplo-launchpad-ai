

# Integrar Configuracoes de IA com Edge Function

## Visao Geral

Permitir alternar livremente entre **Lovable AI** e **API propria** (OpenAI/Gemini) a qualquer momento na pagina de Configuracoes. A geracao de conteudo usara automaticamente a configuracao ativa.

---

## O Que NAO Muda

| Elemento | Status |
|----------|--------|
| Estrutura dos anuncios (6 videos + 10 estaticos) | Intacto |
| Prompts e instrucoes da IA | Intacto |
| Formato JSON de resposta | Intacto |
| Video tipo "question_box" | Intacto |
| Modelo Hormozi/Ladeira | Intacto |
| Toda logica de negocios | Intacta |

**Unica mudanca**: O "motor" que processa as requisicoes (qual API e modelo usar).

---

## Arquitetura da Solucao

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  Settings.tsx                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  localStorage:                                           │   │
│  │  - xplo_ai_source: "lovable" | "custom"                  │   │
│  │  - xplo_ai_provider: "gemini" | "openai"                 │   │
│  │  - xplo_ai_model: "google/gemini-2.5-flash" | ...        │   │
│  │  - xplo_api_key: "sk-..." | "AIza..."                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  Componentes de Geracao (Generator.tsx, StepPromise.tsx, etc)  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Leem localStorage e enviam no body:                     │   │
│  │  {                                                       │   │
│  │    type: "ads",                                          │   │
│  │    clientId: "...",                                      │   │
│  │    aiConfig: {                                           │   │
│  │      source: "custom",                                   │   │
│  │      provider: "openai",                                 │   │
│  │      model: "gpt-4o",                                    │   │
│  │      apiKey: "sk-..."                                    │   │
│  │    }                                                     │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE FUNCTION                               │
├─────────────────────────────────────────────────────────────────┤
│  generate-content/index.ts                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Recebe aiConfig do body                              │   │
│  │  2. Decide qual API chamar:                              │   │
│  │                                                          │   │
│  │  if (aiConfig.source === "custom") {                     │   │
│  │    // Usa API direta do provedor                         │   │
│  │    if (aiConfig.provider === "openai") {                 │   │
│  │      → https://api.openai.com/v1/chat/completions        │   │
│  │    } else {                                              │   │
│  │      → https://generativelanguage.googleapis.com/...     │   │
│  │    }                                                     │   │
│  │  } else {                                                │   │
│  │    // Usa Lovable AI Gateway (padrao)                    │   │
│  │    → https://ai.gateway.lovable.dev/v1/chat/completions  │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/generate-content/index.ts` | Adicionar suporte a multiplos provedores |
| `src/pages/Generator.tsx` | Enviar aiConfig nas chamadas |
| `src/components/onboarding/StepGenerateOffer.tsx` | Enviar aiConfig |
| `src/components/onboarding/steps/StepPromise.tsx` | Enviar aiConfig |
| `src/components/onboarding/steps/StepICPs.tsx` | Enviar aiConfig |
| `src/components/onboarding/steps/StepPains.tsx` | Enviar aiConfig |
| `src/components/generator/OfferOptionsSelector.tsx` | Enviar aiConfig |
| `src/components/generator/DemandPlanEditor.tsx` | Enviar aiConfig |
| `src/components/generator/AdsRefinerChat.tsx` | Enviar aiConfig |
| `src/components/generator/CreateVideoAdDialog.tsx` | Enviar aiConfig |
| `src/lib/aiConfig.ts` | Novo arquivo - helper para ler config |

---

## Implementacao Detalhada

### 1. Criar Helper para Ler Configuracao (novo arquivo)

**Arquivo**: `src/lib/aiConfig.ts`

```typescript
export interface AIConfig {
  source: "lovable" | "custom";
  provider: "gemini" | "openai";
  model: string;
  apiKey?: string;
}

export function getAIConfig(): AIConfig {
  const source = (localStorage.getItem("xplo_ai_source") || "lovable") as "lovable" | "custom";
  const provider = (localStorage.getItem("xplo_ai_provider") || "gemini") as "gemini" | "openai";
  const model = localStorage.getItem("xplo_ai_model") || "google/gemini-2.5-flash";
  const apiKey = localStorage.getItem("xplo_api_key") || undefined;

  return { source, provider, model, apiKey };
}
```

---

### 2. Atualizar Edge Function

**Arquivo**: `supabase/functions/generate-content/index.ts`

Adicionar interface e funcao para chamar diferentes provedores:

```typescript
interface AIConfig {
  source: "lovable" | "custom";
  provider: "gemini" | "openai";
  model: string;
  apiKey?: string;
}

async function ai(config: AIConfig, sys: string, usr: string, t = 0.7) {
  const fullSys = `${sys}\n\nIMPORTANTE: Responda APENAS com JSON válido...`;
  
  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;

  if (config.source === "custom" && config.apiKey) {
    if (config.provider === "openai") {
      // OpenAI API direta
      url = "https://api.openai.com/v1/chat/completions";
      headers = { 
        "Authorization": `Bearer ${config.apiKey}`, 
        "Content-Type": "application/json" 
      };
      body = {
        model: config.model,
        messages: [
          { role: "system", content: fullSys },
          { role: "user", content: usr }
        ],
        temperature: t,
        response_format: { type: "json_object" }
      };
    } else {
      // Google Gemini API direta
      url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      headers = { "Content-Type": "application/json" };
      body = {
        contents: [{ parts: [{ text: `${fullSys}\n\n${usr}` }] }],
        generationConfig: { 
          temperature: t,
          responseMimeType: "application/json"
        }
      };
    }
  } else {
    // Lovable AI Gateway (padrao)
    url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers = { 
      "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, 
      "Content-Type": "application/json" 
    };
    body = {
      model: config.model || "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: fullSys },
        { role: "user", content: usr }
      ],
      temperature: t,
      response_format: { type: "json_object" }
    };
  }

  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const st = r.status;
    throw { 
      status: st, 
      message: st === 429 ? "Rate limit" : st === 402 ? "Payment required" : `Error ${st}` 
    };
  }

  const d = await r.json();
  
  // Extrair conteudo baseado no provedor
  let content: string;
  if (config.source === "custom" && config.provider === "gemini") {
    content = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    content = d.choices?.[0]?.message?.content || "";
  }
  
  if (!content) throw new Error("No AI content");
  return extractJson(content);
}
```

Modificar o handler para receber aiConfig:

```typescript
interface ReqBody {
  type: string; 
  clientId: string; 
  // ... campos existentes ...
  aiConfig?: AIConfig; // NOVO
}

Deno.serve(async (req) => {
  // ...
  const b = await req.json() as ReqBody;
  const { type, clientId, pppData, icpId, offerId, field, lpVariant, aiConfig } = b;
  
  // Usar config recebida ou padrao Lovable
  const config: AIConfig = aiConfig || {
    source: "lovable",
    provider: "gemini", 
    model: "google/gemini-2.5-flash"
  };
  
  // Substituir todas as chamadas ai(KEY, ...) por ai(config, ...)
  const res = await ai(config, sys, prompt);
  // ...
});
```

---

### 3. Atualizar Componentes do Frontend

**Padrao para todos os componentes**:

```typescript
import { getAIConfig } from "@/lib/aiConfig";

// Antes da chamada invoke:
const aiConfig = getAIConfig();

const { data, error } = await supabase.functions.invoke("generate-content", {
  body: {
    type: "ads",
    clientId,
    // ... outros campos ...
    aiConfig, // Adicionar este campo
  },
});
```

**Componentes a atualizar** (9 arquivos):

1. `src/pages/Generator.tsx` - linha 241
2. `src/components/onboarding/StepGenerateOffer.tsx` - linha 63
3. `src/components/onboarding/steps/StepPromise.tsx` - linha 65
4. `src/components/onboarding/steps/StepICPs.tsx` - linha 86
5. `src/components/onboarding/steps/StepPains.tsx` - linha 109
6. `src/components/generator/OfferOptionsSelector.tsx` - linha 113
7. `src/components/generator/DemandPlanEditor.tsx` - linha 152
8. `src/components/generator/AdsRefinerChat.tsx` - linha 74
9. `src/components/generator/CreateVideoAdDialog.tsx` - linha 45

---

## Fluxo de Uso

```text
1. Usuario vai em Configuracoes
   ├── Seleciona "Lovable AI" → Salva
   │   └── Proximas geracoes usam Lovable Gateway
   │
   └── Seleciona "API Propria"
       ├── Escolhe provedor (OpenAI ou Gemini)
       ├── Escolhe modelo
       ├── Cola API Key
       └── Salva → Proximas geracoes usam API direta
```

---

## Seguranca

| Aspecto | Tratamento |
|---------|------------|
| API Key armazenada | localStorage (navegador do usuario) |
| API Key em transito | HTTPS para Edge Function |
| API Key no backend | Usada apenas na requisicao, nao persistida |
| Fallback | Se custom falhar, nao tenta Lovable automaticamente |

---

## Resultado Esperado

| Configuracao | Comportamento |
|--------------|---------------|
| Lovable AI selecionado | Usa gateway Lovable com LOVABLE_API_KEY |
| API Propria + OpenAI | Chama api.openai.com com sk-... do usuario |
| API Propria + Gemini | Chama googleapis.com com AIza... do usuario |

O usuario pode trocar a qualquer momento em Configuracoes e a proxima geracao ja usara a nova configuracao.

