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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  TrendingUp,
  Calendar,
  Zap,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, Json } from "@/integrations/supabase/types";
import { OfferOptionsSelector } from "./OfferOptionsSelector";
import { DemandPlanEditor } from "./DemandPlanEditor";
import { LandingPageViewer } from "./LandingPageViewer";
import { PDFExportButton } from "@/components/export/PDFExportButton";

type Offer = Tables<"offers_hormozi">;
type LandingPage = Tables<"landing_pages">;
type Ad = Tables<"ads">;

interface GeneratedContentViewerProps {
  clientId: string;
  clientName?: string;
  refreshTrigger?: number;
  pppData?: any;
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

interface DemandPlan {
  context_analysis?: {
    niche?: string;
    icp_profile?: string;
    key_insight?: string;
  };
  primary_strategy?: {
    channel?: string;
    campaign_type?: string;
    audiences?: string[];
    creative_types?: string[];
    budget_percentage?: number;
    expected_cpl?: string;
  };
  complementary_strategies?: Array<{
    channel?: string;
    role?: string;
    integration?: string;
    budget_percentage?: number;
  }>;
  acquisition_funnel?: {
    tofu?: { objective?: string; channels?: string[]; message?: string };
    mofu?: { objective?: string; channels?: string[]; message?: string };
    bofu?: { objective?: string; channels?: string[]; message?: string };
  };
  channel_synergies?: string[];
  implementation_timeline?: {
    week_1_2?: string;
    week_3_4?: string;
    week_5_8?: string;
  };
}

interface GeneratedOptions {
  promise?: string[];
  unique_mechanism?: string[];
  guarantee?: string[];
  proof?: string[];
  risk_reversal?: string[];
  main_cta?: string[];
}

interface SelectedOptions {
  promise?: number[];
  unique_mechanism?: number[];
  guarantee?: number[];
  proof?: number[];
  risk_reversal?: number[];
  main_cta?: number[];
}

export function GeneratedContentViewer({ clientId, clientName = "Cliente", refreshTrigger, pppData }: GeneratedContentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // State for tracking live edits per offer (for PDF sync)
  const [liveEdits, setLiveEdits] = useState<Record<string, { options: GeneratedOptions; selected: SelectedOptions }>>({});

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

  const handleOptionsUpdate = (offerId: string, options: GeneratedOptions, selected: SelectedOptions) => {
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === offerId
          ? { ...offer, generated_options: options as unknown as Json, selected_options: selected as unknown as Json }
          : offer
      )
    );
    // Also update live edits for PDF sync
    setLiveEdits((prev) => ({
      ...prev,
      [offerId]: { options, selected }
    }));
  };

  // Handler for live edit changes (before save) - for PDF sync
  const handleEditChange = (offerId: string, currentOptions: GeneratedOptions, currentSelected: SelectedOptions) => {
    setLiveEdits((prev) => ({
      ...prev,
      [offerId]: { options: currentOptions, selected: currentSelected }
    }));
  };

  // Handler for demand plan updates
  const handleDemandPlanUpdate = (offerId: string, plan: DemandPlan) => {
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === offerId
          ? { ...offer, demand_generation_strategies: plan as unknown as Json }
          : offer
      )
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const handleDeleteOffer = async (offerId: string) => {
    setDeletingId(offerId);
    const { error } = await supabase.from("offers_hormozi").delete().eq("id", offerId);
    setDeletingId(null);

    if (error) {
      toast.error("Erro ao excluir oferta");
      return;
    }

    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    toast.success("Oferta excluída com sucesso!");
  };

  const handleDeleteLandingPage = async (lpId: string) => {
    setDeletingId(lpId);
    const { error } = await supabase.from("landing_pages").delete().eq("id", lpId);
    setDeletingId(null);

    if (error) {
      toast.error("Erro ao excluir landing page");
      return;
    }

    setLandingPages((prev) => prev.filter((lp) => lp.id !== lpId));
    toast.success("Landing Page excluída com sucesso!");
  };

  const handleDeleteAd = async (adId: string) => {
    setDeletingId(adId);
    const { error } = await supabase.from("ads").delete().eq("id", adId);
    setDeletingId(null);

    if (error) {
      toast.error("Erro ao excluir anúncio");
      return;
    }

    setAds((prev) => prev.filter((a) => a.id !== adId));
    toast.success("Anúncio excluído com sucesso!");
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
                {offers.map((offer, offerIdx) => {
                  const demandPlan = (offer as any).demand_generation_strategies as DemandPlan | null;
                  const generatedOptions = (offer.generated_options as GeneratedOptions) || {};
                  const selectedOptions = (offer.selected_options as SelectedOptions) || {};
                  const hasOptions = Object.keys(generatedOptions).length > 0;
                  
                  // Get live edits for this offer (for PDF sync)
                  const offerLiveEdits = liveEdits[offer.id];
                  const pdfOptions = offerLiveEdits?.options || generatedOptions;
                  const pdfSelected = offerLiveEdits?.selected || selectedOptions;
                  
                  return (
                    <div key={offer.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Oferta {offerIdx + 1}</Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(offer.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          <PDFExportButton
                            type="offer"
                            clientName={clientName}
                            content={offer}
                            liveOptions={pdfOptions}
                            liveSelected={pdfSelected}
                            refreshKey={Date.now()}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta oferta? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteOffer(offer.id)}
                                  disabled={deletingId === offer.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingId === offer.id ? "Excluindo..." : "Excluir"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Options Selector - New UI */}
                      {hasOptions ? (
                        <OfferOptionsSelector
                          offerId={offer.id}
                          clientId={clientId}
                          generatedOptions={generatedOptions}
                          selectedOptions={selectedOptions}
                          onOptionsUpdate={(opts, sel) => handleOptionsUpdate(offer.id, opts, sel)}
                          onEditChange={(opts, sel) => handleEditChange(offer.id, opts, sel)}
                          pppData={pppData}
                        />
                      ) : (
                        <>
                          {/* Legacy display for old offers without options */}
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
                        </>
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

                      {/* PLANO DE GERAÇÃO DE DEMANDA */}
                      {demandPlan && (
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="text-base font-semibold flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-primary" />
                            Plano de Geração de Demanda
                          </h4>

                          {/* Análise do Contexto */}
                          {demandPlan.context_analysis && (
                            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                              <h5 className="text-sm font-medium flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Análise do Contexto
                              </h5>
                              {demandPlan.context_analysis.niche && (
                                <p className="text-sm"><strong>Nicho:</strong> {demandPlan.context_analysis.niche}</p>
                              )}
                              {demandPlan.context_analysis.icp_profile && (
                                <p className="text-sm"><strong>Perfil ICP:</strong> {demandPlan.context_analysis.icp_profile}</p>
                              )}
                              {demandPlan.context_analysis.key_insight && (
                                <p className="text-sm"><strong>Insight:</strong> {demandPlan.context_analysis.key_insight}</p>
                              )}
                            </div>
                          )}

                          {/* Estratégia Principal */}
                          {demandPlan.primary_strategy && (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                              <h5 className="text-sm font-medium flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                Estratégia Principal: {demandPlan.primary_strategy.channel}
                                {demandPlan.primary_strategy.budget_percentage && (
                                  <Badge variant="default">{demandPlan.primary_strategy.budget_percentage}% do budget</Badge>
                                )}
                              </h5>
                              {demandPlan.primary_strategy.campaign_type && (
                                <p className="text-sm"><strong>Campanha:</strong> {demandPlan.primary_strategy.campaign_type}</p>
                              )}
                              {demandPlan.primary_strategy.audiences && demandPlan.primary_strategy.audiences.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium">Públicos:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {demandPlan.primary_strategy.audiences.map((aud, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{aud}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {demandPlan.primary_strategy.creative_types && demandPlan.primary_strategy.creative_types.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium">Criativos:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {demandPlan.primary_strategy.creative_types.map((ct, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">{ct}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {demandPlan.primary_strategy.expected_cpl && (
                                <p className="text-sm"><strong>CPL esperado:</strong> {demandPlan.primary_strategy.expected_cpl}</p>
                              )}
                            </div>
                          )}

                          {/* Estratégias Complementares */}
                          {demandPlan.complementary_strategies && demandPlan.complementary_strategies.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">Estratégias Complementares</h5>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {demandPlan.complementary_strategies.map((strategy, idx) => (
                                  <div key={idx} className="border rounded-lg p-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">{strategy.channel}</span>
                                      {strategy.budget_percentage && (
                                        <Badge variant="secondary">{strategy.budget_percentage}%</Badge>
                                      )}
                                    </div>
                                    {strategy.role && <p className="text-xs text-muted-foreground">{strategy.role}</p>}
                                    {strategy.integration && (
                                      <p className="text-xs flex items-center gap-1">
                                        <ArrowRight className="h-3 w-3" />
                                        {strategy.integration}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Funil de Aquisição */}
                          {demandPlan.acquisition_funnel && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Funil de Aquisição
                              </h5>
                              <div className="space-y-2">
                                {demandPlan.acquisition_funnel.tofu && (
                                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Badge variant="outline" className="shrink-0">TOPO</Badge>
                                    <div className="space-y-1 flex-1">
                                      <p className="text-sm font-medium">{demandPlan.acquisition_funnel.tofu.objective}</p>
                                      {demandPlan.acquisition_funnel.tofu.message && (
                                        <p className="text-xs text-muted-foreground italic">"{demandPlan.acquisition_funnel.tofu.message}"</p>
                                      )}
                                      {demandPlan.acquisition_funnel.tofu.channels && (
                                        <div className="flex flex-wrap gap-1">
                                          {demandPlan.acquisition_funnel.tofu.channels.map((ch, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">{ch}</Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {demandPlan.acquisition_funnel.mofu && (
                                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Badge variant="outline" className="shrink-0">MEIO</Badge>
                                    <div className="space-y-1 flex-1">
                                      <p className="text-sm font-medium">{demandPlan.acquisition_funnel.mofu.objective}</p>
                                      {demandPlan.acquisition_funnel.mofu.message && (
                                        <p className="text-xs text-muted-foreground italic">"{demandPlan.acquisition_funnel.mofu.message}"</p>
                                      )}
                                      {demandPlan.acquisition_funnel.mofu.channels && (
                                        <div className="flex flex-wrap gap-1">
                                          {demandPlan.acquisition_funnel.mofu.channels.map((ch, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">{ch}</Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {demandPlan.acquisition_funnel.bofu && (
                                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Badge variant="outline" className="shrink-0">FUNDO</Badge>
                                    <div className="space-y-1 flex-1">
                                      <p className="text-sm font-medium">{demandPlan.acquisition_funnel.bofu.objective}</p>
                                      {demandPlan.acquisition_funnel.bofu.message && (
                                        <p className="text-xs text-muted-foreground italic">"{demandPlan.acquisition_funnel.bofu.message}"</p>
                                      )}
                                      {demandPlan.acquisition_funnel.bofu.channels && (
                                        <div className="flex flex-wrap gap-1">
                                          {demandPlan.acquisition_funnel.bofu.channels.map((ch, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">{ch}</Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Sinergias */}
                          {demandPlan.channel_synergies && demandPlan.channel_synergies.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Sinergias entre Canais
                              </h5>
                              <ul className="space-y-1">
                                {demandPlan.channel_synergies.map((syn, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    {syn}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Cronograma */}
                          {demandPlan.implementation_timeline && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Cronograma de Implementação
                              </h5>
                              <div className="space-y-2">
                                {demandPlan.implementation_timeline.week_1_2 && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <Badge variant="outline" className="shrink-0">Sem 1-2</Badge>
                                    <span>{demandPlan.implementation_timeline.week_1_2}</span>
                                  </div>
                                )}
                                {demandPlan.implementation_timeline.week_3_4 && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <Badge variant="outline" className="shrink-0">Sem 3-4</Badge>
                                    <span>{demandPlan.implementation_timeline.week_3_4}</span>
                                  </div>
                                )}
                                {demandPlan.implementation_timeline.week_5_8 && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <Badge variant="outline" className="shrink-0">Sem 5-8</Badge>
                                    <span>{demandPlan.implementation_timeline.week_5_8}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Editor do Plano de Demanda */}
                      {demandPlan && (
                        <DemandPlanEditor
                          offerId={offer.id}
                          clientId={clientId}
                          demandPlan={demandPlan}
                          onPlanUpdate={(plan) => handleDemandPlanUpdate(offer.id, plan)}
                          pppData={pppData}
                        />
                      )}
                    </div>
                  );
                })}
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
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{variantLabels[lp.variant] || lp.variant}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(lp.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <PDFExportButton
                            type="landing-page"
                            clientName={clientName}
                            content={{ sections }}
                            variant={lp.variant}
                            createdAt={lp.created_at}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta landing page? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteLandingPage(lp.id)}
                                  disabled={deletingId === lp.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingId === lp.id ? "Excluindo..." : "Excluir"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <LandingPageViewer sections={sections} variant={lp.variant} clientName={clientName} createdAt={lp.created_at} showPDFButton={false} />
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
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(`${ad.headline}\n\n${ad.body_text}\n\n${ad.cta}`, `Anúncio ${idx + 1}`)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAd(ad.id)}
                                    disabled={deletingId === ad.id}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingId === ad.id ? "Excluindo..." : "Excluir"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
                        <div key={ad.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{angleLabels[ad.ad_angle || ""] || ad.ad_angle}</Badge>
                            <div className="flex items-center gap-2">
                              {script?.duration && (
                                <span className="text-xs text-muted-foreground">{script.duration}</span>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => copyToClipboard(
                                  `HOOK:\n${script?.hook}\n\nBODY:\n${script?.body}\n\nCTA:\n${script?.cta}`,
                                  `Script ${ad.ad_angle}`
                                )}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este script de vídeo? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAd(ad.id)}
                                      disabled={deletingId === ad.id}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deletingId === ad.id ? "Excluindo..." : "Excluir"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          {script?.hook && (
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Hook (Gancho)</p>
                              <p className="text-sm">{script.hook}</p>
                            </div>
                          )}
                          {script?.body && (
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Desenvolvimento</p>
                              <p className="text-sm">{script.body}</p>
                            </div>
                          )}
                          {script?.cta && (
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">CTA</p>
                              <p className="text-sm font-medium text-primary">{script.cta}</p>
                            </div>
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
