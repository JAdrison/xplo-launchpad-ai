import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PPPData {
  profile: {
    product_name: string | null;
    product_description: string | null;
    differentiators: string[] | null;
    benefits?: string[] | null;
    main_pain?: string | null;
    secondary_pain?: string | null;
    daily_impacts?: string[] | null;
    desire_1?: string | null;
    desire_2?: string | null;
    region?: string[] | null;
  } | null;
  icps: Array<{
    id: string;
    name: string;
    profession?: string | null;
    age?: string | null;
    gender?: string | null;
    reason_needs_solution?: string | null;
    segment?: string | null;
    characteristics?: string | null;
    current_situation?: string | null;
  }>;
  pains: Array<{
    icp_id: string;
    main_pain: string | null;
    secondary_pain?: string | null;
    consequence?: string | null;
    daily_impacts: string[] | null;
    desire_1?: string | null;
    desire_2?: string | null;
    icps: { name: string } | null;
  }>;
  promise: {
    promise_text: string | null;
  } | null;
  niche?: string | null;
}

interface RequestBody {
  type: "offer" | "lp" | "ads" | "refresh-field" | "generate-icps" | "generate-pains" | "generate-promise" | "generate-buyer-pains" | "refine-ad";
  clientId: string;
  pppData?: PPPData;
  icpId?: string;
  offerId?: string;
  field?: string;
  currentOptions?: string[];
  lpVariant?: "direct" | "consultive" | "aggressive";
  // For refine-ad
  adId?: string;
  adType?: "static" | "video";
  currentContent?: Record<string, unknown>;
  instruction?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as RequestBody;
    const { type, clientId, pppData, icpId, offerId, field, currentOptions, lpVariant } = body;

    console.log(`Generating ${type} for client ${clientId}, ICP: ${icpId || 'all'}, field: ${field || 'all'}, lpVariant: ${lpVariant || 'none'}`);

    // Get the Lovable API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Handle refresh-field type - regenerate 2 options for a specific field
    if (type === "refresh-field" && field && offerId) {
      return await handleRefreshField(field, offerId, pppData, LOVABLE_API_KEY);
    }

    // Handle refine-ad type - refine a specific ad with AI
    if (type === "refine-ad") {
      return await handleRefineAd(body, LOVABLE_API_KEY);
    }

    // Build context from PPP data
    const context = pppData ? buildContext(pppData) : '';

    // Generate content based on type
    let prompt = "";
    let systemPrompt = "";

