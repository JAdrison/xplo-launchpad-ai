import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Layout,
  Video,
  CheckCircle,
  Copy,
  Sparkles,
  Target,
  Shield,
  Gift,
  MessageSquare,
  Megaphone,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, Json } from "@/integrations/supabase/types";

type Offer = Tables<"offers_hormozi">;
type LandingPage = Tables<"landing_pages">;
type Ad = Tables<"ads">;

interface GeneratedContentViewerProps {
  clientId: string;
  refreshTrigger?: number;
}

interface ValueStackItem {
  name: string;
  perceived_value: string;
}

interface LPSections {
  headline?: string;
  subheadline?: string;
  hero_text?: string;
  benefits?: string[];
  social_proof?: string;
  cta_text?: string;
  cta_subtext?: string;
}

interface VideoScript {
  hook?: string;
  body?: string;
  cta?: string;
  duration?: string;
}

interface DemandStrategy {
  approach?: string;
  content_type?: string;
  angles?: string[] | string;
  metrics?: string[] | string;
}

const CHANNEL_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  referral: "Indicação",
  influencers: "Influenciadores",
  outbound: "Outbound",
  content_marketing: "Conteúdo",
  email_marketing: "Email",
};

export function GeneratedContentViewer({ clientId, refreshTrigger }: GeneratedContentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetchGeneratedContent();
  }, [clientId, refreshTrigger]);

  const fetchGeneratedContent = async () => {
    setIsLoading(true);

    const [offersRes, lpsRes, adsRes] = await Promise.all([
      supabase.from("offers_hormozi").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("landing_pages").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("ads").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    ]);

    setOffers(offersRes.data || []);
    setLandingPages(lpsRes.data || []);
    setAds(adsRes.data || []);
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const hasContent = offers.length > 0 || landingPages.length > 0 || ads.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return null;
  }

  const staticAds = ads.filter(ad => ad.asset_type === "static_ad");
  const videoAds = ads.filter(ad => ad.asset_type === "video_ad");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Conteúdos Gerados
        </CardTitle>
        <CardDescription>
          Visualize e copie os conteúdos gerados pela IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Ofertas Hormozi */}
          {offers.length > 0 && (
            <AccordionItem value="offers">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Ofertas Hormozi ({offers.length})</span>
                  <Badge variant="default" className="ml-2 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Geradas
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {offers.map((offer, offerIdx) => (
                  <div key={offer.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Oferta {offerIdx + 1}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(offer.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {/* Promessa */}
                    {offer.promise && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Promessa Principal
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(offer.promise!, "Promessa")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm bg-muted p-3 rounded-lg">{offer.promise}</p>
                      </div>
                    )}

                    {/* Mecanismo Único */}
                    {offer.unique_mechanism && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Mecanismo Único
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(offer.unique_mechanism!, "Mecanismo único")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm bg-muted p-3 rounded-lg">{offer.unique_mechanism}</p>
                      </div>
                    )}

                    {/* Garantia */}
                    {offer.guarantee && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Garantia
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(offer.guarantee!, "Garantia")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm bg-muted p-3 rounded-lg">{offer.guarantee}</p>
                      </div>
                    )}

                    {/* Pilha de Valor */}
                    {offer.value_stack && Array.isArray(offer.value_stack) && (offer.value_stack as unknown as ValueStackItem[]).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Gift className="h-4 w-4 text-primary" />
                          Pilha de Valor
                        </h4>
                        <div className="space-y-2">
                          {(offer.value_stack as unknown as ValueStackItem[]).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded-lg text-sm">
                              <span>{item.name}</span>
                              <Badge variant="secondary">{item.perceived_value}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    {offer.main_cta && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            CTA Principal
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(offer.main_cta!, "CTA")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm bg-primary/10 p-3 rounded-lg font-medium">{offer.main_cta}</p>
                      </div>
                    )}

                    {/* Estratégias de Demanda */}
                    {(offer as any).demand_generation_strategies && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-primary" />
                          Estratégias de Geração de Demanda
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.entries((offer as any).demand_generation_strategies as Record<string, DemandStrategy>).map(([channelId, strategy]) => (
                            <div key={channelId} className="border rounded-lg p-3 space-y-2">
                              <Badge variant="outline">{CHANNEL_LABELS[channelId] || channelId}</Badge>
                              {strategy.approach && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Abordagem</p>
                                  <p className="text-sm">{strategy.approach}</p>
                                </div>
                              )}
                              {strategy.content_type && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Tipo de Conteúdo</p>
                                  <p className="text-sm">{strategy.content_type}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Canais Selecionados */}
                    {(offer as any).demand_generation_channels && (offer as any).demand_generation_channels.length > 0 && !(offer as any).demand_generation_strategies && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-primary" />
                          Canais de Demanda
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {((offer as any).demand_generation_channels as string[]).map((channelId) => (
                            <Badge key={channelId} variant="secondary">
                              {CHANNEL_LABELS[channelId] || channelId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Landing Pages */}
          {landingPages.length > 0 && (
            <AccordionItem value="lps">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  <span>Landing Pages ({landingPages.length} variantes)</span>
                  <Badge variant="default" className="ml-2 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Geradas
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {landingPages.map((lp) => {
                  const sections = lp.sections as LPSections;
                  const variantLabels: Record<string, string> = {
                    direct: "Direta",
                    consultive: "Consultiva",
                    aggressive: "Agressiva",
                  };
                  return (
                    <div key={lp.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{variantLabels[lp.variant] || lp.variant}</Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(JSON.stringify(sections, null, 2), `LP ${lp.variant}`)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar tudo
                        </Button>
                      </div>
                      {sections?.headline && (
                        <div>
                          <p className="text-xs text-muted-foreground">Headline</p>
                          <p className="font-semibold">{sections.headline}</p>
                        </div>
                      )}
                      {sections?.subheadline && (
                        <div>
                          <p className="text-xs text-muted-foreground">Subheadline</p>
                          <p className="text-sm">{sections.subheadline}</p>
                        </div>
                      )}
                      {sections?.benefits && sections.benefits.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Benefícios</p>
                          <ul className="text-sm list-disc list-inside">
                            {sections.benefits.map((b, i) => <li key={i}>{b}</li>)}
                          </ul>
                        </div>
                      )}
                      {sections?.cta_text && (
                        <div>
                          <p className="text-xs text-muted-foreground">CTA</p>
                          <p className="text-sm font-medium text-primary">{sections.cta_text}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Anúncios */}
          {ads.length > 0 && (
            <AccordionItem value="ads">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>Anúncios ({staticAds.length} estáticos, {videoAds.length} vídeos)</span>
                  <Badge variant="default" className="ml-2 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Gerados
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* Static Ads */}
                {staticAds.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Anúncios Estáticos</h4>
                    {staticAds.map((ad, idx) => (
                      <div key={ad.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Anúncio {idx + 1}</Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(`${ad.headline}\n\n${ad.body_text}\n\n${ad.cta}`, `Anúncio ${idx + 1}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {ad.headline && <p className="font-semibold">{ad.headline}</p>}
                        {ad.body_text && <p className="text-sm text-muted-foreground">{ad.body_text}</p>}
                        {ad.cta && <p className="text-sm font-medium text-primary">{ad.cta}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Video Ads */}
                {videoAds.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Scripts de Vídeo</h4>
                    {videoAds.map((ad) => {
                      const script = ad.script as VideoScript;
                      const angleLabels: Record<string, string> = {
                        direct: "Direto",
                        educational: "Educacional",
                        question_box: "Caixinha de Perguntas",
                      };
                      return (
                        <div key={ad.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{angleLabels[ad.ad_angle || ""] || ad.ad_angle}</Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(JSON.stringify(script, null, 2), `Script ${ad.ad_angle}`)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {script?.hook && (
                            <div>
                              <p className="text-xs text-muted-foreground">Hook</p>
                              <p className="text-sm">{script.hook}</p>
                            </div>
                          )}
                          {script?.body && (
                            <div>
                              <p className="text-xs text-muted-foreground">Desenvolvimento</p>
                              <p className="text-sm">{script.body}</p>
                            </div>
                          )}
                          {script?.cta && (
                            <div>
                              <p className="text-xs text-muted-foreground">CTA</p>
                              <p className="text-sm font-medium text-primary">{script.cta}</p>
                            </div>
                          )}
                          {script?.duration && (
                            <Badge variant="secondary" className="mt-2">{script.duration}</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
