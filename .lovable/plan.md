
# Enviar Anuncios Estaticos via Webhook

## Resumo
Adicionar um campo de URL de webhook na pagina de Configuracoes e um botao "Enviar via Webhook" na secao de anuncios estaticos (tanto no GeneratedContentViewer quanto no GeneratedAssetsSection). Ao clicar, os anuncios estaticos serao enviados via uma edge function para a URL configurada.

## Etapas

### 1. Adicionar campo de Webhook URL na pagina de Configuracoes
- Adicionar uma nova secao "Integracao Webhook" na pagina `src/pages/Settings.tsx`
- Campo de input para a URL do webhook, salvo em `localStorage` (mesmo padrao usado para as configuracoes de IA)
- Botao de salvar com feedback visual

### 2. Criar Edge Function `send-webhook`
- Criar `supabase/functions/send-webhook/index.ts`
- Recebe o payload (anuncios estaticos + dados do cliente) via POST
- Encaminha para a URL de webhook fornecida
- Retorna status de sucesso/erro
- Inclui CORS headers e validacao

### 3. Adicionar botao "Enviar via Webhook" nos componentes de anuncios

**Em `src/components/generator/GeneratedContentViewer.tsx`:**
- Botao ao lado do PDF Export na secao de anuncios
- Envia somente os `staticAds` com dados do cliente (nome, ICP)

**Em `src/components/client/GeneratedAssetsSection.tsx`:**
- Mesmo botao na secao de anuncios do detalhe do cliente

### 4. Payload do Webhook

O JSON enviado ao webhook tera este formato:

```text
{
  "client_name": "XPLO",
  "icp_name": "Proprietario investidor",
  "sent_at": "2026-03-01T...",
  "ads": [
    {
      "headline": "...",
      "subheadline": "...",
      "body_text": "...",
      "cta": "...",
      "eliminators": [...],
      "angle": "pain|desire",
      "focus": "...",
      "visual_suggestion": "..."
    }
  ]
}
```

## Detalhes Tecnicos

- A URL do webhook sera armazenada em `localStorage` com a chave `webhook_url`
- A edge function valida a URL e faz o POST para o destino
- O botao mostra estado de loading e feedback (toast de sucesso/erro)
- Se nao houver URL configurada, mostra alerta pedindo para configurar nas Configuracoes
