

# Geracao de ICPs com Inteligencia Artificial

## Resumo

Adicionar funcionalidade de geracao automatica de ICPs usando IA quando o usuario nao conhece seu cliente ideal. A IA analisara os dados do **negocio e produto especifico** para sugerir 3 perfis de cliente ideal contextualizados.

---

## Contexto para a IA

A IA tera acesso a todas as informacoes do negocio preenchidas na Etapa 1 (Produto):

| Dado | Origem | Uso na Geracao |
|------|--------|----------------|
| **Nicho** | `clients.niche` | Segmento de mercado (ex: Energia Solar, Consultoria) |
| **Nome do Produto** | `client_profile.product_name` | O que esta sendo vendido |
| **Descricao** | `client_profile.product_description` | Como funciona, para que serve |
| **Diferenciais** | `client_profile.differentiators` | O que diferencia da concorrencia |
| **Regiao** | `client_profile.region` | Onde atua geograficamente |

**Exemplos de geracao contextualizada:**

```text
Produto: Assinatura de Energia Solar
Nicho: Energia Renovavel
--> ICPs sugeridos:
   1. Donos de casas com conta de luz alta
   2. Pequenos comerciantes urbanos
   3. Condomínios residenciais

Produto: Consultoria de Marketing Digital
Nicho: Marketing
--> ICPs sugeridos:
   1. Donos de e-commerce em crescimento
   2. Prestadores de servico que querem escalar
   3. Infoprodutores iniciantes
```

---

## Fluxo do Usuario

```text
ETAPA 2 - ICPs

+----------------------------------------------------------+
|                                                          |
|  Voce ja conhece seu cliente ideal?                      |
|  (Sabe qual tipo de cliente mais compra de voce?)        |
|                                                          |
|  +------------------------+  +------------------------+  |
|  |  SIM, JA CONHECO       |  |  NAO, PRECISO DE AJUDA |  |
|  |                        |  |                        |  |
|  |  [Icone Users]         |  |  [Icone Sparkles/AI]   |  |
|  |                        |  |                        |  |
|  |  Sei quem sao meus     |  |  A IA vai analisar seu |  |
|  |  melhores clientes     |  |  produto e sugerir     |  |
|  +------------------------+  +------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

---

## Estados do Componente StepICPs

| Estado | Descricao |
|--------|-----------|
| `choice` | Pergunta inicial: Ja conhece ou precisa de ajuda? (SEMPRE INICIA AQUI) |
| `manual` | Formulario de cadastro manual |
| `generating` | IA gerando sugestoes (loading) |
| `suggestions` | Exibe 3 ICPs gerados para selecao |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Onboarding.tsx` | Refatorar StepICPs para incluir escolha inicial e geracao IA |
| `supabase/functions/generate-content/index.ts` | Adicionar tipo `generate-icps` com prompt contextualizado |

---

## Edge Function - Prompt Contextualizado

O prompt sera construido com TODOS os dados do negocio:

```typescript
case "generate-icps":
  systemPrompt = `Voce e um estrategista de marketing especializado em definicao de ICP (Ideal Customer Profile).
  
  Sua tarefa e analisar o NEGOCIO ESPECIFICO e identificar 3 perfis de cliente ideal que teriam MAIOR PROPENSAO a comprar este produto/servico.
  
  IMPORTANTE: Os ICPs devem ser REALISTAS e ESPECIFICOS para o negocio informado. 
  Nao invente perfis genericos. Analise o nicho, o produto e os diferenciais.`;

  prompt = `Analise este negocio e identifique 3 perfis de cliente ideal:

## DADOS DO NEGOCIO

**Nicho de Atuacao:** ${pppData?.niche || 'Nao informado'}
**Regiao:** ${pppData?.profile?.region || 'Brasil'}

## PRODUTO/SERVICO

**Nome:** ${pppData?.profile?.product_name || 'Nao informado'}
**Descricao:** ${pppData?.profile?.product_description || 'Nao informado'}
**Diferenciais:** ${pppData?.profile?.differentiators?.join(', ') || 'Nao informados'}

## INSTRUCOES

Com base ESPECIFICAMENTE neste negocio, gere 3 perfis de cliente ideal DIFERENTES e COMPLEMENTARES.

Para cada ICP:
- name: Nome/persona brasileiro (ex: "Empresario Carlos", "Dona Maria")
- segment: Segmento especifico que esse perfil representa
- characteristics: Caracteristicas comportamentais e situacionais
- current_situation: Situacao atual que o leva a precisar deste produto

Responda em JSON:
{
  "icps": [
    { "name": "...", "segment": "...", "characteristics": "...", "current_situation": "..." }
  ]
}

REGRAS CRITICAS:
1. Os ICPs devem ser COERENTES com o nicho "${pppData?.niche || 'informado'}"
2. Os ICPs devem ser pessoas que REALMENTE comprariam "${pppData?.profile?.product_name || 'o produto'}"
3. Use exemplos CONCRETOS e ESPECIFICOS, nao genericos
4. Considere a regiao de atuacao se informada
5. Cada ICP deve representar um TIPO DIFERENTE de comprador`;
  break;
```

