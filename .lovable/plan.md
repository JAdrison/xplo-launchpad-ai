

# Reestruturação Completa da Geração de Anúncios

## Visão Geral

Atualizar o sistema de geração de anúncios para criar **15 anúncios no total**:
- **5 Roteiros de Vídeo** (estrutura de 6 seções, duração flexível 20-80s)
- **10 Anúncios Estáticos de Promessa** (5 DORES + 5 DESEJOS)

Todos os anúncios serão gerados usando o **onboarding completo das 7 etapas** como contexto.

---

## Parte 1: Roteiros de Vídeo

### Estrutura de 6 Seções (Obrigatória)

| Seção | Descrição | Dados do Onboarding |
|-------|-----------|---------------------|
| **HOOK** | Chamada que prende atenção (pergunta, promessa, quebra de padrão) | Varia por tipo de vídeo |
| **PROBLEMA** | O que a pessoa está enfrentando hoje | `main_pain`, `secondary_pain` (Etapa 3) |
| **POR QUE ISSO É RUIM** | Consequência clara de não resolver | `daily_impacts` (Etapa 3) |
| **SOLUÇÃO** | O caminho simples/seguro para resolver | `product_name`, `differentiators`, `benefits` (Etapa 2) |
| **PROVA** | Evidência rápida (opcional, mas recomendado) | `promise_text` (Etapa 5) + dados de mercado (Etapa 4) |
| **CTA** | A próxima ação em 1 passo | Baseado nos canais de demanda (Etapa 4) |

### Duração Flexível

| Parâmetro | Valor |
|-----------|-------|
| **Mínimo** | 20-25 segundos |
| **Máximo** | 70-80 segundos |

A IA define a duração com base em:
- Complexidade do produto/serviço
- Tipo de vídeo
- Quantidade de prova necessária
- Nível de consciência do público

### Os 5 Tipos de Vídeo

| ID | Tipo | Estilo do Hook | Duração Típica |
|----|------|----------------|----------------|
| `pattern_break` | Quebra de Padrão | Afirmação surpreendente que desafia crença comum | 20-35s |
| `question_box` | Caixinha de Perguntas | Pergunta real do público-alvo | 35-50s |
| `daily_scene` | Cotidiano + Problema | Cena do dia-a-dia com identificação | 30-45s |
| `location_based` | Direcionado para Região | Menção geográfica + oportunidade | 25-40s |
| `social_proof` | Prova Social | Resultado de cliente real | 45-80s |

### Exemplo de Roteiro Gerado

```text
TIPO: Quebra de Padrão
DURAÇÃO: 30s

HOOK:
"Você está pagando conta de luz todo mês... mas não precisa."

PROBLEMA:
"A maioria das pessoas acha que não tem como fugir 
da conta de energia. Paga, reclama, e paga de novo."

POR QUE ISSO É RUIM:
"São R$ 300, R$ 500, às vezes mais de R$ 1.000 por mês 
indo embora. Em 1 ano, você poderia ter usado esse 
dinheiro pra viagem, reforma ou investimento."

SOLUÇÃO:
"Com a energia solar por assinatura, você recebe 
desconto direto na conta. Sem instalar painel, 
sem obra, sem dor de cabeça."

PROVA:
"Mais de 500 famílias em [região] já estão 
economizando até 20% todo mês."

CTA:
"Clica no botão e descubra quanto você pode economizar."

NOTAS VISUAIS:
- Pessoa olhando conta de luz com expressão de frustração
- Corte para gráfico simples mostrando economia
- Encerra com logo e botão de WhatsApp
```

---

## Parte 2: Anúncios Estáticos de Promessa

### Estrutura Visual (Baseada nas Referências)

```text
┌─────────────────────────────────────┐
│  HEADLINE IMPACTANTE (até 15 palavras) │
│  ───────────────────────────────────  │
│  Subheadline complementar             │
│  ───────────────────────────────────  │
│  Copy explicativa (2-3 frases)        │
│  ───────────────────────────────────  │
│  • SEM [objeção 1]                    │
│  • SEM [objeção 2]                    │
│  • SEM [objeção 3]                    │
│  ───────────────────────────────────  │
│  [BOTÃO CTA]                          │
└─────────────────────────────────────┘
```

### 5 Baseados em DORES

| ID | Foco | Dado Fonte (Etapa 3) |
|----|------|----------------------|
| `pain_main` | Dor Principal | `main_pain` |
| `pain_secondary` | Dor Secundária | `secondary_pain` |
| `pain_impact_1` | Impacto Diário 1 | `daily_impacts[0]` |
| `pain_impact_2` | Impacto Diário 2 | `daily_impacts[1]` |
| `pain_consequence` | Consequência | `daily_impacts[2]` ou derivado |

### 5 Baseados em DESEJOS

| ID | Foco | Dado Fonte |
|----|------|------------|
| `desire_1` | Desejo 1 | `desire_1` (Etapa 3) |
| `desire_2` | Desejo 2 | `desire_2` (Etapa 3) |
| `desire_promise` | Promessa de Valor | `promise_text` (Etapa 5) |
| `desire_result` | Resultado Prometido | Derivado da promessa |
| `desire_transformation` | Transformação | Antes/Depois implícito |

