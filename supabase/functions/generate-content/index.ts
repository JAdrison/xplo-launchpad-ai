import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AIConfig {
  source: "lovable" | "xplo" | "custom";
  provider: "gemini" | "openai";
  model: string;
  apiKey?: string;
}

// Tipos de tarefas estratégicas (cérebro) - usam GPT-5.2
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

// Seleção automática de modelo baseada no tipo de tarefa
function selectModelForTask(type: string, aiConfig: AIConfig): AIConfig {
  // Se usuário escolheu API própria, respeita a escolha
  if (aiConfig.source === "custom") {
    return aiConfig;
  }
  
  // Se usuário escolheu Lovable padrão (modelo único), respeita
  if (aiConfig.source === "lovable") {
    return aiConfig;
  }
  
  // Arquitetura XPLO: seleção automática baseada no tipo de tarefa
  if (aiConfig.source === "xplo") {
    if (STRATEGIC_TASKS.includes(type)) {
      console.log(`[AI] XPLO Architecture: Using strategic model (GPT-5.2) for ${type}`);
      return {
        source: "lovable",
        provider: "openai",
        model: "openai/gpt-5.2"
      };
    } else {
      console.log(`[AI] XPLO Architecture: Using operational model (Gemini Flash) for ${type}`);
      return {
        source: "lovable",
        provider: "gemini",
        model: "google/gemini-3-flash-preview"
      };
    }
  }
  
  return aiConfig;
}

interface PPPData {
  profile: {
    product_name?: string | null;
    product_description?: string | null;
    differentiators?: string[] | null;
    benefits?: string[] | null;
    main_pain?: string | null;
    secondary_pain?: string | null;
    daily_impacts?: string[] | null;
    desire_1?: string | null;
    desire_2?: string | null;
    region?: string[] | null;
  } | null;
  icps: Array<{ id: string; name: string; profession?: string | null; age?: string | null; gender?: string | null; reason_needs_solution?: string | null; segment?: string | null; current_situation?: string | null; }>;
  pains: Array<{ icp_id: string; main_pain: string | null; secondary_pain?: string | null; daily_impacts: string[] | null; desire_1?: string | null; desire_2?: string | null; icps: { name: string } | null; }>;
  promise: { promise_text: string | null; } | null;
  niche?: string | null;
}

interface ReqBody {
  type: string; 
  clientId: string; 
  pppData?: PPPData; 
  icpId?: string; 
  offerId?: string; 
  field?: string; 
  lpVariant?: string;
  adId?: string; 
  adType?: string; 
  currentContent?: Record<string, unknown>; 
  instruction?: string;
  aiConfig?: AIConfig;
}

function buildCtx(p: PPPData): string {
  let s = '';
  if (p.niche) s += `Nicho: ${p.niche}\n`;
  if (p.profile?.product_name) s += `Produto: ${p.profile.product_name}\n`;
  if (p.profile?.product_description) s += `Descrição: ${p.profile.product_description}\n`;
  if (p.profile?.differentiators?.length) s += `Diferenciais: ${p.profile.differentiators.join(', ')}\n`;
  if (p.icps?.length) s += `ICPs: ${p.icps.map(i => i.name).join(', ')}\n`;
  if (p.promise?.promise_text) s += `Promessa: ${p.promise.promise_text}\n`;
  return s;
}

function extractJson(text: string): unknown {
  // Try code block first
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return JSON.parse(codeBlock[1]);
  // Try to find JSON object or array in text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return JSON.parse(jsonMatch[1]);
  // Last resort: try parsing as-is
  return JSON.parse(text);
}

function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    return JSON.stringify(value);
  }
  return '';
}

function extractVisualNotes(res: Record<string, unknown>): string {
  const notes: string[] = [];
  const fields = ['hook', 'problem', 'why_bad', 'solution', 'cta'];
  
  for (const f of fields) {
    if (typeof res[f] === 'object' && res[f] !== null) {
      const vn = (res[f] as Record<string, unknown>).visual_notes;
      if (vn) notes.push(`${f.toUpperCase()}: ${extractText(vn)}`);
    }
  }
  
  if (res.visual_notes) {
    notes.push(extractText(res.visual_notes));
  }
  
  return notes.join('\n\n') || '';
}

