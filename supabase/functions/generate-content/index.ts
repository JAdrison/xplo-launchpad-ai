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
  } | null;
  icps: Array<{
    id: string;
    name: string;
    segment: string | null;
    characteristics: string | null;
    current_situation: string | null;
  }>;
  pains: Array<{
    icp_id: string;
    main_pain: string | null;
    consequence: string | null;
    daily_impacts: string[] | null;
    icps: { name: string } | null;
  }>;
  promise: {
    promise_text: string | null;
  } | null;
  niche?: string | null;
}

interface RequestBody {
  type: "offer" | "lp" | "ads" | "refresh-field" | "generate-icps" | "generate-promise";
  clientId: string;
  pppData?: PPPData;
  icpId?: string;
  offerId?: string;
  field?: string;
  currentOptions?: string[];
  lpVariant?: "direct" | "consultive" | "aggressive";
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

    console.log(`Generating ${type} for client ${clientId}, ICP: ${icpId || 'all'}, field: ${field || 'all'}`);

    // Get the Lovable API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Handle refresh-field type - regenerate 2 options for a specific field
    if (type === "refresh-field" && field && offerId) {
      return await handleRefreshField(field, offerId, pppData, LOVABLE_API_KEY);
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
        systemPrompt = `Você é um estrategista de marketing especializado em definição de ICP (Ideal Customer Profile).
        
Sua tarefa é analisar o NEGÓCIO ESPECÍFICO e identificar 3 perfis de cliente ideal que teriam MAIOR PROPENSÃO a comprar este produto/serviço.

IMPORTANTE: Os ICPs devem ser REALISTAS e ESPECÍFICOS para o negócio informado. 
Não invente perfis genéricos. Analise o nicho, o produto e os diferenciais.`;

        prompt = `Analise este negócio e identifique 3 perfis de cliente ideal:

## DADOS DO NEGÓCIO

**Nicho de Atuação:** ${pppData?.niche || 'Não informado'}

## PRODUTO/SERVIÇO

**Nome:** ${pppData?.profile?.product_name || 'Não informado'}
**Descrição:** ${pppData?.profile?.product_description || 'Não informado'}
**Diferenciais:** ${pppData?.profile?.differentiators?.join(', ') || 'Não informados'}

## INSTRUÇÕES

Com base ESPECIFICAMENTE neste negócio, gere 3 perfis de cliente ideal DIFERENTES e COMPLEMENTARES.

Para cada ICP:
- name: Nome/persona brasileiro (ex: "Empresário Carlos", "Dona Maria")
- segment: Segmento específico que esse perfil representa
- characteristics: Características comportamentais e situacionais (2-3 frases)
- current_situation: Situação atual que o leva a precisar deste produto (2-3 frases)

Responda em JSON:
{
  "icps": [
    { "name": "...", "segment": "...", "characteristics": "...", "current_situation": "..." },
    { "name": "...", "segment": "...", "characteristics": "...", "current_situation": "..." },
    { "name": "...", "segment": "...", "characteristics": "...", "current_situation": "..." }
  ]
}

REGRAS CRÍTICAS:
1. Os ICPs devem ser COERENTES com o nicho "${pppData?.niche || 'informado'}"
2. Os ICPs devem ser pessoas que REALMENTE comprariam "${pppData?.profile?.product_name || 'o produto'}"
3. Use exemplos CONCRETOS e ESPECÍFICOS, não genéricos
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

      case "generate-promise":
        const promiseSystemPrompt = `Você é um estrategista de marketing especializado em criar promessas de valor irresistíveis.

Uma boa promessa de valor:
1. É específica sobre o resultado entregue
2. Inclui um prazo ou métrica quando possível
3. Foca na transformação, não nas características
4. Usa a linguagem do cliente
5. É memorável e diferenciadora`;

        const promisePrompt = `Analise os dados completos deste negócio e crie UMA promessa de valor impactante:

## DADOS DO NEGÓCIO

**Nicho:** ${pppData?.niche || 'Não informado'}

## PRODUTO/SERVIÇO

**Nome:** ${pppData?.profile?.product_name || 'Não informado'}
**Descrição:** ${pppData?.profile?.product_description || 'Não informada'}
**Diferenciais:** ${pppData?.profile?.differentiators?.join(', ') || 'Não informados'}

## CLIENTES IDEAIS (ICPs)

${pppData?.icps?.map((icp, i) => `
**ICP ${i + 1}: ${icp.name}**
- Segmento: ${icp.segment || 'Não informado'}
- Características: ${icp.characteristics || 'Não informadas'}
- Situação Atual: ${icp.current_situation || 'Não informada'}
`).join('\n') || 'Nenhum ICP definido'}

## DORES MAPEADAS

${pppData?.pains?.map((pain, i) => `
**Dor ${i + 1}:** ${pain.main_pain || 'Não informada'}
- Consequência: ${pain.consequence || 'Não informada'}
- Impactos: ${pain.daily_impacts?.join(', ') || 'Não informados'}
`).join('\n') || 'Nenhuma dor mapeada'}

## INSTRUÇÕES

Crie UMA promessa de valor que:
1. Seja ESPECÍFICA para o nicho "${pppData?.niche || 'informado'}"
2. Resolva as DORES identificadas
3. Seja direcionada aos ICPs descritos
4. Use linguagem clara e impactante
5. Inclua resultado + prazo quando possível

Responda em JSON:
{
  "promise": "Sua promessa aqui..."
}

Exemplo de boa promessa:
"Ajudo [ICP] a [resultado específico] em [prazo] usando [mecanismo único]."

REGRAS CRÍTICAS:
1. Máximo de 2 frases
2. Deve ser MEMORÁVEL e DIFERENCIADORA
3. Responda APENAS com o JSON válido, sem markdown`;

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
        const promiseContent = promiseAiData.choices?.[0]?.message?.content;

        if (!promiseContent) {
          throw new Error('No content generated from AI');
        }

        console.log('Promise generation response received, parsing...');

        let parsedPromise;
        try {
          const jsonMatch = promiseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : promiseContent;
          parsedPromise = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to parse AI response as JSON:', promiseContent);
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

        systemPrompt = `Você é um especialista em anúncios para redes sociais, criando tanto anúncios estáticos quanto scripts de vídeo.
Sua tarefa é criar anúncios com base na oferta e dados de discovery fornecidos.
Os anúncios devem ser coerentes com a oferta criada anteriormente.`;
        prompt = `Com base nos seguintes dados:

${offerContext}${context}

Crie os seguintes anúncios baseados na oferta acima:

**2 Anúncios Estáticos:**
Para cada um, inclua: headline, body_text, cta, ad_angle (ângulo/abordagem)

**3 Scripts de Vídeo:**
1. **Direto**: Script curto e direto ao ponto (15-30 segundos)
2. **Educacional**: Script que ensina algo e vende no final (45-60 segundos)
3. **Caixinha de Perguntas**: Script no formato de responder perguntas comuns (30-45 segundos)

Para cada script, inclua: hook (gancho inicial), body (desenvolvimento), cta (chamada para ação), duration (duração sugerida)

Responda em formato JSON com as chaves: static_ads (array de 2), video_scripts (objeto com direct, educational, question_box)`;
        
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
        
        // Delete existing ads for this client
        if (validatedOfferId) {
          await supabase.from('ads').delete().eq('offer_id', validatedOfferId);
        } else {
          // If no valid offer, just delete by client_id
          await supabase.from('ads').delete().eq('client_id', clientId).is('offer_id', null);
        }
        
        // Insert static ads
        for (const ad of parsedContent.static_ads || []) {
          const { error: adError } = await supabase.from('ads').insert({
            client_id: clientId,
            offer_id: validatedOfferId,
            asset_type: 'static_ad',
            headline: ad.headline,
            body_text: ad.body_text,
            cta: ad.cta,
            ad_angle: ad.ad_angle,
          });
          if (adError) throw adError;
        }

        // Insert video ads
        const videoTypes = ['direct', 'educational', 'question_box'];
        for (const videoType of videoTypes) {
          const script = parsedContent.video_scripts?.[videoType];
          if (script) {
            const { error: videoError } = await supabase.from('ads').insert({
              client_id: clientId,
              offer_id: validatedOfferId,
              asset_type: 'video_ad',
              ad_angle: videoType,
              script: script,
            });
            if (videoError) throw videoError;
          }
        }
        console.log('Ads saved successfully');
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
