import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WebhookAd {
  headline: string | null;
  subheadline: string | null;
  body_text: string | null;
  cta: string | null;
  eliminators: string[] | null;
  angle: string | null;
  focus: string | null;
  visual_suggestion: string | null;
}

interface WebhookPayload {
  client_name: string;
  icp_name?: string;
  sent_at: string;
  ads: WebhookAd[];
}

export function useWebhook() {
  const [isSending, setIsSending] = useState(false);

  const sendStaticAdsWebhook = async (
    staticAds: WebhookAd[],
    clientName: string,
    icpName?: string
  ) => {
    const webhookUrl = localStorage.getItem("webhook_url");

    if (!webhookUrl) {
      toast.error("URL de webhook não configurada. Vá em Configurações para adicionar.");
      return false;
    }

    if (staticAds.length === 0) {
      toast.error("Nenhum anúncio estático para enviar.");
      return false;
    }

    setIsSending(true);

    try {
      const payload: WebhookPayload = {
        client_name: clientName,
        icp_name: icpName,
        sent_at: new Date().toISOString(),
        ads: staticAds.map((ad) => ({
          headline: ad.headline,
          subheadline: ad.subheadline,
          body_text: ad.body_text,
          cta: ad.cta,
          eliminators: ad.eliminators,
          angle: ad.angle,
          focus: ad.focus,
          visual_suggestion: ad.visual_suggestion,
        })),
      };

      const { data, error } = await supabase.functions.invoke("send-webhook", {
        body: { webhook_url: webhookUrl, payload },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${staticAds.length} anúncio(s) enviado(s) via webhook!`);
        return true;
      } else {
        toast.error(`Webhook retornou erro: ${data?.status || "desconhecido"}`);
        return false;
      }
    } catch (err: any) {
      toast.error(`Erro ao enviar webhook: ${err.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return { sendStaticAdsWebhook, isSending };
}
