import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhook_url, payload } = await req.json();

    if (!webhook_url || typeof webhook_url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'webhook_url é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    try {
      new URL(webhook_url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'URL de webhook inválida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'payload é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward to webhook
    const webhookResponse = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await webhookResponse.text();

    return new Response(
      JSON.stringify({
        success: webhookResponse.ok,
        status: webhookResponse.status,
        response: responseText.substring(0, 500),
      }),
      { status: webhookResponse.ok ? 200 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao enviar webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
