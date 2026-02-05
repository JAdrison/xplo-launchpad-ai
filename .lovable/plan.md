

# Arquitetura de IA Dual: Cerebro (GPT-5.2) + Braco (Gemini Flash)

## Visao Geral

Implementar selecao automatica de modelo baseada no tipo de tarefa:

- **Motor Estrategico (GPT-5.2)**: Tarefas que exigem pensamento profundo
- **Motor Operacional (Gemini 3 Flash)**: Tarefas de escala e variacao

---

## Mapeamento de Tarefas por Modelo

| Tipo de Geracao | Modelo | Justificativa |
|-----------------|--------|---------------|
| `generate-icps` | GPT-5.2 | Estruturar perfis de clientes |
| `generate-pains` | GPT-5.2 | Mapear dores reais |
| `generate-buyer-pains` | GPT-5.2 | Mapear dores do comprador |
| `generate-promise` | GPT-5.2 | Criar promessa estrategica |
| `offer` | GPT-5.2 | Criar oferta Hormozi completa |
| `lp` | GPT-5.2 | Escrever Landing Page |
| `ads` | GPT-5.2 | Gerar anuncios principais |
| `create-video-ad` | GPT-5.2 | Video personalizado principal |
| `refine-ad` | Gemini Flash | Variacoes e refinamentos |
| `refresh-field` | Gemini Flash | Gerar alternativas de campos |

---

## Arquitetura da Solucao

```text
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Request { type: "offer", aiConfig: {...} }                     │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  selectModelForTask(type, aiConfig)                       │ │
│  │                                                           │ │
│  │  if (aiConfig.source === "custom") {                      │ │
│  │    → Usa modelo do usuario (respeita escolha)             │ │
│  │  } else {                                                 │ │
│  │    → Seleciona automaticamente:                           │ │
│  │      ESTRATEGICO? → openai/gpt-5.2                        │ │
│  │      OPERACIONAL? → google/gemini-3-flash-preview         │ │
│  │  }                                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ai(config, sys, prompt)                                  │ │
│  │  → Chama Lovable Gateway ou API direta                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/generate-content/index.ts` | Adicionar logica de selecao automatica de modelo |
| `src/pages/Settings.tsx` | Adicionar opcao "Arquitetura XPLO" como fonte de IA |
| `src/lib/aiConfig.ts` | Atualizar tipos para incluir "xplo" como source |

---

## Implementacao Detalhada

### 1. Nova Opcao de Fonte: "Arquitetura XPLO"

**Settings.tsx** - Adicionar terceira opcao:

```text
Fonte de IA:

[○] Lovable AI
    Usa um modelo unico para tudo (padrao)

[●] Arquitetura XPLO (Recomendado)
    GPT-5.2 para estrategia + Gemini Flash para escala
    
[○] API Propria
    Use sua propria chave OpenAI ou Google
```

---

### 2. Mapeamento de Tarefas na Edge Function

```typescript
// Tipos de tarefas estrategicas (cerebro)
const STRATEGIC_TASKS = [
  "generate-icps",
  "generate-pains", 
  "generate-buyer-pains",
  "generate-promise",
  "offer",
  "lp",
  "ads",
  "create-video-ad"
];

// Tipos de tarefas operacionais (braco)
const OPERATIONAL_TASKS = [
  "refine-ad",
  "refresh-field"
];

function selectModelForTask(type: string, aiConfig: AIConfig): AIConfig {
  // Se usuario escolheu API propria, respeita
  if (aiConfig.source === "custom") {
    return aiConfig;
  }
  
  // Se usuario escolheu Lovable padrao (modelo unico), respeita
  if (aiConfig.source === "lovable") {
    return aiConfig;
  }
  
  // Arquitetura XPLO: selecao automatica
  if (aiConfig.source === "xplo") {
    if (STRATEGIC_TASKS.includes(type)) {
      return {
        source: "lovable",
        provider: "openai",
        model: "openai/gpt-5.2"
      };
    } else {
      return {
        source: "lovable",
        provider: "gemini",
        model: "google/gemini-3-flash-preview"
      };
    }
  }
  
  return aiConfig;
}
```

---

### 3. Atualizar aiConfig.ts

```typescript
export interface AIConfig {
  source: "lovable" | "xplo" | "custom"; // Adicionar "xplo"
  provider: "gemini" | "openai";
  model: string;
  apiKey?: string;
}

export function getAIConfig(): AIConfig {
  const source = (localStorage.getItem("xplo_ai_source") || "xplo") as AIConfig["source"];
  // ... resto igual
}
```

---

### 4. Atualizar Settings.tsx

Adicionar nova opcao visual:

```tsx
<label
  htmlFor="xplo"
  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer ${
    source === "xplo" ? "border-primary bg-primary/5" : "border-border"
  }`}
>
  <RadioGroupItem value="xplo" id="xplo" className="mt-1" />
  <div className="flex-1 space-y-1">
    <div className="flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="font-medium">Arquitetura XPLO</span>
      <Badge variant="default" className="text-xs">Pro</Badge>
    </div>
    <p className="text-sm text-muted-foreground">
      GPT-5.2 para estrategia + Gemini Flash para escala
    </p>
    <div className="mt-2 text-xs text-muted-foreground space-y-1">
      <p>🧠 <strong>Cerebro:</strong> ICPs, Dores, Promessa, Oferta, LP, Anuncios</p>
      <p>⚡ <strong>Braco:</strong> Refinamentos, Variacoes, Alternativas</p>
    </div>
  </div>
</label>
```

---

## Fluxo de Uso

```text
Usuario em Configuracoes:
│
├── Lovable AI (modelo unico)
│   └── Todas as geracoes usam o modelo selecionado
│
├── Arquitetura XPLO ← NOVO (padrao recomendado)
│   ├── Criar oferta? → GPT-5.2
│   ├── Gerar LP? → GPT-5.2
│   ├── Gerar anuncios? → GPT-5.2
│   ├── Refinar anuncio? → Gemini Flash
│   └── Variacoes de campo? → Gemini Flash
│
└── API Propria
    └── Usa chave do usuario para tudo
```

---

## Vantagens

| Aspecto | Beneficio |
|---------|-----------|
| Qualidade estrategica | GPT-5.2 para decisoes importantes |
| Custo otimizado | Gemini Flash para tarefas repetitivas |
| Velocidade | Flash e mais rapido para refinamentos |
| Flexibilidade | Usuario pode mudar a qualquer momento |
| Transparencia | UI mostra qual modo esta ativo |

---

## Resultado na UI

A pagina de Configuracoes tera 3 opcoes:

```text
┌──────────────────────────────────────────────────────────────┐
│  Fonte de IA                                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ○ Lovable AI                                                │
│    Usa um modelo unico para todas as geracoes                │
│                                                              │
│  ● Arquitetura XPLO                          [Pro]           │
│    GPT-5.2 para estrategia + Gemini Flash para escala        │
│    🧠 Cerebro: ICPs, Dores, Promessa, Oferta, LP, Ads        │
│    ⚡ Braco: Refinamentos, Variacoes, Alternativas           │
│                                                              │
│  ○ API Propria                                               │
│    Use sua propria chave OpenAI ou Google                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