### Exemplo de Estático Gerado

```text
ÂNGULO: Dor
FOCO: main_pain

HEADLINE:
"Gasta até R$ 500 na conta de luz?"

SUBHEADLINE:
"Economize até R$ 1.200,00 por ano!"

COPY:
"Com energia solar por assinatura, o desconto 
vem direto na sua conta. Você continua usando 
a mesma energia, mas pagando menos."

ELIMINATORS:
• SEM INSTALAÇÃO
• SEM DOR DE CABEÇA  
• SEM OBRAS

CTA:
"Clique em Saiba Mais"

SUGESTÃO VISUAL:
"Família sorrindo olhando para tablet/conta de luz 
com expressão de alívio"
```

---

## Parte 3: Fluxo Híbrido (Geração + Refinamento)

### Etapa 1: Geração Rápida

1. Usuário seleciona oferta base
2. Clica "Gerar Anúncios"
3. IA gera os 15 anúncios automaticamente
4. Visualiza resultado em grid organizado

### Etapa 2: Refinamento por Chat

1. Não gostou de algum anúncio? Clica "Refinar com IA"
2. Abre chat de refinamento
3. Escreve instruções naturais: "mais agressivo", "foca na economia"
4. IA gera nova versão lado a lado
5. Aceita ou descarta a alteração

### Interface do Chat de Refinamento

```text
┌─────────────────────────────────────────────────────┐
│  Refinar Anúncio                              [X]   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │  Versão Atual   │  │  Nova Versão    │           │
│  │  ...            │  │  ...            │           │
│  └─────────────────┘  └─────────────────┘           │
├─────────────────────────────────────────────────────┤
│  Você: deixa mais agressivo                         │
│  IA: Pronto! Aumentei a urgência e adicionei        │
│      gatilhos de escassez.                          │
├─────────────────────────────────────────────────────┤
│  [Digite sua instrução...              ] [Enviar]   │
├─────────────────────────────────────────────────────┤
│  [Descartar]                    [Aplicar Alteração] │
└─────────────────────────────────────────────────────┘
```

### Exemplos de Instruções que a IA Entenderá

| Instrução | O que a IA Faz |
|-----------|----------------|
| "mais agressivo" | Adiciona urgência, escassez, FOMO |
| "mais suave" | Remove pressão, foca em benefícios |
| "foca na dor X" | Reescreve destacando dor específica |
| "linguagem mais jovem" | Usa gírias e tom casual |
| "adiciona prova social" | Inclui depoimento ou estatística |
| "headline mais curta" | Reduz para máximo 8 palavras |

---

## Parte 4: Interface de Visualização

### Layout com Tabs

```text
┌─────────────────────────────────────────────────────────┐
│  Anúncios Gerados                                       │
├─────────────────────────────────────────────────────────┤
│  [Estáticos (10)] [Vídeos (5)]              <- Tabs     │
├─────────────────────────────────────────────────────────┤
```

### Tab Estáticos

```text
│  ┌── BASEADOS EM DORES ───────────────────────────────┐ │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ │
│  │ │ Dor     │ │ Dor     │ │ Impacto │ │ Impacto │    │ │
│  │ │ Princ.  │ │ Secund. │ │ 1       │ │ 2       │    │ │
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │ │
│  │ ┌─────────┐                                        │ │
│  │ │ Conseq. │                                        │ │
│  │ └─────────┘                                        │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌── BASEADOS EM DESEJOS ─────────────────────────────┐ │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ │
│  │ │ Desejo  │ │ Desejo  │ │ Promessa│ │ Result. │    │ │
│  │ │ 1       │ │ 2       │ │         │ │         │    │ │
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │ │
│  │ ┌─────────┐                                        │ │
│  │ │ Transf. │                                        │ │
│  │ └─────────┘                                        │ │
│  └────────────────────────────────────────────────────┘ │
```

### Tab Vídeos

```text
│  ┌─────────────────────────────────────────────────────┐│
│  │ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ ││
│  │ │ Quebra de     │ │ Caixinha de   │ │ Cotidiano   │ ││
│  │ │ Padrão (30s)  │ │ Perguntas(45s)│ │ (35s)       │ ││
│  │ │ [Refinar]     │ │ [Refinar]     │ │ [Refinar]   │ ││
│  │ └───────────────┘ └───────────────┘ └─────────────┘ ││
│  │ ┌───────────────┐ ┌───────────────┐                 ││
│  │ │ Direcionado   │ │ Prova Social  │                 ││
│  │ │ Região (25s)  │ │ (70s)         │                 ││
│  │ │ [Refinar]     │ │ [Refinar]     │                 ││
│  │ └───────────────┘ └───────────────┘                 ││
│  └─────────────────────────────────────────────────────┘│
```

---

## Parte 5: Alterações Técnicas

### 1. Migration SQL - Novas Colunas na Tabela `ads`

**Para Estáticos:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `subheadline` | text | Subtítulo do criativo |
| `eliminators` | text[] | Array de bullets "SEM X" |
| `angle` | text | "pain" ou "desire" |
| `focus` | text | Qual dor/desejo específico |
| `visual_suggestion` | text | Sugestão de imagem |