    switch (type) {
      case "offer":
        systemPrompt = `Você é um estrategista de marketing digital especializado em aquisição de clientes via tráfego pago, especialmente Facebook/Meta Ads. Você também é expert na metodologia de ofertas irresistíveis do Alex Hormozi.

Sua tarefa é:
1. Criar uma Oferta Hormozi completa com 2 OPÇÕES para cada campo
2. Criar um PLANO ESTRATÉGICO DE GERAÇÃO DE DEMANDA integrado e acionável

IMPORTANTE: Facebook/Meta Ads é nosso canal principal e mais forte. Sempre priorize este canal.`;

        prompt = `Com base nos seguintes dados de discovery:

${context}

Crie uma resposta em JSON com DUAS partes:

## PARTE 1: OFERTA HORMOZI (com 2 opções para cada campo)
Para cada campo, gere 2 opções diferentes e criativas:

{
  "options": {
    "promise": ["Opção 1 da promessa principal", "Opção 2 da promessa principal"],
    "unique_mechanism": ["Opção 1 do mecanismo único", "Opção 2 do mecanismo único"],
    "guarantee": ["Opção 1 da garantia", "Opção 2 da garantia"],
    "proof": ["Opção 1 de prova social", "Opção 2 de prova social"],
    "risk_reversal": ["Opção 1 de reversão de risco", "Opção 2 de reversão de risco"],
    "main_cta": ["Opção 1 do CTA", "Opção 2 do CTA"]
  },
  "value_stack": [
    {"name": "Item 1", "perceived_value": "R$ X.XXX"},
    {"name": "Item 2", "perceived_value": "R$ X.XXX"}
  ],
  "demand_plan": {...}
}

## PARTE 2: PLANO DE GERAÇÃO DE DEMANDA (demand_plan)
Analise o contexto do negócio e crie um plano PRÁTICO e ACIONÁVEL:

{
  "demand_plan": {
    "context_analysis": {
      "niche": "Identificação do nicho",
      "icp_profile": "Resumo do perfil do ICP",
      "key_insight": "Principal insight estratégico"
    },
    "primary_strategy": {
      "channel": "Facebook/Meta Ads",
      "campaign_type": "Tipo de campanha recomendada",
      "audiences": ["Público 1", "Público 2"],
      "creative_types": ["Tipo de criativo 1", "Tipo de criativo 2"],
      "budget_percentage": 60,
      "expected_cpl": "Estimativa de CPL"
    },
    "complementary_strategies": [
      {
        "channel": "Nome do canal complementar",
        "role": "Papel deste canal na estratégia",
        "integration": "Como integra com o Meta Ads",
        "budget_percentage": 25
      }
    ],
    "acquisition_funnel": {
      "tofu": {
        "objective": "Objetivo do topo",
        "channels": ["Canal 1", "Canal 2"],
        "message": "Mensagem principal"
      },
      "mofu": {
        "objective": "Objetivo do meio",
        "channels": ["Canal 1", "Canal 2"],
        "message": "Mensagem principal"
      },
      "bofu": {
        "objective": "Objetivo do fundo",
        "channels": ["Canal 1", "Canal 2"],
        "message": "Mensagem principal"
      }
    },
    "channel_synergies": [
      "Sinergia 1: como um canal alimenta outro",
      "Sinergia 2: sequência recomendada"
    ],
    "implementation_timeline": {
      "week_1_2": "O que fazer nas semanas 1-2",
      "week_3_4": "O que fazer nas semanas 3-4",
      "week_5_8": "O que fazer nas semanas 5-8"
    }
  }
}

REGRAS:
1. SEMPRE priorize Facebook/Meta Ads como canal principal (60%+ do budget)
2. Gere 2 opções DIFERENTES e CRIATIVAS para cada campo da oferta
3. As opções devem ter abordagens distintas (ex: uma mais emocional, outra mais racional)
4. O plano deve ser PRÁTICO e ACIONÁVEL, não genérico
5. Use os dados do ICP e dores para personalizar as mensagens

Responda APENAS com o JSON válido, sem markdown.`;
        break;

      case "lp":
        const variantLabels: Record<string, string> = {
          direct: "Direta - Copy objetiva, focada no resultado, vai direto ao ponto",
          consultive: "Consultiva - Copy educativa, explica o processo, gera confiança",
          aggressive: "Agressiva - Copy urgente, escassez, FOMO, pressão para ação"
        };
        const selectedVariant = lpVariant || "direct";
        const variantDescription = variantLabels[selectedVariant];

        systemPrompt = `Você é um copywriter especializado em landing pages de alta conversão usando a metodologia Alex Hormozi e Russell Brunson.
Sua tarefa é criar uma landing page COMPLETA e PROFISSIONAL com todas as seções necessárias para converter visitantes em leads/clientes.
O estilo da LP será: ${variantDescription}`;

        prompt = `Com base nos seguintes dados de discovery:

${context}

Crie uma Landing Page COMPLETA no estilo "${selectedVariant.toUpperCase()}" (${variantDescription}).

A LP deve conter TODAS as 10 seções abaixo em formato JSON:

{
  "hero": {
    "headline": "Título principal impactante (máx 10 palavras)",
    "subheadline": "Subtítulo que reforça a promessa",
    "hero_text": "Parágrafo de abertura emocional que conecta com a dor do leitor",
    "cta_button": "Texto do botão principal",
    "cta_subtext": "Texto abaixo do botão (ex: 'Vagas limitadas')"
  },
  "problem_agitation": {
    "title": "Título da seção de problemas",
    "problems": ["Problema/dor 1", "Problema/dor 2", "Problema/dor 3", "Problema/dor 4"],
    "emotional_text": "Parágrafo que agita a dor e mostra que você entende o leitor"
  },
  "solution": {
    "title": "Título apresentando a solução",
    "description": "Como o produto/serviço resolve o problema",
    "unique_mechanism": "O diferencial único que faz funcionar"
  },
  "benefits": [
    {"icon": "check", "title": "Benefício 1", "description": "Explicação do benefício"},
    {"icon": "star", "title": "Benefício 2", "description": "Explicação do benefício"},
    {"icon": "zap", "title": "Benefício 3", "description": "Explicação do benefício"},
    {"icon": "shield", "title": "Benefício 4", "description": "Explicação do benefício"},
    {"icon": "trophy", "title": "Benefício 5", "description": "Explicação do benefício"}
  ],
  "how_it_works": {
    "title": "Como funciona",
    "steps": [
      {"number": 1, "title": "Passo 1", "description": "O que acontece neste passo"},
      {"number": 2, "title": "Passo 2", "description": "O que acontece neste passo"},
      {"number": 3, "title": "Passo 3", "description": "O que acontece neste passo"}
    ]
  },
  "social_proof": {
    "title": "Quem já usa e aprova",
    "testimonials": [
      {"name": "Nome do cliente", "role": "Cargo/Empresa", "text": "Depoimento completo", "result": "Resultado alcançado"},
      {"name": "Nome do cliente 2", "role": "Cargo/Empresa", "text": "Depoimento completo", "result": "Resultado alcançado"}
    ],
    "stats": [
      {"number": "1.000+", "label": "Clientes atendidos"},
      {"number": "98%", "label": "Taxa de satisfação"},
      {"number": "R$ 10M+", "label": "Gerados para clientes"}
    ]
  },
  "guarantee": {
    "title": "Garantia Total",
    "description": "Explicação completa da garantia oferecida",
    "duration": "7 dias",
    "conditions": "Sem perguntas, 100% do dinheiro de volta"
  },
  "value_stack": {
    "title": "Tudo isso por apenas...",
    "items": [
      {"name": "Item/Bônus 1", "value": "R$ 997"},
      {"name": "Item/Bônus 2", "value": "R$ 497"},
      {"name": "Item/Bônus 3", "value": "R$ 297"}
    ],
    "total_value": "R$ 2.991",
    "actual_price": "R$ 497",
    "discount_text": "Economize mais de R$ 2.000"
  },
  "faq": [
    {"question": "Pergunta frequente 1?", "answer": "Resposta completa e persuasiva"},
    {"question": "Pergunta frequente 2?", "answer": "Resposta completa e persuasiva"},
    {"question": "Pergunta frequente 3?", "answer": "Resposta completa e persuasiva"},
    {"question": "Pergunta frequente 4?", "answer": "Resposta completa e persuasiva"},
    {"question": "Pergunta frequente 5?", "answer": "Resposta completa e persuasiva"}
  ],
  "final_cta": {
    "headline": "Não deixe essa oportunidade passar",
    "subtext": "Últimas vagas com condição especial",
    "button_text": "QUERO COMEÇAR AGORA",
    "urgency_text": "Oferta válida apenas hoje"
  }
}

REGRAS IMPORTANTES:
1. Adapte o TOM de acordo com a variante "${selectedVariant}":
   - DIRETA: Linguagem objetiva, foco em resultados concretos
   - CONSULTIVA: Linguagem educativa, explicações detalhadas, construção de autoridade
   - AGRESSIVA: Linguagem urgente, escassez, FOMO, gatilhos mentais fortes
2. Use os dados do ICP e dores para personalizar TODO o conteúdo
3. Os depoimentos devem parecer REAIS (use nomes brasileiros comuns)
4. Os valores da pilha de valor devem ser COERENTES com o nicho
5. Responda APENAS com o JSON válido, sem markdown`;
        break;

      case "generate-icps":
        // Build buyer pains/desires context from profile
        const buyerPainsContext = pppData?.profile ? `
**DORES DO COMPRADOR:**
- Dor Principal: ${(pppData.profile as any).main_pain || 'Não informada'}
- Dor Secundária: ${(pppData.profile as any).secondary_pain || 'Não informada'}
- Impactos: ${(pppData.profile as any).daily_impacts?.join(', ') || 'Não informados'}
- Desejo 1: ${(pppData.profile as any).desire_1 || 'Não informado'}
- Desejo 2: ${(pppData.profile as any).desire_2 || 'Não informado'}` : '';

        // Build promise context
        const promiseContext = pppData?.promise?.promise_text 
          ? `\n**PROMESSA DE VALOR:**\n${pppData.promise.promise_text}` 
          : '';

        systemPrompt = `Você é um estrategista de marketing especializado em definição de ICP (Ideal Customer Profile).
        
Sua tarefa é analisar o NEGÓCIO COMPLETO (produto, dores do comprador e promessa de valor) e identificar 3 perfis de cliente ideal que teriam MAIOR PROPENSÃO a comprar este produto/serviço.

IMPORTANTE: Os ICPs devem ser REALISTAS e ESPECÍFICOS para o negócio informado. 
Não invente perfis genéricos. Analise o nicho, o produto, as dores mapeadas e a promessa de valor.`;

        prompt = `Analise este negócio COMPLETO e identifique 3 perfis de cliente ideal:

## DADOS DO NEGÓCIO

**Nicho de Atuação:** ${pppData?.niche || 'Não informado'}

## PRODUTO/SERVIÇO

**Nome:** ${pppData?.profile?.product_name || 'Não informado'}
**Descrição:** ${pppData?.profile?.product_description || 'Não informado'}
**Diferenciais:** ${pppData?.profile?.differentiators?.join(', ') || 'Não informados'}
**Benefícios:** ${(pppData?.profile as any)?.benefits?.join(', ') || 'Não informados'}
${buyerPainsContext}
${promiseContext}

## INSTRUÇÕES

Com base em TODOS os dados acima (especialmente as DORES e a PROMESSA), gere 3 perfis de cliente ideal DIFERENTES e COMPLEMENTARES.

Os ICPs devem ser pessoas que:
1. SOFREM das dores mapeadas
2. DESEJAM o que a promessa oferece
3. São COERENTES com o nicho e produto

Para cada ICP, use a estrutura:
- name: Nome/persona brasileiro com identificação (ex: "Carlos, o Empresário", "Maria, a Nutricionista")
- profession: Profissão ou cargo específico
- age: Faixa etária típica (ex: "35-45 anos")
- gender: "masculino", "feminino" ou "ambos"
- reason_needs_solution: Por que essa pessoa precisa do produto/serviço (conectando com as dores mapeadas)

Responda em JSON:
{
  "icps": [
    { "name": "...", "profession": "...", "age": "...", "gender": "...", "reason_needs_solution": "..." },
    { "name": "...", "profession": "...", "age": "...", "gender": "...", "reason_needs_solution": "..." },
    { "name": "...", "profession": "...", "age": "...", "gender": "...", "reason_needs_solution": "..." }
  ]
}

REGRAS CRÍTICAS:
1. Os ICPs devem ser COERENTES com o nicho "${pppData?.niche || 'informado'}"
2. Os ICPs devem ser pessoas que REALMENTE comprariam "${pppData?.profile?.product_name || 'o produto'}"
3. Use as DORES DO COMPRADOR como base para o reason_needs_solution
4. Cada ICP deve representar um TIPO DIFERENTE de comprador
5. Responda APENAS com o JSON válido, sem markdown`;

        // For generate-icps, we just return the result without saving
        const icpAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.8,
          }),
        });

        if (!icpAiResponse.ok) {
          const errorText = await icpAiResponse.text();
          console.error('AI API error:', errorText);
          
          if (icpAiResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (icpAiResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          throw new Error(`AI API error: ${icpAiResponse.status}`);
        }

        const icpAiData = await icpAiResponse.json();
        const icpContent = icpAiData.choices?.[0]?.message?.content;

        if (!icpContent) {
          throw new Error('No content generated from AI');
        }

        console.log('ICP generation response received, parsing...');

        let parsedIcps;
        try {
          const jsonMatch = icpContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : icpContent;
          parsedIcps = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to parse AI response as JSON:', icpContent);
          throw new Error('Failed to parse AI response');
        }

        return new Response(
          JSON.stringify({ success: true, icps: parsedIcps.icps }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case "generate-pains":
        const painsSystemPrompt = `Você é um estrategista de marketing especializado em mapeamento de dores e desejos do público-alvo.

Sua tarefa é identificar as DORES mais profundas e os DESEJOS mais intensos de cada perfil de cliente ideal (ICP).

METODOLOGIA HORMOZI:
- DORES: O que causa sofrimento, frustração, perda de tempo/dinheiro
- DESEJOS: O que o cliente QUER (não o que precisa) - o sonho, o resultado ideal`;

        const icpsForPains = pppData?.icps?.map((icp) => `
**${icp.name}**
- Profissão: ${icp.profession || 'Não informada'}
- Idade: ${icp.age || 'Não informada'}
- Por que precisa: ${icp.reason_needs_solution || icp.current_situation || 'Não informado'}`
        ).join('\n') || 'Nenhum ICP definido';

        const painsPrompt = `## DADOS DO NEGÓCIO

**Nicho:** ${pppData?.niche || 'Não informado'}
**Produto:** ${pppData?.profile?.product_name || 'Não informado'}
**Descrição:** ${pppData?.profile?.product_description || 'Não informada'}

## PERFIS DE CLIENTE IDEAL (ICPs)

${icpsForPains}

## INSTRUÇÕES

Para CADA ICP listado acima, identifique:
1. **main_pain**: A dor PRINCIPAL (maior problema/frustração)
2. **secondary_pain**: Uma dor secundária relacionada
3. **daily_impacts**: Até 3 impactos no dia a dia (como a dor afeta a rotina)
4. **desire_1**: O desejo mais profundo (o que ele QUER conquistar)
5. **desire_2**: Outro desejo importante

Responda em JSON:
{
  "pains": [
    {
      "icp_name": "Nome do ICP 1",
      "main_pain": "...",
      "secondary_pain": "...",
      "daily_impacts": ["...", "...", "..."],
      "desire_1": "...",
      "desire_2": "..."
    }
  ]
}

REGRAS:
1. Seja ESPECÍFICO para o nicho "${pppData?.niche || 'informado'}"
2. As dores devem ser EMOCIONAIS e REAIS, não genéricas
3. Os desejos devem ser o que o cliente SONHA, não o que é racional
4. Use linguagem que o próprio cliente usaria
5. Responda APENAS com o JSON válido, sem markdown`;

        const painsAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: painsSystemPrompt },
              { role: 'user', content: painsPrompt },
            ],
            temperature: 0.8,
          }),
        });

        if (!painsAiResponse.ok) {
          const errorText = await painsAiResponse.text();
          console.error('AI API error:', errorText);
          
          if (painsAiResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (painsAiResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          throw new Error(`AI API error: ${painsAiResponse.status}`);
        }

        const painsAiData = await painsAiResponse.json();
        const painsContent = painsAiData.choices?.[0]?.message?.content;

        if (!painsContent) {
          throw new Error('No content generated from AI');
        }

        console.log('Pains generation response received, parsing...');

        let parsedPains;
        try {
          const jsonMatch = painsContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : painsContent;
          parsedPains = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to parse AI response as JSON:', painsContent);
          throw new Error('Failed to parse AI response');
        }

        return new Response(
          JSON.stringify({ success: true, pains: parsedPains.pains }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case "generate-buyer-pains":
        // Generate pains for the BUYER (not linked to specific ICPs)
        const buyerPainsSystemPrompt = `Você é um estrategista de marketing especializado em mapeamento de dores e desejos do público-alvo.

Sua tarefa é identificar as DORES mais profundas e os DESEJOS mais intensos de QUEM COMPRA este produto/serviço.

METODOLOGIA HORMOZI:
- DORES: O que causa sofrimento, frustração, perda de tempo/dinheiro
- DESEJOS: O que o cliente QUER (não o que precisa) - o sonho, o resultado ideal`;

        const buyerPainsPrompt = `## DADOS DO NEGÓCIO

**Nicho:** ${pppData?.niche || 'Não informado'}

## PRODUTO/SERVIÇO

**Nome:** ${pppData?.profile?.product_name || 'Não informado'}
**Descrição:** ${pppData?.profile?.product_description || 'Não informada'}
**Diferenciais:** ${pppData?.profile?.differentiators?.join(', ') || 'Não informados'}
**Benefícios:** ${(pppData?.profile as any)?.benefits?.join(', ') || 'Não informados'}

## INSTRUÇÕES

Com base no negócio acima, identifique as DORES e DESEJOS de quem compra este produto/serviço:

1. **main_pain**: A dor PRINCIPAL (maior problema/frustração)
2. **secondary_pain**: Uma dor secundária relacionada
3. **daily_impacts**: Até 3 impactos no dia a dia (como a dor afeta a rotina)
4. **desire_1**: O desejo mais profundo (o que ele QUER conquistar)
5. **desire_2**: Outro desejo importante

Responda em JSON:
{
  "pains": {
    "main_pain": "...",
    "secondary_pain": "...",
    "daily_impacts": ["...", "...", "..."],
    "desire_1": "...",
    "desire_2": "..."
  }
}

REGRAS:
1. Seja ESPECÍFICO para o nicho "${pppData?.niche || 'informado'}"
2. As dores devem ser EMOCIONAIS e REAIS, não genéricas
3. Os desejos devem ser o que o cliente SONHA, não o que é racional
4. Use linguagem que o próprio cliente usaria
5. Responda APENAS com o JSON válido, sem markdown`;

        const buyerPainsAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: buyerPainsSystemPrompt },
              { role: 'user', content: buyerPainsPrompt },
            ],
            temperature: 0.8,
          }),
        });

        if (!buyerPainsAiResponse.ok) {
          const errorText = await buyerPainsAiResponse.text();
          console.error('AI API error:', errorText);
          
          if (buyerPainsAiResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (buyerPainsAiResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          throw new Error(`AI API error: ${buyerPainsAiResponse.status}`);
        }

        const buyerPainsAiData = await buyerPainsAiResponse.json();
        const buyerPainsContent = buyerPainsAiData.choices?.[0]?.message?.content;

        if (!buyerPainsContent) {
          throw new Error('No content generated from AI');
        }

        console.log('Buyer pains generation response received, parsing...');

        let parsedBuyerPains;
        try {
          const jsonMatch = buyerPainsContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : buyerPainsContent;
          parsedBuyerPains = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to parse AI response as JSON:', buyerPainsContent);
          throw new Error('Failed to parse AI response');
        }

        return new Response(
          JSON.stringify({ success: true, pains: parsedBuyerPains.pains }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case "generate-promise":
        const promiseSystemPrompt = `Você é um estrategista de marketing especializado em criar promessas de valor irresistíveis usando a METODOLOGIA ALEX HORMOZI.

## METODOLOGIA ALEX HORMOZI - VALUE EQUATION

Uma promessa irresistível maximiza:
(Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort Required)

Elementos da promessa perfeita:
1. **Dream Outcome**: O desejo mais profundo do cliente (não o que ele PRECISA, mas o que ele QUER)
2. **Perceived Likelihood**: Por que é provável que funcione para ele especificamente
3. **Time Delay**: Em quanto tempo verá resultados (quanto menor, melhor)
4. **Effort & Sacrifice**: O que ele NÃO precisa fazer/sofrer (quanto menos, melhor)

FÓRMULA DA PROMESSA HORMOZI:
"[QUEM] consegue [DESEJO REALIZADO] em [PRAZO] sem [MAIOR DOR/OBJEÇÃO]"`;

        // Build pains and desires context
        const painsContext = pppData?.pains?.map((pain, i) => {
          const icpName = pain.icps?.name || `ICP ${i + 1}`;
          return `
**${icpName}:**
- Dor Principal: ${pain.main_pain || 'Não informada'}
- Dor Secundária: ${pain.secondary_pain || 'Não informada'}
- Impactos no dia a dia: ${pain.daily_impacts?.join(', ') || 'Não informados'}
- Desejo 1: ${pain.desire_1 || 'Não informado'}
- Desejo 2: ${pain.desire_2 || 'Não informado'}`;
        }).join('\n') || 'Nenhuma dor/desejo mapeado';

        const icpsContext = pppData?.icps?.map((icp, i) => `
**ICP ${i + 1}: ${icp.name}**
- Profissão: ${icp.profession || icp.segment || 'Não informada'}
- Idade: ${icp.age || 'Não informada'}
- Por que precisa da solução: ${icp.reason_needs_solution || icp.current_situation || 'Não informado'}`
        ).join('\n') || 'Nenhum ICP definido';

        const promisePrompt = `## DADOS DO NEGÓCIO

**Nicho:** ${pppData?.niche || 'Não informado'}

## PRODUTO/SERVIÇO

**Nome:** ${pppData?.profile?.product_name || 'Não informado'}
**Descrição:** ${pppData?.profile?.product_description || 'Não informada'}
**Diferenciais:** ${pppData?.profile?.differentiators?.join(', ') || 'Não informados'}

## CLIENTES IDEAIS (ICPs)

${icpsContext}

## DORES E DESEJOS DO PÚBLICO (CRÍTICO!)

${painsContext}

## INSTRUÇÕES - METODOLOGIA HORMOZI

Crie UMA promessa de valor que:
1. Transforme a DOR PRINCIPAL em DESEJO REALIZADO
2. Minimize objeções (tempo, esforço, risco)
3. Seja específica e mensurável quando possível
4. Use a fórmula: "[QUEM] consegue [DESEJO] em [PRAZO] sem [DOR/OBJEÇÃO]"

EXEMPLOS DE PROMESSAS HORMOZI:
- "Donos de academia lotam suas unidades em 90 dias sem depender de indicações"
- "Dentistas fecham 10 tratamentos de alto valor por semana sem precisar baixar preço"
- "Infoprodutores faturam R$ 100k/mês sem aparecer nas redes sociais"
- "Coaches conseguem 20 clientes novos por mês sem fazer prospecção ativa"

Responda em JSON:
{
  "promise": "Sua promessa aqui seguindo a fórmula Hormozi..."
}

REGRAS CRÍTICAS:
1. A promessa DEVE seguir a fórmula Hormozi: [QUEM] + [DESEJO] + [PRAZO] + sem [DOR]
2. Use os DESEJOS mapeados (desire_1, desire_2) como base do resultado prometido
3. Use as DORES mapeadas como base da objeção eliminada
4. Máximo de 2 frases
5. Responda APENAS com o JSON válido, sem markdown`;

        const promiseAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: promiseSystemPrompt },
              { role: 'user', content: promisePrompt },
            ],
            temperature: 0.8,
          }),
        });

        if (!promiseAiResponse.ok) {
          const errorText = await promiseAiResponse.text();
          console.error('AI API error:', errorText);
          
          if (promiseAiResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (promiseAiResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          throw new Error(`AI API error: ${promiseAiResponse.status}`);
        }

        const promiseAiData = await promiseAiResponse.json();
        const promiseContentRes = promiseAiData.choices?.[0]?.message?.content;

        if (!promiseContentRes) {
          throw new Error('No content generated from AI');
        }

        console.log('Promise generation response received, parsing...');

        let parsedPromise;
        try {
          const jsonMatch = promiseContentRes.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : promiseContentRes;
          parsedPromise = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to parse AI response as JSON:', promiseContentRes);
          throw new Error('Failed to parse AI response');
        }

        return new Response(
          JSON.stringify({ success: true, promise: parsedPromise.promise }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case "ads":
        // If offerId is provided, fetch the offer data
        let offerContext = "";
        let validOfferId: string | null = null;
        
        if (offerId) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data: offerData } = await supabase
            .from('offers_hormozi')
            .select('*')
            .eq('id', offerId)
            .maybeSingle();
          
          if (offerData) {
            validOfferId = offerId;
            offerContext = `
## OFERTA BASE PARA OS ANÚNCIOS

**Promessa:** ${offerData.promise || 'Não definida'}
**Mecanismo Único:** ${offerData.unique_mechanism || 'Não definido'}
**Garantia:** ${offerData.guarantee || 'Não definida'}
**CTA Principal:** ${offerData.main_cta || 'Não definido'}
**Prova Social:** ${offerData.proof || 'Não definida'}

`;
          } else {
            console.warn(`Offer ${offerId} not found, proceeding without offer context`);
          }
        }

        // Build enhanced context with buyer pains from profile
        const buyerPainsFromProfile = pppData?.profile ? `
## DORES E DESEJOS DO COMPRADOR (CRÍTICO!)

**Dor Principal:** ${pppData.profile.main_pain || 'Não informada'}
**Dor Secundária:** ${pppData.profile.secondary_pain || 'Não informada'}
**Impactos no Dia a Dia:** ${pppData.profile.daily_impacts?.join(', ') || 'Não informados'}
**Desejo 1:** ${pppData.profile.desire_1 || 'Não informado'}
**Desejo 2:** ${pppData.profile.desire_2 || 'Não informado'}

## REGIÃO DE ATUAÇÃO
${pppData.profile.region?.join(', ') || 'Não informada'}
` : '';

        systemPrompt = `Você é um especialista em anúncios para redes sociais usando a metodologia Ladeira de criação de criativos.

Sua tarefa é criar **15 ANÚNCIOS NO TOTAL**:
- 5 ROTEIROS DE VÍDEO (estrutura de 6 seções, duração flexível 20-80s)
- 10 ANÚNCIOS ESTÁTICOS (5 baseados em DORES + 5 baseados em DESEJOS)

## ESTRUTURA DOS ROTEIROS DE VÍDEO (OBRIGATÓRIA - 6 SEÇÕES)

Cada vídeo DEVE seguir esta estrutura na ordem:
1. **HOOK** - Chamada que prende atenção (pergunta, promessa, quebra de padrão ou frase do cliente)
2. **PROBLEMA** - O que a pessoa está enfrentando hoje (a dor/sintoma/situação)
3. **POR QUE ISSO É RUIM** - Consequência clara de não resolver (perda de tempo, dinheiro, saúde, oportunidade, risco, estresse)
4. **SOLUÇÃO** - O caminho simples/seguro para resolver (método, serviço, produto, sistema) + como ajuda
5. **PROVA** - Evidência rápida (resultado, número, depoimento, "casos reais", antes/depois, autoridade) - opcional mas recomendado
6. **CTA** - A próxima ação em 1 passo (clique, mande "X", peça orçamento, agende, fale no WhatsApp)

## DURAÇÃO DOS VÍDEOS
- Mínimo: 20-25 segundos
- Máximo: 70-80 segundos
- Você decide a duração ideal para cada roteiro com base em:
  - Complexidade do produto/serviço
  - Tipo de vídeo
  - Quantidade de prova necessária
  - Nível de consciência do público

## OS 5 TIPOS DE VÍDEO

1. **pattern_break** (Quebra de Padrão) - Hook: Afirmação surpreendente que desafia crença comum - Duração típica: 20-35s
2. **question_box** (Caixinha de Perguntas) - Hook: Pergunta real do público-alvo - Duração típica: 35-50s
3. **daily_scene** (Cotidiano + Problema) - Hook: Cena do dia-a-dia com identificação - Duração típica: 30-45s
4. **location_based** (Direcionado para Região) - Hook: Menção geográfica + oportunidade - Duração típica: 25-40s
5. **social_proof** (Prova Social) - Hook: Resultado de cliente real - Duração típica: 45-80s

## ESTRUTURA DOS ANÚNCIOS ESTÁTICOS

Cada estático deve conter:
- **headline**: Título impactante (até 15 palavras)
- **subheadline**: Subtítulo complementar
- **body_text**: Copy explicativa (2-3 frases)
- **eliminators**: Array de 3 bullets no formato "SEM [objeção]" (ex: "SEM INSTALAÇÃO", "SEM DOR DE CABEÇA")
- **cta**: Call-to-action
- **visual_suggestion**: Sugestão de imagem para o criativo`;

        prompt = `Com base nos seguintes dados:

${offerContext}${context}

${buyerPainsFromProfile}

## PROMESSA DE VALOR
${pppData?.promise?.promise_text || 'Não definida'}

Crie os 15 anúncios seguindo a estrutura abaixo. Responda em JSON:

{
  "video_scripts": [
    {
      "video_type": "pattern_break",
      "title": "Quebra de Padrão",
      "duration": "30s",
      "hook": "Chamada inicial surpreendente",
      "problem": "Descrição do problema que a pessoa enfrenta",
      "why_bad": "Consequência clara de não resolver",
      "solution": "Como a solução resolve de forma simples",
      "proof": "Evidência rápida (opcional mas recomendado)",
      "cta": "Próxima ação em 1 passo",
      "visual_notes": "Sugestões de cena/imagem para gravação"
    },
    {
      "video_type": "question_box",
      "title": "Caixinha de Perguntas",
      "duration": "45s",
      "hook": "Pergunta frequente do público",
      "problem": "...",
      "why_bad": "...",
      "solution": "...",
      "proof": "...",
      "cta": "...",
      "visual_notes": "..."
    },
    {
      "video_type": "daily_scene",
      "title": "Cotidiano + Problema",
      "duration": "35s",
      "hook": "Situação do dia-a-dia",
      "problem": "...",
      "why_bad": "...",
      "solution": "...",
      "proof": "...",
      "cta": "...",
      "visual_notes": "..."
    },
    {
      "video_type": "location_based",
      "title": "Direcionado para Região",
      "duration": "25s",
      "hook": "Menção geográfica específica",
      "problem": "...",
      "why_bad": "...",
      "solution": "...",
      "proof": "...",
      "cta": "...",
      "visual_notes": "..."
    },
    {
      "video_type": "social_proof",
      "title": "Prova Social",
      "duration": "70s",
      "hook": "Resultado de cliente real",
      "problem": "...",
      "why_bad": "...",
      "solution": "...",
      "proof": "...",
      "cta": "...",
      "visual_notes": "..."
    }
  ],
  "static_ads": {
    "pain_based": [
      {
        "angle": "pain",
        "focus": "main_pain",
        "headline": "Headline focada na dor principal",
        "subheadline": "Subtítulo complementar",
        "body_text": "Copy de 2-3 frases",
        "eliminators": ["SEM OBJEÇÃO 1", "SEM OBJEÇÃO 2", "SEM OBJEÇÃO 3"],
        "cta": "Texto do CTA",
        "visual_suggestion": "Sugestão de imagem"
      },
      {
        "angle": "pain",
        "focus": "secondary_pain",
        "headline": "...",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      },
      {
        "angle": "pain",
        "focus": "impact_1",
        "headline": "...",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      },
      {
        "angle": "pain",
        "focus": "impact_2",
        "headline": "...",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      },
      {
        "angle": "pain",
        "focus": "consequence",
        "headline": "...",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      }
    ],
    "desire_based": [
      {
        "angle": "desire",
        "focus": "desire_1",
        "headline": "Headline focada no desejo 1",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      },
      {
        "angle": "desire",
        "focus": "desire_2",
        "headline": "...",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      },
      {
        "angle": "desire",
        "focus": "promise",
        "headline": "...",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      },
      {
        "angle": "desire",
        "focus": "result",
        "headline": "...",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      },
      {
        "angle": "desire",
        "focus": "transformation",
        "headline": "...",
        "subheadline": "...",
        "body_text": "...",
        "eliminators": ["...", "...", "..."],
        "cta": "...",
        "visual_suggestion": "..."
      }
    ]
  }
}

REGRAS CRÍTICAS:
1. Cada vídeo DEVE ter as 6 seções na ordem: HOOK → PROBLEMA → POR QUE É RUIM → SOLUÇÃO → PROVA → CTA
2. Use as DORES REAIS do onboarding para os anúncios baseados em dor (main_pain, secondary_pain, daily_impacts)
3. Use os DESEJOS REAIS do onboarding para os anúncios baseados em desejo (desire_1, desire_2)
4. Use a REGIÃO de atuação no anúncio location_based
5. A duração deve ser definida com base na complexidade (20-80s)
6. Responda APENAS com o JSON válido, sem markdown`;
        
        // Store validOfferId for use in save section
        (body as any)._validOfferId = validOfferId;
        break;
    }

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated from AI');
    }

    console.log('AI response received, parsing...');

    // Parse the JSON from the response
    let parsedContent;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Failed to parse AI response');
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (type) {
      case "offer":
        // Insert new offer with options format
        const options = parsedContent.options || {};
        const { data: insertedOffer, error: offerError } = await supabase.from('offers_hormozi').insert({
          client_id: clientId,
          icp_id: icpId || null,
          // Store first option as main value for backwards compatibility
          promise: options.promise?.[0] || parsedContent.promise || null,
          unique_mechanism: options.unique_mechanism?.[0] || parsedContent.unique_mechanism || null,
          guarantee: options.guarantee?.[0] || parsedContent.guarantee || null,
          proof: options.proof?.[0] || parsedContent.proof || null,
          risk_reversal: options.risk_reversal?.[0] || parsedContent.risk_reversal || null,
          main_cta: options.main_cta?.[0] || parsedContent.main_cta || null,
          value_stack: parsedContent.value_stack,
          demand_generation_strategies: parsedContent.demand_plan || null,
          // Store all generated options
          generated_options: options,
          // Initialize selected_options with first options selected
          selected_options: {
            promise: [0],
            unique_mechanism: [0],
            guarantee: [0],
            proof: [0],
            risk_reversal: [0],
            main_cta: [0],
          },
        }).select().single();
        
        if (offerError) throw offerError;
        console.log('Offer with options saved successfully');
        
        // Return the created offer with options
        return new Response(
          JSON.stringify({ success: true, data: parsedContent, offer: insertedOffer }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case "lp":
        // Insert single landing page with the selected variant (don't delete existing)
        const lpVariantToSave = lpVariant || "direct";
        const { error: lpError } = await supabase.from('landing_pages').insert({
          client_id: clientId,
          variant: lpVariantToSave,
          sections: parsedContent,
        });
        if (lpError) throw lpError;
        console.log(`Landing page (${lpVariantToSave}) saved successfully`);
        break;

      case "ads":
        // Get the validated offer ID (or null if offer was deleted)
        const validatedOfferId = (body as any)._validOfferId || null;
        
        // Delete existing ads for this client/offer
        if (validatedOfferId) {
          await supabase.from('ads').delete().eq('offer_id', validatedOfferId);
        } else {
          await supabase.from('ads').delete().eq('client_id', clientId).is('offer_id', null);
        }
        
        // Insert video ads (5 scripts with new structure)
        for (const video of parsedContent.video_scripts || []) {
          const { error: videoError } = await supabase.from('ads').insert({
            client_id: clientId,
            offer_id: validatedOfferId,
            asset_type: 'video_ad',
            video_type: video.video_type,
            video_hook: video.hook,
            video_problem: video.problem,
            video_why_bad: video.why_bad,
            video_solution: video.solution,
            video_proof: video.proof,
            video_cta: video.cta,
            video_duration: video.duration,
            video_visual_notes: video.visual_notes,
            ad_angle: video.video_type,
            headline: video.title,
          });
          if (videoError) throw videoError;
        }

        // Insert static ads - pain based (5)
        for (const ad of parsedContent.static_ads?.pain_based || []) {
          const { error: adError } = await supabase.from('ads').insert({
            client_id: clientId,
            offer_id: validatedOfferId,
            asset_type: 'static_ad',
            angle: ad.angle,
            focus: ad.focus,
            headline: ad.headline,
            subheadline: ad.subheadline,
            body_text: ad.body_text,
            eliminators: ad.eliminators,
            cta: ad.cta,
            visual_suggestion: ad.visual_suggestion,
            ad_angle: `${ad.angle}_${ad.focus}`,
          });
          if (adError) throw adError;
        }

        // Insert static ads - desire based (5)
        for (const ad of parsedContent.static_ads?.desire_based || []) {
          const { error: adError } = await supabase.from('ads').insert({
            client_id: clientId,
            offer_id: validatedOfferId,
            asset_type: 'static_ad',
            angle: ad.angle,
            focus: ad.focus,
            headline: ad.headline,
            subheadline: ad.subheadline,
            body_text: ad.body_text,
            eliminators: ad.eliminators,
            cta: ad.cta,
            visual_suggestion: ad.visual_suggestion,
            ad_angle: `${ad.angle}_${ad.focus}`,
          });
          if (adError) throw adError;
        }

        console.log('15 ads saved successfully (5 videos + 10 statics)');
        break;
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handler for refining a specific ad
async function handleRefineAd(
  body: RequestBody,
  apiKey: string
) {
  const { adId, adType, currentContent, instruction } = body;
  
  if (!adId || !adType || !currentContent || !instruction) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields for ad refinement' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const systemPrompt = `Você é um especialista em copywriting e anúncios. 
Sua tarefa é REFINAR um anúncio existente com base na instrução do usuário.
Mantenha a estrutura original, apenas ajuste o conteúdo conforme solicitado.`;

  let prompt = "";
  if (adType === "video") {
    prompt = `## ROTEIRO DE VÍDEO ATUAL

HOOK: ${(currentContent as any).hook}
PROBLEMA: ${(currentContent as any).problem}
POR QUE É RUIM: ${(currentContent as any).why_bad}
SOLUÇÃO: ${(currentContent as any).solution}
PROVA: ${(currentContent as any).proof}
CTA: ${(currentContent as any).cta}
DURAÇÃO: ${(currentContent as any).duration}

## INSTRUÇÃO DO USUÁRIO
${instruction}

## TAREFA
Refine o roteiro conforme a instrução. Mantenha a estrutura de 6 seções.

Responda em JSON:
{
  "hook": "...",
  "problem": "...",
  "why_bad": "...",
  "solution": "...",
  "proof": "...",
  "cta": "...",
  "duration": "...",
  "visual_notes": "..."
}`;
  } else {
    prompt = `## ANÚNCIO ESTÁTICO ATUAL

HEADLINE: ${(currentContent as any).headline}
SUBHEADLINE: ${(currentContent as any).subheadline}
COPY: ${(currentContent as any).body_text}
ELIMINATORS: ${(currentContent as any).eliminators?.join(', ')}
CTA: ${(currentContent as any).cta}

## INSTRUÇÃO DO USUÁRIO
${instruction}

## TAREFA
Refine o anúncio conforme a instrução.

Responda em JSON:
{
  "headline": "...",
  "subheadline": "...",
  "body_text": "...",
  "eliminators": ["...", "...", "..."],
  "cta": "...",
  "visual_suggestion": "..."
}`;
  }

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (aiResponse.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    throw new Error('AI API error');
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content;

  let parsedContent;
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    parsedContent = JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse refine response:', content);
    throw new Error('Failed to parse AI response');
  }

  return new Response(
    JSON.stringify({ success: true, refinedContent: parsedContent }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler for refreshing a specific field
async function handleRefreshField(
  field: string,
  offerId: string,
  pppData: PPPData | undefined,
  apiKey: string
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get current offer
  const { data: offer, error: offerError } = await supabase
    .from('offers_hormozi')
    .select('*, clients(niche)')
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    return new Response(
      JSON.stringify({ error: 'Offer not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const fieldLabels: Record<string, string> = {
    promise: 'promessa principal',
    unique_mechanism: 'mecanismo único',
    guarantee: 'garantia',
    proof: 'prova social',
    risk_reversal: 'reversão de risco',
    main_cta: 'call-to-action principal',
  };

  const fieldLabel = fieldLabels[field] || field;
  const context = pppData ? buildContext(pppData) : '';

  const prompt = `Com base no seguinte contexto de negócio:

${context}

Gere 2 novas opções criativas e diferentes para o campo "${fieldLabel}" de uma Oferta Hormozi.
As opções devem ser impactantes, persuasivas e adequadas ao público-alvo.
Uma opção pode ser mais emocional e outra mais racional/lógica.

Responda APENAS com um JSON no formato:
{
  "options": ["Opção 1", "Opção 2"]
}`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Você é um especialista em copywriting e ofertas irresistíveis usando a metodologia Alex Hormozi.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (aiResponse.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    throw new Error('AI API error');
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content;

  let parsedContent;
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    parsedContent = JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse refresh field response:', content);
    throw new Error('Failed to parse AI response');
  }

  const newOptions = parsedContent.options;
  if (!Array.isArray(newOptions) || newOptions.length !== 2) {
    throw new Error('Invalid options format from AI');
  }

  // Update the offer with new options for this field
  const currentGeneratedOptions = (offer.generated_options as Record<string, string[]>) || {};
  currentGeneratedOptions[field] = newOptions;

  // Reset selection for this field to first option
  const currentSelectedOptions = (offer.selected_options as Record<string, number[]>) || {};
  currentSelectedOptions[field] = [0];

  const { error: updateError } = await supabase
    .from('offers_hormozi')
    .update({
      generated_options: currentGeneratedOptions,
      selected_options: currentSelectedOptions,
      [field]: newOptions[0], // Update main field with first option
    })
    .eq('id', offerId);

  if (updateError) throw updateError;

  return new Response(
    JSON.stringify({ success: true, options: newOptions }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function buildContext(pppData: PPPData): string {
  const parts: string[] = [];

  // Niche info
  if (pppData.niche) {
    parts.push('## NICHO');
    parts.push(pppData.niche);
    parts.push('');
  }

  // Product info
  if (pppData.profile) {
    parts.push('## PRODUTO/SERVIÇO');
    if (pppData.profile.product_name) {
      parts.push(`Nome: ${pppData.profile.product_name}`);
    }
    if (pppData.profile.product_description) {
      parts.push(`Descrição: ${pppData.profile.product_description}`);
    }
    if (pppData.profile.differentiators?.length) {
      parts.push(`Diferenciais: ${pppData.profile.differentiators.join(', ')}`);
    }
    if (pppData.profile.benefits?.length) {
      parts.push(`Benefícios: ${pppData.profile.benefits.join(', ')}`);
    }
    parts.push('');
  }

  // ICPs
  if (pppData.icps?.length) {
    parts.push('## PERFIL DE CLIENTE IDEAL (ICP)');
    for (const icp of pppData.icps) {
      parts.push(`### ${icp.name}`);
      if (icp.segment) parts.push(`Segmento: ${icp.segment}`);
      if (icp.characteristics) parts.push(`Características: ${icp.characteristics}`);
      if (icp.current_situation) parts.push(`Situação Atual: ${icp.current_situation}`);
      
      // Find pains for this ICP
      const icpPains = pppData.pains?.filter(p => p.icp_id === icp.id);
      if (icpPains?.length) {
        for (const pain of icpPains) {
          if (pain.main_pain) parts.push(`Dor Principal: ${pain.main_pain}`);
          if (pain.consequence) parts.push(`Consequência: ${pain.consequence}`);
          if (pain.daily_impacts?.length) {
            parts.push(`Impactos no dia a dia: ${pain.daily_impacts.join(', ')}`);
          }
        }
      }
      parts.push('');
    }
  }

  // Promise
  if (pppData.promise?.promise_text) {
    parts.push('## PROMESSA PRINCIPAL');
    parts.push(pppData.promise.promise_text);
    parts.push('');
  }

  return parts.join('\n');
}
