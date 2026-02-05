import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  type: string; clientId: string; pppData?: PPPData; icpId?: string; offerId?: string; field?: string; lpVariant?: string;
  adId?: string; adType?: string; currentContent?: Record<string, unknown>; instruction?: string;
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

async function ai(key: string, sys: string, usr: string, t = 0.7) {
  const fullSys = `${sys}\n\nIMPORTANTE: Responda APENAS com JSON válido. Sem explicações, sem texto antes ou depois. Apenas o JSON puro.`;
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      model: 'google/gemini-2.5-flash', 
      messages: [{ role: 'system', content: fullSys }, { role: 'user', content: usr }], 
      temperature: t,
      response_format: { type: "json_object" }
    }),
  });
  if (!r.ok) { const st = r.status; throw { status: st, message: st === 429 ? 'Rate limit' : st === 402 ? 'Payment required' : `Error ${st}` }; }
  const d = await r.json();
  const c = d.choices?.[0]?.message?.content;
  if (!c) throw new Error('No AI content');
  console.log('AI response length:', c.length);
  try {
    return extractJson(c);
  } catch (e) {
    console.error('Failed to parse JSON, raw content:', c.substring(0, 500));
    throw new Error('Invalid JSON from AI');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const b = await req.json() as ReqBody;
    const { type, clientId, pppData, icpId, offerId, field, lpVariant } = b;
    console.log(`${type} for ${clientId}`);
    const KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!KEY) throw new Error('No API key');
    const ctx = pppData ? buildCtx(pppData) : '';
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (type === "refine-ad") {
      const { adType, currentContent: c, instruction } = b;
      if (!c || !instruction) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const p = adType === "video" ? `Refine vídeo:\nHOOK: ${c.hook}\nPROBLEMA: ${c.problem}\nPOR QUE: ${c.why_bad}\nSOLUÇÃO: ${c.solution}\nCTA: ${c.cta}\n\nInstrução: ${instruction}\nJSON: {"hook":"","problem":"","why_bad":"","solution":"","cta":"","duration":"","visual_notes":""}`
        : `Refine estático:\nHEADLINE: ${c.headline}\nSUBHEADLINE: ${c.subheadline}\nCOPY: ${c.body_text}\nCTA: ${c.cta}\n\nInstrução: ${instruction}\nJSON: {"headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}`;
      const res = await ai(KEY, 'Copywriter.', p);
      return new Response(JSON.stringify({ success: true, refinedContent: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === "refresh-field" && field && offerId) {
      const { data: o } = await supabase.from('offers_hormozi').select('*').eq('id', offerId).single();
      if (!o) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const res = await ai(KEY, 'Hormozi copywriter.', `${ctx}\nGere 2 opções para ${field}.\nJSON: {"options":["op1","op2"]}`, 0.8);
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
      sys = 'Estrategista Hormozi + Facebook Ads.';
      prompt = `${ctx}\nCrie oferta com 2 opções cada campo + plano demanda.\nJSON: {"options":{"promise":[],"unique_mechanism":[],"guarantee":[],"proof":[],"risk_reversal":[],"main_cta":[]},"value_stack":[{"name":"","perceived_value":""}],"demand_plan":{"primary_strategy":{"channel":"Facebook Ads","audiences":[]},"acquisition_funnel":{"tofu":{},"mofu":{},"bofu":{}}}}`;
    } else if (type === "lp") {
      sys = `Copywriter LP ${lpVariant || 'direta'}.`;
      prompt = `${ctx}\nCrie LP.\nJSON: {"hero":{"headline":"","subheadline":"","cta_button":""},"problem_agitation":{"problems":[]},"solution":{},"benefits":[],"how_it_works":{"steps":[]},"social_proof":{"testimonials":[],"stats":[]},"guarantee":{},"value_stack":{"items":[]},"faq":[],"final_cta":{}}`;
    } else if (type === "generate-icps") {
      sys = 'Estrategista ICP.';
      prompt = `Nicho: ${pppData?.niche}\nProduto: ${pppData?.profile?.product_name}\n\nGere 3 ICPs.\nJSON: {"icps":[{"name":"","profession":"","age":"","gender":"","reason_needs_solution":""}]}`;
      const res = await ai(KEY, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, icps: res.icps }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-pains") {
      sys = 'Mapeador dores.';
      prompt = `${ctx}\nPara cada ICP, identifique dores.\nJSON: {"pains":[{"icp_name":"","main_pain":"","secondary_pain":"","daily_impacts":[],"desire_1":"","desire_2":""}]}`;
      const res = await ai(KEY, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, pains: res.pains }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-buyer-pains") {
      sys = 'Mapeador dores comprador.';
      prompt = `${ctx}\nIdentifique dores do comprador.\nJSON: {"pains":{"main_pain":"","secondary_pain":"","daily_impacts":[],"desire_1":"","desire_2":""}}`;
      const res = await ai(KEY, sys, prompt, 0.8);
      return new Response(JSON.stringify({ success: true, pains: res.pains }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else if (type === "generate-promise") {
      sys = 'Copywriter Hormozi. Fórmula: [QUEM] consegue [DESEJO] em [PRAZO] sem [DOR].';
      prompt = `${ctx}\nCrie promessa.\nJSON: {"promise":""}`;
      const res = await ai(KEY, sys, prompt, 0.8);
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
      
      const videoRes = await ai(KEY, videoSys, videoPrompt, 0.8) as Record<string, unknown>;
      
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
      sys = 'Ads expert. Crie 5 vídeos (5 seções: HOOK,PROBLEMA,POR QUE É RUIM,SOLUÇÃO,CTA, 20-80s) + 10 estáticos (5 dor, 5 desejo).';
      prompt = `${ctx}\n${oCtx}\n${bp}\nJSON: {"video_scripts":[{"video_type":"","title":"","duration":"","hook":"","problem":"","why_bad":"","solution":"","cta":"","visual_notes":""}],"static_ads":{"pain_based":[{"angle":"pain","focus":"","headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}],"desire_based":[{"angle":"desire","focus":"","headline":"","subheadline":"","body_text":"","eliminators":[],"cta":"","visual_suggestion":""}]}}`;
      const res = await ai(KEY, sys, prompt);
      if (vOid) await supabase.from('ads').delete().eq('offer_id', vOid);
      else await supabase.from('ads').delete().eq('client_id', clientId).is('offer_id', null);
      for (const v of res.video_scripts || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'video_ad', video_type: v.video_type, video_hook: v.hook, video_problem: v.problem, video_why_bad: v.why_bad, video_solution: v.solution, video_cta: v.cta, video_duration: v.duration, video_visual_notes: v.visual_notes, ad_angle: v.video_type, headline: v.title });
      for (const a of res.static_ads?.pain_based || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'static_ad', angle: a.angle, focus: a.focus, headline: a.headline, subheadline: a.subheadline, body_text: a.body_text, eliminators: a.eliminators, cta: a.cta, visual_suggestion: a.visual_suggestion, ad_angle: `${a.angle}_${a.focus}` });
      for (const a of res.static_ads?.desire_based || []) await supabase.from('ads').insert({ client_id: clientId, offer_id: vOid, asset_type: 'static_ad', angle: a.angle, focus: a.focus, headline: a.headline, subheadline: a.subheadline, body_text: a.body_text, eliminators: a.eliminators, cta: a.cta, visual_suggestion: a.visual_suggestion, ad_angle: `${a.angle}_${a.focus}` });
      return new Response(JSON.stringify({ success: true, data: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await ai(KEY, sys, prompt);
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
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Error' }), { status: e.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
