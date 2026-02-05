import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Award,
  Undo2,
  Trash2,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, Json } from "@/integrations/supabase/types";
import { LandingPageViewer } from "@/components/generator/LandingPageViewer";
import { PDFExportButton } from "@/components/export/PDFExportButton";
import { VideoAdCard } from "@/components/generator/VideoAdCard";
import { AdsRefinerChat } from "@/components/generator/AdsRefinerChat";
import { CreateVideoAdDialog } from "@/components/generator/CreateVideoAdDialog";

type Offer = Tables<"offers_hormozi">;
type LandingPage = Tables<"landing_pages">;
type Ad = Tables<"ads">;

interface GeneratedAssetsSectionProps {
  clientId: string;
  clientName?: string;
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

export function GeneratedAssetsSection({ clientId, clientName = "Cliente" }: GeneratedAssetsSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // States for AI Refiner
  const [refinerOpen, setRefinerOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<{ ad: Ad; type: "video" | "static" } | null>(null);
  const [adsRefreshKey, setAdsRefreshKey] = useState(0);
  
  // State for Create Video Ad Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchGeneratedContent();
  }, [clientId]);

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

  const handleAdUpdate = (updatedAd: Ad) => {
    setAds((prev) => prev.map((a) => (a.id === updatedAd.id ? updatedAd : a)));
  };

  // AI Refiner functions
  const openRefiner = (ad: Ad, type: "video" | "static") => {
    setSelectedAd({ ad, type });
    setRefinerOpen(true);
  };

  const handleApplyRefinement = async (newContent: any) => {
    if (!selectedAd) return;

    const updateData = selectedAd.type === "video"
      ? {
          video_hook: newContent.hook,
          video_problem: newContent.problem,
          video_why_bad: newContent.why_bad,
          video_solution: newContent.solution,
          video_proof: newContent.proof,
          video_cta: newContent.cta,
          video_duration: newContent.duration,
          video_visual_notes: newContent.visual_notes,
        }
      : {
          headline: newContent.headline,
          subheadline: newContent.subheadline,
          body_text: newContent.body_text,
          eliminators: newContent.eliminators,
          cta: newContent.cta,
          visual_suggestion: newContent.visual_suggestion,
        };

    const { error } = await supabase
      .from("ads")
      .update(updateData)
      .eq("id", selectedAd.ad.id);

    if (error) {
      toast.error("Erro ao salvar anúncio refinado");
      return;
    }

    handleAdUpdate({ ...selectedAd.ad, ...updateData });
    setAdsRefreshKey((k) => k + 1);
    toast.success("Anúncio refinado com sucesso!");
  };

  // Handle new video ad created
  const handleVideoAdCreated = (newAd: Ad) => {
    setAds((prev) => [newAd, ...prev]);
    setAdsRefreshKey((k) => k + 1);
  };

  const getRefinerContent = (): any => {
    if (!selectedAd) {
      return {
        hook: "",
        problem: "",
        why_bad: "",
        solution: "",
        proof: "",
        cta: "",
        duration: "",
        visual_notes: "",
      };
    }
    
    if (selectedAd.type === "video") {
      return {
        hook: selectedAd.ad.video_hook || "",
        problem: selectedAd.ad.video_problem || "",
        why_bad: selectedAd.ad.video_why_bad || "",
        solution: selectedAd.ad.video_solution || "",
        proof: selectedAd.ad.video_proof || "",
        cta: selectedAd.ad.video_cta || "",
        duration: selectedAd.ad.video_duration || "",
        visual_notes: selectedAd.ad.video_visual_notes || "",
      };
    }
    
    return {
      headline: selectedAd.ad.headline || "",
      subheadline: selectedAd.ad.subheadline || "",
      body_text: selectedAd.ad.body_text || "",
      eliminators: selectedAd.ad.eliminators || [],
      cta: selectedAd.ad.cta || "",
      visual_suggestion: selectedAd.ad.visual_suggestion || "",
    };
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

  const getSelectedText = (offer: Offer, field: keyof GeneratedOptions): string => {
    const options = (offer.generated_options as GeneratedOptions)?.[field];
    const selected = (offer.selected_options as SelectedOptions)?.[field];
    
    if (options && selected && selected.length > 0) {
      return selected.map(idx => options[idx]).filter(Boolean).join("\n\n---\n\n");
    }
    
    // Fallback to direct field value for legacy offers
    return (offer as any)[field] || "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Conteúdos Gerados
        </CardTitle>
        <CardDescription>
          Visualize os conteúdos gerados pela IA para este cliente
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

                      {/* Promessa */}
                      {getSelectedText(offer, "promise") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              Promessa Principal
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getSelectedText(offer, "promise"), "Promessa")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{getSelectedText(offer, "promise")}</p>
                        </div>
                      )}