---

## Tela de Sugestoes da IA

Apos a geracao, exibir os ICPs com contexto:

```text
+----------------------------------------------------------+
|                                                          |
|  [Badge: Gerado por IA]                                  |
|                                                          |
|  Com base no seu produto "[Nome do Produto]" e           |
|  no nicho "[Nicho]", identificamos 3 perfis:             |
|                                                          |
|  +----------------------------------------------------+  |
|  | [x] ICP 1: Dona Maria - Proprietaria Residencial   |  |
|  |     Segmento: Casas com alto consumo de energia    |  |
|  |     Caracteristicas: Mora em casa propria, conta   |  |
|  |     de luz acima de R$ 400, preocupada com custos  |  |
|  |     Situacao: Busca reduzir gastos fixos mensais   |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | [ ] ICP 2: Sr. Jose - Pequeno Comerciante          |  |
|  |     Segmento: Comercio de bairro                   |  |
|  |     ...                                            |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | [ ] ICP 3: Sindico Roberto - Condominios           |  |
|  |     Segmento: Condominios residenciais             |  |
|  |     ...                                            |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [Voltar]  [Gerar Novos]  [Usar Selecionados (1)]        |
|                                                          |
+----------------------------------------------------------+
```

---

## Validacao de Dados

Antes de gerar ICPs, verificar se o produto foi preenchido:

```typescript
const handleGenerateICPs = async () => {
  // Verificar se tem dados do produto
  if (!formData.product.product_name && !formData.product.product_description) {
    toast.error("Preencha as informacoes do produto primeiro (Etapa 1)");
    return;
  }
  
  setIcpMode("generating");
  
  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: {
      type: "generate-icps",
      clientId: clientId,
      pppData: {
        niche: client?.niche,
        profile: {
          product_name: formData.product.product_name,
          product_description: formData.product.product_description,
          differentiators: formData.product.differentiators.filter(d => d.trim()),
          region: client?.region, // se existir
        },
      },
    },
  });
  
  // ... tratar resposta
};
```

---

## Tela de Loading

Durante a geracao:

```text
+----------------------------------------------------------+
|                                                          |
|            [Animacao de loading]                         |
|                                                          |
|     Analisando seu negocio e identificando               |
|     os melhores perfis de cliente...                     |
|                                                          |
|     Considerando:                                        |
|     - Nicho: Energia Solar                               |
|     - Produto: Assinatura de Energia                     |
|                                                          |
+----------------------------------------------------------+
```

---

## Fluxo Completo

```text
     SEMPRE INICIA AQUI
            |
            v
    +---------------+
    | Voce conhece  |
    | seu cliente?  |
    +---------------+
         |     |
        SIM   NAO
         |     |
         v     v
    +------+  +------------+
    |MANUAL|  | GENERATING |
    +------+  | (loading)  |
              +------------+
                   |
                   v
           +-------------+
           | SUGGESTIONS |
           | (3 cards)   |
           +-------------+
                   |
       +-----------+-----------+
       |           |           |
   [Voltar]   [Gerar]    [Usar]
       |        Novos          |
       v           |           v
   +-------+  +--------+  +------+
   | CHOICE|  |GENERATE|  |MANUAL|
   +-------+  +--------+  | com  |
                          |dados |
                          +------+
```

---

## Ao Usar Selecionados

1. ICPs selecionados sao copiados para o formData
2. Usuario vai para o modo `manual` com campos pre-preenchidos
3. Pode editar qualquer campo antes de prosseguir
4. Badge indica que foi "Sugerido por IA"

---

## Interface de Tipos

```typescript
// Adicionar na interface RequestBody
interface RequestBody {
  type: "offer" | "lp" | "ads" | "refresh-field" | "generate-icps";
  // ... outros campos
}

// Resposta esperada da IA
interface GeneratedICPs {
  icps: Array<{
    name: string;
    segment: string;
    characteristics: string;
    current_situation: string;
  }>;
}
```

---

## Checklist de Implementacao

| Item | Descricao |
|------|-----------|
| Estado `icpMode` em StepICPs | Controla qual tela exibir |
| Tela `choice` | Cards de escolha (Sim/Nao) |
| Tela `generating` | Loading com contexto do negocio |
| Tela `suggestions` | Cards selecionaveis com checkbox |
| Tela `manual` | Formulario atual |
| Edge Function `generate-icps` | Prompt com dados do negocio |
| Validacao de produto | Verificar se Etapa 1 esta preenchida |
| Selecao multipla | Checkboxes nos cards (1 a 3) |
| Botao regenerar | Gerar novas sugestoes |
| Transicao para manual | Preencher formulario com selecionados |

---

## Resultado Esperado

- ICPs gerados sao ESPECIFICOS para o negocio do cliente
- Exemplo Energia Solar -> Donos de casas, comercios, condominios
- Exemplo Consultoria Marketing -> E-commerce, prestadores, infoprodutores
- Nunca gerar ICPs genericos como "Pessoas interessadas em comprar"
- Sempre contextualizar com nicho, produto e diferenciais