**Para Vídeos:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `video_type` | text | pattern_break, question_box, etc |
| `video_hook` | text | Chamada inicial |
| `video_problem` | text | Descrição do problema |
| `video_why_bad` | text | Consequência de não resolver |
| `video_solution` | text | Apresentação da solução |
| `video_proof` | text | Prova/evidência (opcional) |
| `video_cta` | text | Call to action final |
| `video_duration` | text | Duração (ex: "30s") |
| `video_visual_notes` | text | Notas de gravação |

### 2. Edge Function - generate-content

Atualizar o handler de anúncios para:

1. Receber TODO o contexto do onboarding (7 etapas)
2. Gerar 5 roteiros de vídeo com estrutura de 6 seções
3. Gerar 10 estáticos divididos por ângulo (dor/desejo)
4. Usar as dores e desejos do client_profile diretamente
5. Usar a região de atuação para anúncios geolocalizados
6. Definir duração flexível (20-80s) para cada vídeo

**Novo tipo de request: `refine-ad`**

| Parâmetro | Descrição |
|-----------|-----------|
| adId | ID do anúncio a refinar |
| currentContent | Conteúdo atual |
| instruction | Instrução do usuário |
| adType | static ou video |

### 3. Novos Componentes Frontend

| Componente | Descrição |
|------------|-----------|
| `AdsRefinerChat.tsx` | Chat de refinamento com preview lado a lado |

### 4. Componentes a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `GeneratedContentViewer.tsx` | Nova UI com tabs, categorização, botão "Refinar com IA" |

---

## Parte 6: Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Migration SQL | CRIAR | Adicionar colunas para nova estrutura de ads |
| `src/components/generator/AdsRefinerChat.tsx` | CRIAR | Chat de refinamento de anúncios |
| `supabase/functions/generate-content/index.ts` | MODIFICAR | Novo prompt para 15 anúncios + handler refine-ad |
| `src/components/generator/GeneratedContentViewer.tsx` | MODIFICAR | Nova UI com tabs e categorização |

---

## Parte 7: Output Esperado da IA

```text
{
  "video_scripts": [
    {
      "video_type": "pattern_break",
      "title": "Quebra de Padrão",
      "duration": "30s",
      "hook": "Você está pagando conta de luz todo mês... mas não precisa.",
      "problem": "A maioria das pessoas acha que não tem como fugir da conta de energia.",
      "why_bad": "São R$ 300-500 por mês indo embora. Em 1 ano, poderia investir.",
      "solution": "Com energia solar por assinatura, desconto direto na conta.",
      "proof": "Mais de 500 famílias em [região] já economizam até 20%.",
      "cta": "Clica no botão e descubra quanto você pode economizar.",
      "visual_notes": "Pessoa olhando conta frustrada → gráfico de economia → logo"
    },
    // ... mais 4 vídeos
  ],
  "static_ads": {
    "pain_based": [
      {
        "angle": "pain",
        "focus": "main_pain",
        "headline": "Gasta até R$ 500 na conta de luz?",
        "subheadline": "Economize até R$ 1.200,00 por ano!",
        "copy": "Com energia solar por assinatura, o desconto vem direto na conta.",
        "eliminators": ["SEM INSTALAÇÃO", "SEM DOR DE CABEÇA", "SEM OBRAS"],
        "cta": "Clique em Saiba Mais",
        "visual_suggestion": "Família sorrindo olhando tablet/conta de luz"
      },
      // ... mais 4 pain-based
    ],
    "desire_based": [
      {
        "angle": "desire",
        "focus": "desire_1",
        "headline": "Até 20% de desconto na sua conta de luz!",
        "subheadline": "Agora você pode usar energia solar sem instalar nada.",
        "copy": "Com a energia por assinatura, a economia vem direto na conta.",
        "eliminators": ["SEM INVESTIMENTO INICIAL", "SEM BUROCRACIA", "SEM OBRAS"],
        "cta": "Clique em Saiba Mais",
        "visual_suggestion": "Cofrinho com dinheiro, pessoa feliz"
      },
      // ... mais 4 desire-based
    ]
  }
}
```

---

## Resultado Esperado

1. 5 roteiros de vídeo com estrutura de 6 seções (HOOK → PROBLEMA → POR QUE É RUIM → SOLUÇÃO → PROVA → CTA)
2. Duração flexível de 20-80s definida pela IA para cada vídeo
3. 10 anúncios estáticos seguindo o padrão visual das referências
4. 5 estáticos focados nas DORES mapeadas no onboarding (Etapa 3)
5. 5 estáticos focados nos DESEJOS mapeados no onboarding (Etapa 3)
6. Cada estático com headline, subheadline, copy, eliminators (SEM X), CTA e sugestão visual
7. Interface separada por tabs (Estáticos vs Vídeos) e por ângulo (Dores vs Desejos)
8. Botão "Refinar com IA" para ajustes conversacionais em qualquer anúncio
9. Chat de refinamento com preview lado a lado (antes/depois)