                      {/* Mecanismo Único */}
                      {getSelectedText(offer, "unique_mechanism") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              Mecanismo Único
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getSelectedText(offer, "unique_mechanism"), "Mecanismo único")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{getSelectedText(offer, "unique_mechanism")}</p>
                        </div>
                      )}

                      {/* Garantia */}
                      {getSelectedText(offer, "guarantee") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              Garantia
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getSelectedText(offer, "guarantee"), "Garantia")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{getSelectedText(offer, "guarantee")}</p>
                        </div>
                      )}

                      {/* Prova Social */}
                      {getSelectedText(offer, "proof") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Award className="h-4 w-4 text-primary" />
                              Prova Social
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getSelectedText(offer, "proof"), "Prova Social")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{getSelectedText(offer, "proof")}</p>
                        </div>
                      )}

                      {/* Reversão de Risco */}
                      {getSelectedText(offer, "risk_reversal") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Undo2 className="h-4 w-4 text-primary" />
                              Reversão de Risco
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getSelectedText(offer, "risk_reversal"), "Reversão de Risco")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{getSelectedText(offer, "risk_reversal")}</p>
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
                      {getSelectedText(offer, "main_cta") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              CTA Principal
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getSelectedText(offer, "main_cta"), "CTA")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm bg-primary/10 p-3 rounded-lg font-medium whitespace-pre-wrap">{getSelectedText(offer, "main_cta")}</p>
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
                              {demandPlan.primary_strategy.expected_cpl && (
                                <p className="text-sm"><strong>CPL esperado:</strong> {demandPlan.primary_strategy.expected_cpl}</p>
                              )}
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
                {/* PDF Export Button */}
                <div className="flex justify-end mb-2">
                  <PDFExportButton
                    type="ads"
                    clientName={clientName || "cliente"}
                    content={{ videoAds, staticAds }}
                    createdAt={new Date().toISOString()}
                    refreshKey={adsRefreshKey}
                  />
                </div>

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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Scripts de Vídeo</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Criar Novo
                    </Button>
                  </div>
                  {videoAds.length > 0 ? (
                    videoAds.map((ad) => (
                      <VideoAdCard
                        key={ad.id}
                        ad={ad}
                        onDelete={() => handleDeleteAd(ad.id)}
                        onRefine={() => openRefiner(ad, "video")}
                        onUpdate={handleAdUpdate}
                        isDeleting={deletingId === ad.id}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      Nenhum script de vídeo ainda. Clique em "Criar Novo" para gerar um com IA.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>

      {/* AI Refiner Dialog */}
      {selectedAd && (
        <AdsRefinerChat
          isOpen={refinerOpen}
          onClose={() => {
            setRefinerOpen(false);
            setSelectedAd(null);
          }}
          adId={selectedAd.ad.id}
          adType={selectedAd.type}
          currentContent={getRefinerContent()}
          onApply={handleApplyRefinement}
        />
      )}

      {/* Create Video Ad Dialog */}
      <CreateVideoAdDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        clientId={clientId}
        onCreated={handleVideoAdCreated}
      />
    </Card>
  );
}
