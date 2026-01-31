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
}

interface RequestBody {
  type: "offer" | "lp" | "ads";
  clientId: string;
  pppData: PPPData;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, clientId, pppData } = await req.json() as RequestBody;

    console.log(`Generating ${type} for client ${clientId}`);

    // Build context from PPP data
    const context = buildContext(pppData);

    // Get the Lovable API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate content based on type
    let prompt = "";
    let systemPrompt = "";

    switch (type) {
      case "offer":
        systemPrompt = `Você é um especialista em marketing direto e criação de ofertas irresistíveis usando a metodologia do Alex Hormozi.
Sua tarefa é criar uma oferta estruturada com base nos dados de discovery (PPP) fornecidos.`;
        prompt = `Com base nos seguintes dados de discovery:

${context}

Crie uma Oferta Hormozi completa com:
1. **Promessa Principal**: Uma frase impactante que resume a transformação
2. **Mecanismo Único**: O que diferencia seu método/produto
3. **Garantia**: Tipo de garantia oferecida (30 dias, resultado ou dinheiro de volta, etc)
4. **Prova Social**: Sugestões de provas sociais que podem ser usadas
5. **Reversão de Risco**: Como você remove o risco do cliente
6. **Pilha de Valor**: Lista de bônus e entregáveis com valores percebidos
7. **CTA Principal**: Call-to-action principal

Responda em formato JSON com as chaves: promise, unique_mechanism, guarantee, proof, risk_reversal, value_stack (array de objetos com name e perceived_value), main_cta`;
        break;

      case "lp":
        systemPrompt = `Você é um copywriter especializado em landing pages de alta conversão.
Sua tarefa é criar as seções de uma landing page com base nos dados de discovery fornecidos.`;
        prompt = `Com base nos seguintes dados de discovery:

${context}

Crie as seções de uma Landing Page em 3 variantes (direct, consultive, aggressive).
Para cada variante, inclua:
1. **Headline**: Título principal chamativo
2. **Subheadline**: Subtítulo que reforça a promessa
3. **Hero Text**: Texto de abertura
4. **Benefits**: Lista de 3-5 benefícios principais
5. **Social Proof**: Sugestão de prova social
6. **CTA Text**: Texto do botão de ação
7. **CTA Subtext**: Texto abaixo do botão (urgência/escassez)

Responda em formato JSON com um objeto contendo 3 chaves (direct, consultive, aggressive), cada uma com as seções acima.`;
        break;

      case "ads":
        systemPrompt = `Você é um especialista em anúncios para redes sociais, criando tanto anúncios estáticos quanto scripts de vídeo.
Sua tarefa é criar anúncios com base nos dados de discovery fornecidos.`;
        prompt = `Com base nos seguintes dados de discovery:

${context}

Crie os seguintes anúncios:

**2 Anúncios Estáticos:**
Para cada um, inclua: headline, body_text, cta, ad_angle (ângulo/abordagem)

**3 Scripts de Vídeo:**
1. **Direto**: Script curto e direto ao ponto (15-30 segundos)
2. **Educacional**: Script que ensina algo e vende no final (45-60 segundos)
3. **Caixinha de Perguntas**: Script no formato de responder perguntas comuns (30-45 segundos)

Para cada script, inclua: hook (gancho inicial), body (desenvolvimento), cta (chamada para ação), duration (duração sugerida)

Responda em formato JSON com as chaves: static_ads (array de 2), video_scripts (objeto com direct, educational, question_box)`;
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
        // Delete existing offers for this client
        await supabase.from('offers_hormozi').delete().eq('client_id', clientId);
        
        // Insert new offer
        const { error: offerError } = await supabase.from('offers_hormozi').insert({
          client_id: clientId,
          promise: parsedContent.promise,
          unique_mechanism: parsedContent.unique_mechanism,
          guarantee: parsedContent.guarantee,
          proof: parsedContent.proof,
          risk_reversal: parsedContent.risk_reversal,
          value_stack: parsedContent.value_stack,
          main_cta: parsedContent.main_cta,
        });
        if (offerError) throw offerError;
        console.log('Offer saved successfully');
        break;

      case "lp":
        // Delete existing landing pages for this client
        await supabase.from('landing_pages').delete().eq('client_id', clientId);
        
        // Insert landing pages for each variant
        const variants = ['direct', 'consultive', 'aggressive'] as const;
        for (const variant of variants) {
          const { error: lpError } = await supabase.from('landing_pages').insert({
            client_id: clientId,
            variant,
            sections: parsedContent[variant],
          });
          if (lpError) throw lpError;
        }
        console.log('Landing pages saved successfully');
        break;

      case "ads":
        // Delete existing ads for this client
        await supabase.from('ads').delete().eq('client_id', clientId);
        
        // Insert static ads
        for (const ad of parsedContent.static_ads || []) {
          const { error: adError } = await supabase.from('ads').insert({
            client_id: clientId,
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

function buildContext(pppData: PPPData): string {
  const parts: string[] = [];

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
    parts.push('## PERFIS DE CLIENTE IDEAL (ICPs)');
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