async function ai(config: AIConfig, sys: string, usr: string, t = 0.7) {
  const fullSys = `${sys}\n\nIMPORTANTE: Responda APENAS com JSON válido. Sem explicações, sem texto antes ou depois. Apenas o JSON puro.`;
  
  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;
  let isGeminiDirect = false;

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
      console.log(`[AI] Using custom OpenAI API with model: ${config.model}`);
    } else {
      // Google Gemini API direta
      isGeminiDirect = true;
      url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      headers = { "Content-Type": "application/json" };
      body = {
        contents: [{ parts: [{ text: `${fullSys}\n\n${usr}` }] }],
        generationConfig: { 
          temperature: t,
          responseMimeType: "application/json"
        }
      };
      console.log(`[AI] Using custom Gemini API with model: ${config.model}`);
    }
  } else {
    // Lovable AI Gateway (padrão)
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("No LOVABLE_API_KEY configured");
    
    url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers = { 
      "Authorization": `Bearer ${KEY}`, 
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
    console.log(`[AI] Using Lovable AI Gateway with model: ${config.model || "google/gemini-2.5-flash"}`);
  }

  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const st = r.status;
    const errorText = await r.text();
    console.error(`[AI] Error ${st}:`, errorText.substring(0, 500));
    throw { 
      status: st, 
      message: st === 429 ? "Rate limit exceeded" : st === 402 ? "Payment required" : st === 401 ? "Invalid API key" : `Error ${st}` 
    };
  }

  const d = await r.json();
  
  // Extrair conteúdo baseado no provedor
  let content: string;
  if (isGeminiDirect) {
    content = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    content = d.choices?.[0]?.message?.content || "";
  }
  
  if (!content) throw new Error("No AI content returned");
  
  console.log('[AI] Response length:', content.length);
  
  try {
    return extractJson(content);
  } catch (e) {
    console.error('[AI] Failed to parse JSON, raw content:', content.substring(0, 500));
    throw new Error('Invalid JSON from AI');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const b = await req.json() as ReqBody;
    const { type, clientId, pppData, icpId, offerId, field, lpVariant, aiConfig } = b;
    console.log(`[generate-content] ${type} for ${clientId}`);
    
    // Usar config recebida ou padrão XPLO (arquitetura dual)
    const baseConfig: AIConfig = aiConfig || {
      source: "xplo",
      provider: "gemini", 
      model: "google/gemini-2.5-flash"
    };
    
    // Aplicar seleção automática de modelo baseada no tipo de tarefa
    const config = selectModelForTask(type, baseConfig);
    
    const ctx = pppData ? buildCtx(pppData) : '';
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (type === "refine-ad") {
      const { adType, currentContent: c, instruction } = b;
      if (!c || !instruction) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const p = adType === "video" ? `Refine vídeo:\nHOOK: ${c.hook}\nPROBLEMA: ${c.problem}\nPOR QUE: ${c.why_bad}\nSOLUÇÃO: ${c.solution}\nCTA: ${c.cta}\n\nInstrução: ${instruction}\nJSON: {"hook":"","problem":"","why_bad":"","solution":"","cta":"","duration":"","visual_notes":""}`
        : `Refine estático:\nHEADLINE: ${c.headline}\nSUBHEADLINE: ${c.subheadline}\nCOPY: ${c.body_text}\nCTA: ${c.cta}\n\nInstrução: ${instruction}\nJSON: {"headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}`;
      const res = await ai(config, 'Copywriter.', p);
      return new Response(JSON.stringify({ success: true, refinedContent: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === "refresh-field" && field && offerId) {
      const { data: o } = await supabase.from('offers_hormozi').select('*').eq('id', offerId).single();
      if (!o) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const res = await ai(config, 'Hormozi copywriter.', `${ctx}\nGere 2 opções para ${field}.\nJSON: {"options":["op1","op2"]}`, 0.8);
      const opts = res.options;
      const go = (o.generated_options as Record<string, string[]>) || {};
      go[field] = opts;
      const so = (o.selected_options as Record<string, number[]>) || {};
      so[field] = [0];
      await supabase.from('offers_hormozi').update({ generated_options: go, selected_options: so, [field]: opts[0] }).eq('id', offerId);
      return new Response(JSON.stringify({ success: true, options: opts }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let sys = '', prompt = '';
    if (type === "offer") {
      sys = `Você é um estrategista de marketing sênior especialista no método Hormozi ($100M Offers) e em geração de demanda via Facebook/Meta Ads. Sua função é criar ofertas irresistíveis E um plano completo e detalhado de geração de demanda. Cada campo deve ter conteúdo rico e detalhado (mínimo 2-3 frases por campo). O plano de demanda deve ser prático, específico para o nicho do cliente e pronto para implementação.`;
      prompt = `${ctx}

Crie uma oferta Hormozi completa com 2 opções por campo E um plano de geração de demanda DETALHADO e EXTENSO.

IMPORTANTE: Cada campo do plano de demanda deve ter conteúdo rico e detalhado. Não use respostas curtas de 1 linha. Escreva parágrafos completos com estratégias específicas para o nicho.

JSON com a seguinte estrutura EXATA:
{
  "options": {
    "promise": ["opção 1 detalhada", "opção 2 detalhada"],
    "unique_mechanism": ["opção 1 detalhada", "opção 2 detalhada"],
    "guarantee": ["opção 1 detalhada", "opção 2 detalhada"],
    "proof": ["opção 1 detalhada", "opção 2 detalhada"],
    "risk_reversal": ["opção 1 detalhada", "opção 2 detalhada"],
    "main_cta": ["opção 1 detalhada", "opção 2 detalhada"]
  },
  "value_stack": [
    {"name": "Item de valor 1", "perceived_value": "R$ X.XXX"},
    {"name": "Item de valor 2", "perceived_value": "R$ X.XXX"},
    {"name": "Item de valor 3", "perceived_value": "R$ X.XXX"}
  ],
  "demand_plan": {
    "context_analysis": {
      "niche": "Análise detalhada do nicho, tendências de mercado, oportunidades e ameaças (mínimo 3 frases)",
      "icp_profile": "Perfil comportamental completo do ICP: como consome conteúdo, onde busca soluções, gatilhos de compra, objeções principais (mínimo 3 frases)",
      "key_insight": "Insight estratégico principal que diferencia esta campanha - a grande sacada que vai fazer o público parar e prestar atenção (mínimo 2 frases)",
      "market_challenges": "Principais desafios e objeções do mercado que a campanha precisa superar (mínimo 2 frases)"
    },
    "primary_strategy": {
      "channel": "Facebook/Meta Ads",
      "campaign_type": "Tipo de campanha detalhado (ex: Conversão com otimização para leads qualificados via formulário nativo)",
      "audiences": [
        {"name": "Nome do público 1", "geo": "Região geográfica", "source": "Interesse/Lookalike/Custom", "exclusions": "Exclusões aplicadas"},
        {"name": "Nome do público 2", "geo": "Região geográfica", "source": "Interesse/Lookalike/Custom", "exclusions": "Exclusões aplicadas"},
        {"name": "Nome do público 3", "geo": "Região geográfica", "source": "Interesse/Lookalike/Custom", "exclusions": "Exclusões aplicadas"}
      ],
      "creative_types": ["Vídeo UGC", "Carrossel de dor", "Imagem estática com headline forte", "Vídeo depoimento"],
      "budget_percentage": 60,
      "expected_cpl": "R$ XX,XX - estimativa baseada no nicho",
      "kpis": ["CPA alvo", "ROAS esperado", "Taxa de conversão LP", "CTR mínimo"]
    },
    "complementary_strategies": [
      {
        "channel": "Instagram Orgânico",
        "role": "Descrição detalhada do papel deste canal na estratégia geral - como ele complementa os ads pagos (mínimo 2 frases)",
        "integration": "Como este canal se integra com o Facebook Ads - fluxo específico de retargeting e nutrição (mínimo 2 frases)",
        "budget_percentage": 15,
        "tactics": "Táticas específicas: tipos de conteúdo, frequência de postagem, formatos prioritários"
      },
      {
        "channel": "Google Ads (Search)",
        "role": "Papel de captura de demanda ativa - como capturar quem já está buscando a solução (mínimo 2 frases)",
        "integration": "Integração com Meta Ads para capturar leads que pesquisam após ver os anúncios (mínimo 2 frases)",
        "budget_percentage": 20,
        "tactics": "Palavras-chave principais, tipos de campanha, estratégia de lances"
      },
      {
        "channel": "Email Marketing / WhatsApp",
        "role": "Nutrição e conversão de leads capturados - como transformar leads frios em clientes (mínimo 2 frases)",
        "integration": "Sequência de follow-up automatizada pós-captura via ads (mínimo 2 frases)",
        "budget_percentage": 5,
        "tactics": "Sequência de emails, scripts de WhatsApp, automações"
      }
    ],
    "acquisition_funnel": {
      "tofu": {
        "objective": "Objetivo detalhado do topo de funil - gerar consciência e atrair público frio (mínimo 2 frases)",
        "channels": "Canais específicos utilizados nesta etapa",
        "message": "Tipo de mensagem e abordagem - foco em dor ou curiosidade (mínimo 2 frases)",
        "metrics": "Métricas de sucesso: CPM, alcance, frequência, CTR",
        "content_types": "Tipos de conteúdo: vídeos curtos, carrosséis educativos, posts de dor"
      },
      "mofu": {
        "objective": "Objetivo do meio de funil - nutrir e qualificar leads (mínimo 2 frases)",
        "channels": "Canais específicos utilizados nesta etapa",
        "message": "Mensagem focada em autoridade e prova social (mínimo 2 frases)",
        "metrics": "Métricas: taxa de engajamento, leads capturados, custo por lead",
        "content_types": "Tipos de conteúdo: cases, depoimentos, webinars, materiais ricos"
      },
      "bofu": {
        "objective": "Objetivo do fundo de funil - converter leads em clientes (mínimo 2 frases)",
        "channels": "Canais específicos utilizados nesta etapa",
        "message": "Mensagem com urgência, escassez e oferta direta (mínimo 2 frases)",
        "metrics": "Métricas: taxa de conversão, CPA, ROAS, ticket médio",
        "content_types": "Tipos de conteúdo: ofertas diretas, remarketing agressivo, comparativos"
      }
    },
    "channel_synergies": [
      "Sinergia 1: Descrição detalhada de como dois canais trabalham juntos para potencializar resultados (mínimo 2 frases)",
      "Sinergia 2: Descrição detalhada (mínimo 2 frases)",
      "Sinergia 3: Descrição detalhada (mínimo 2 frases)",
      "Sinergia 4: Descrição detalhada (mínimo 2 frases)"
    ],
    "implementation_timeline": {
      "week_1_2": "Semanas 1-2: Setup completo - criação de contas, pixels, públicos, criativos iniciais, configuração de automações. Detalhamento das ações dia a dia.",
      "week_3_4": "Semanas 3-4: Lançamento e otimização - início das campanhas, testes A/B de criativos e públicos, ajuste de lances e orçamentos. Análise dos primeiros dados.",
      "week_5_8": "Semanas 5-8: Escala e refinamento - escalar campanhas vencedoras, cortar perdedoras, expandir para novos públicos, implementar canais complementares. Meta de ROAS."
    }
  }
}`;
    } else if (type === "lp") {
      sys = `Copywriter LP ${lpVariant || 'direta'}.`;
      prompt = `${ctx}\nCrie LP.\nJSON: {"hero":{"headline":"","subheadline":"","cta_button":""},"problem_agitation":{"problems":[]},"solution":{},"benefits":[],"how_it_works":{"steps":[]},"social_proof":{"testimonials":[],"stats":[]},"guarantee":{},"value_stack":{"items":[]},"faq":[],"final_cta":{}}`;
    } else if (type === "generate-icps") {
      sys = 'Estrategista de perfis de clientes.';
      prompt = `Nicho: ${pppData?.niche}
Produto: ${pppData?.profile?.product_name}
Descrição: ${pppData?.profile?.product_description}
Dor principal: ${pppData?.profile?.main_pain}
Desejo: ${pppData?.profile?.desire_1}
Promessa: ${pppData?.promise?.promise_text || ''}

Gere 3 perfis de clientes que compram esse produto.

JSON: {"profiles":[{
  "name": "Nome do perfil (ex: Dono de empresa solar residencial)",
  "who_is": "Quem é, o que faz, como trabalha, como decide compras",
  "when_seeks": "Em que momento procura esse tipo de solução",
  "why_buys": "Motivo real pelo qual compra (preço, rapidez, confiança, etc)",
  "is_ideal": "ideal"
}]}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, profiles: res.profiles }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-pains") {
      sys = 'Mapeador dores.';
      prompt = `${ctx}\nPara cada ICP, identifique dores.\nJSON: {"pains":[{"icp_name":"","main_pain":"","secondary_pain":"","daily_impacts":[],"desire_1":"","desire_2":""}]}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, pains: res.pains }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-buyer-pains") {
      sys = 'Mapeador dores comprador.';
      prompt = `${ctx}\nIdentifique dores do comprador.\nJSON: {"pains":{"main_pain":"","secondary_pain":"","daily_impacts":[],"desire_1":"","desire_2":""}}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, pains: res.pains }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-promise") {
      sys = 'Copywriter Hormozi. Fórmula: [QUEM] consegue [DESEJO] em [PRAZO] sem [DOR].';
      prompt = `${ctx}\nCrie promessa.\nJSON: {"promise":""}`;
      const res = await ai(config, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, promise: res.promise }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "create-video-ad") {
      const { instruction } = b;
      if (!instruction || !clientId) {
        return new Response(JSON.stringify({ error: 'Missing instruction or clientId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Fetch client context
      const { data: profile } = await supabase.from('client_profile').select('*').eq('client_id', clientId).maybeSingle();
      const { data: promise } = await supabase.from('client_promise').select('*').eq('client_id', clientId).maybeSingle();
      const { data: client } = await supabase.from('clients').select('niche').eq('id', clientId).maybeSingle();
      
      // Build context
      let adCtx = '';
      if (client?.niche) adCtx += `Nicho: ${client.niche}\n`;
      if (profile?.product_name) adCtx += `Produto: ${profile.product_name}\n`;
      if (profile?.product_description) adCtx += `Descrição: ${profile.product_description}\n`;
      if (profile?.main_pain) adCtx += `Dor principal: ${profile.main_pain}\n`;
      if (profile?.desire_1) adCtx += `Desejo: ${profile.desire_1}\n`;
      if (promise?.promise_text) adCtx += `Promessa: ${promise.promise_text}\n`;
      
      const videoSys = 'Copywriter especialista em anúncios de vídeo para redes sociais. Estrutura: HOOK (captura atenção nos primeiros 3s), PROBLEMA (identifica a dor), POR QUE É RUIM (agita o problema), SOLUÇÃO (apresenta o produto), CTA (chamada para ação). Duração 20-60s.';
      const videoPrompt = `${adCtx}\n\nInstrução do usuário: ${instruction}\n\nIMPORTANTE: Retorne APENAS strings simples em cada campo, NÃO objetos.\nRetorne visual_notes como um único campo com todas as notas visuais combinadas.\n\nJSON (valores devem ser strings, não objetos):\n{\n  "video_type": "tipo do vídeo",\n  "duration": "duração em segundos",\n  "hook": "texto do hook",\n  "problem": "texto do problema",\n  "why_bad": "texto de por que é ruim",\n  "solution": "texto da solução",\n  "cta": "texto do CTA",\n  "visual_notes": "todas as notas visuais combinadas"\n}`;
      
      const videoRes = await ai(config, videoSys, videoPrompt, 0.8) as Record<string, unknown>;
      
      // Insert into database with text extraction for robustness
      const { data: newAd, error: insertError } = await supabase.from('ads').insert({
        client_id: clientId,
        asset_type: 'video_ad',
        video_type: extractText(videoRes.video_type) || 'Personalizado',
        video_hook: extractText(videoRes.hook),
        video_problem: extractText(videoRes.problem),
        video_why_bad: extractText(videoRes.why_bad),
        video_solution: extractText(videoRes.solution),
        video_cta: extractText(videoRes.cta),
        video_duration: extractText(videoRes.duration),
        video_visual_notes: extractVisualNotes(videoRes),
        headline: extractText(videoRes.video_type) || 'Anúncio Personalizado'
      }).select().single();
      
      if (insertError) throw insertError;
      
      return new Response(JSON.stringify({ success: true, ad: newAd }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "ads") {
      let oCtx = '', vOid: string | null = null;
      if (offerId) {
        const { data: o } = await supabase.from('offers_hormozi').select('*').eq('id', offerId).maybeSingle();
        if (o) { vOid = offerId; oCtx = `Oferta: ${o.promise || ''}`; }
      }
      const bp = pppData?.profile ? `Dor: ${pppData.profile.main_pain || ''}\nDesejos: ${pppData.profile.desire_1 || ''}\nRegião: ${pppData.profile.region?.join(', ') || ''}` : '';
      sys = `Ads expert brasileiro. Crie 6 anúncios de vídeo:
- 5 vídeos criativos com estilos variados (20-80s cada)
- 1 vídeo OBRIGATÓRIO tipo "question_box" (Caixinha de Perguntas): O HOOK deve ser uma pergunta real do cotidiano que muitas pessoas se fazem, uma dúvida genuína que abre margem para responder e naturalmente promover o produto.

Cada vídeo: 5 seções (HOOK, PROBLEMA, POR QUE É RUIM, SOLUÇÃO, CTA).
+ 10 anúncios estáticos (5 baseados em dor, 5 baseados em desejo).`;
      prompt = `${ctx}\n${oCtx}\n${bp}

IMPORTANTE para o 6º vídeo (question_box):
- O HOOK deve ser uma PERGUNTA genuína do cotidiano (ex: "Por que eu nunca consigo...", "Será que é normal...", "Como fazer para...")
- A pergunta deve ser algo que o público-alvo realmente se pergunta
- A resposta deve abrir margem natural para apresentar o produto como solução
- video_type DEVE ser "question_box" para este vídeo

JSON: {"video_scripts":[
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""},
  {"video_type":"question_box","title":"Caixinha de Perguntas","duration":"","hook":"[PERGUNTA DO COTIDIANO]","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""}
],"static_ads":{"pain_based":[{"angle":"pain","focus":"","headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}],"desire_based":[{"angle":"desire","focus":"","headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}]}}`;
      const res = await ai(config, sys, prompt);
      if (vOid) await supabase.from('ads').delete().eq('offer_id', vOid);
      else await supabase.from('ads').delete().eq('client_id', clientId).is('offer_id', null);
      for (const v of res.video_scripts || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'video_ad', video_type: v.video_type, video_hook: v.hook, video_problem: v.problem, video_why_bad: v.why_bad, video_solution: v.solution, video_cta: v.cta, video_duration: v.duration, video_visual_notes: v.visual_notes, ad_angle: v.video_type, headline: v.title });
      for (const a of res.static_ads?.pain_based || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'static_ad', angle: a.angle, focus: a.focus, headline: a.headline, subheadline: a.subheadline, body_text: a.body_text, eliminators: a.eliminators, cta: a.cta, visual_suggestion: a.visual_suggestion, ad_angle: `${a.angle}_${a.focus}` });
      for (const a of res.static_ads?.desire_based || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'static_ad', angle: a.angle, focus: a.focus, headline: a.headline, subheadline: a.subheadline, body_text: a.body_text, eliminators: a.eliminators, cta: a.cta, visual_suggestion: a.visual_suggestion, ad_angle: `${a.angle}_${a.focus}` });
      return new Response(JSON.stringify({ success: true, data: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await ai(config, sys, prompt);
    if (type === "offer") {
      const opts = res.options || {};
      const { data: ins, error } = await supabase.from('offers_hormozi').insert({
        client_id: clientId, icp_id: icpId || null, promise: opts.promise?.[0], unique_mechanism: opts.unique_mechanism?.[0],
        guarantee: opts.guarantee?.[0], proof: opts.proof?.[0], risk_reversal: opts.risk_reversal?.[0], main_cta: opts.main_cta?.[0],
        value_stack: res.value_stack, demand_generation_strategies: res.demand_plan, generated_options: opts,
        selected_options: { promise: [0], unique_mechanism: [0], guarantee: [0], proof: [0], risk_reversal: [0], main_cta: [0] },
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: res, offer: ins }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "lp") {
      await supabase.from('landing_pages').insert({ client_id: clientId, variant: lpVariant || "direct", sections: res });
    }
    return new Response(JSON.stringify({ success: true, data: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[generate-content] Error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Error' }), { status: e.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
