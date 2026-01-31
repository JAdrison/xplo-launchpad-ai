
# Configuração de IA com Troca entre Lovable AI e API Própria

## Objetivo
Atualizar a página de Configurações para permitir alternar entre duas fontes de IA:
1. **Lovable AI** (recomendado) - Modelos mais recentes sem precisar de API Key
2. **API Própria** - Para quem preferir usar sua própria chave

---

## Interface Final

```text
+----------------------------------------------------------+
|  Configuração de IA                                       |
|  Escolha como usar a inteligência artificial              |
|----------------------------------------------------------|
|                                                           |
|  Fonte de IA                                              |
|  +------------------------------------------------------+ |
|  |  (X) Lovable AI (Recomendado)                        | |
|  |      Sem configuração. Usa créditos automaticamente. | |
|  +------------------------------------------------------+ |
|  |  ( ) API Própria                                     | |
|  |      Use sua própria chave OpenAI ou Google.         | |
|  +------------------------------------------------------+ |
|                                                           |
|  Provedor                                                 |
|  [ Google Gemini             v ]                          |
|                                                           |
|  Modelo                                                   |
|  [ Gemini 3 Flash (Novo)     v ]                          |
|                                                           |
|  [Só aparece se API Própria:]                             |
|  API Key                                                  |
|  [ AIza...                    👁 ]                        |
|                                                           |
|                              [ Salvar Configurações ]     |
+----------------------------------------------------------+
```

---

## Modelos Disponíveis

### Lovable AI (sem API Key necessária)

| Provedor | Modelo | Descrição |
|----------|--------|-----------|
| Google | gemini-3-flash-preview | Novo, rápido e capaz |
| Google | gemini-3-pro-preview | Novo, muito potente |
| Google | gemini-2.5-flash | Equilibrado |
| Google | gemini-2.5-pro | Alta qualidade |
| OpenAI | gpt-5.2 | Novo, raciocínio avançado |
| OpenAI | gpt-5 | Muito potente |
| OpenAI | gpt-5-mini | Bom custo-benefício |
| OpenAI | gpt-5-nano | Mais rápido |

### API Própria (requer sua chave)

| Provedor | Modelo |
|----------|--------|
| Google | gemini-2.5-flash, gemini-2.5-pro |
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo |

---

## Armazenamento (localStorage)

```javascript
xplo_ai_source: "lovable" | "custom"     // Fonte selecionada
xplo_ai_provider: "gemini" | "openai"    // Provedor
xplo_ai_model: "google/gemini-3-flash-preview" // Modelo
xplo_api_key: "..."                      // Só se custom
```

---

## Lógica de Interface

- **Fonte = Lovable AI:**
  - Mostra seletor de provedor e modelo
  - Esconde campo de API Key
  - Mostra nota sobre créditos Lovable

- **Fonte = API Própria:**
  - Mostra seletor de provedor e modelo (lista diferente)
  - Mostra campo de API Key
  - Placeholder muda conforme provedor (sk-... ou AIza...)

---

## Detalhes Técnicos

### Arquivo a Modificar
- `src/pages/Settings.tsx`

### Componentes Necessários
- `RadioGroup`, `RadioGroupItem` - Seleção de fonte
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` - Dropdowns
- `Input` - Campo de API Key (condicional)
- `Badge` - Tags "Novo", "Recomendado"

### Estrutura de Dados

```typescript
const LOVABLE_MODELS = {
  gemini: [
    { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", badge: "Novo" },
    { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", badge: "Novo" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Recomendado" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ],
  openai: [
    { value: "openai/gpt-5.2", label: "GPT-5.2", badge: "Novo" },
    { value: "openai/gpt-5", label: "GPT-5" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini", badge: "Recomendado" },
    { value: "openai/gpt-5-nano", label: "GPT-5 Nano" },
  ],
};

const CUSTOM_MODELS = {
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Recomendado" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o", badge: "Recomendado" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
};
```

### Estados do Componente

```typescript
const [source, setSource] = useState<"lovable" | "custom">("lovable");
const [provider, setProvider] = useState<"gemini" | "openai">("gemini");
const [model, setModel] = useState("google/gemini-3-flash-preview");
const [apiKey, setApiKey] = useState("");

// Ao trocar fonte ou provedor, ajusta modelo padrão
useEffect(() => {
  const models = source === "lovable" ? LOVABLE_MODELS : CUSTOM_MODELS;
  setModel(models[provider][0].value);
}, [source, provider]);
```

---

## Benefícios

- **Flexibilidade total:** Alterna entre Lovable AI e API própria com um clique
- **Modelos mais recentes:** Acesso a Gemini 3 e GPT-5.2 via Lovable AI
- **Economia:** Lovable AI não precisa de configuração de API Key
- **Preparado para uso:** Configuração salva será usada pelo Gerador de Conteúdo
