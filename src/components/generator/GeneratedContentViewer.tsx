import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Image,
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
  Clock,
  Heart,
  AlertTriangle,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, Json } from "@/integrations/supabase/types";
import { OfferOptionsSelector } from "./OfferOptionsSelector";
import { DemandPlanEditor } from "./DemandPlanEditor";
import { LandingPageViewer } from "./LandingPageViewer";
import { PDFExportButton } from "@/components/export/PDFExportButton";
import { AdsRefinerChat } from "./AdsRefinerChat";
import { VideoAdCard } from "./VideoAdCard";
import { useWebhook } from "@/hooks/useWebhook";

type Offer = Tables<"offers_hormozi">;
type Icp = Tables<"icps">;
type LandingPage = Tables<"landing_pages">;
type Ad = Tables<"ads">;

interface GeneratedContentViewerProps {
  clientId: string;
  clientName?: string;
  refreshTrigger?: number;
  onboardingData?: any;
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
  problem?: string;
  why_bad?: string;
  solution?: string;
  proof?: string;
  cta?: string;
  duration?: string;
  visual_notes?: string;
  body?: string; // Legacy field
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

export function GeneratedContentViewer({ clientId, clientName = "Cliente", refreshTrigger, onboardingData }: GeneratedContentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [icps, setIcps] = useState<Pick<Icp, "id" | "name">[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // State for tracking live edits per offer (for PDF sync)
  const [liveEdits, setLiveEdits] = useState<Record<string, { options: GeneratedOptions; selected: SelectedOptions }>>({});

  // State for refiner chat
  const [refinerOpen, setRefinerOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<{ ad: Ad; type: "video" | "static" } | null>(null);
  
  // State for ads PDF sync
  const [adsRefreshKey, setAdsRefreshKey] = useState(0);

  // Webhook hook
  const { sendStaticAdsWebhook, isSending: isWebhookSending } = useWebhook();

  useEffect(() => {
    fetchGeneratedContent();
  }, [clientId, refreshTrigger]);

  const fetchGeneratedContent = async () => {
    setIsLoading(true);

    const [offersRes, lpsRes, adsRes, icpsRes] = await Promise.all([
      supabase.from("offers_hormozi").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("landing_pages").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("ads").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("icps").select("id, name").eq("client_id", clientId),
    ]);

    setOffers(offersRes.data || []);
    setLandingPages(lpsRes.data || []);
    setAds(adsRes.data || []);
    setIcps(icpsRes.data || []);
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
    setAdsRefreshKey((k) => k + 1);
    toast.success("Anúncio excluído com sucesso!");
  };

  // Handler for video ad updates (inline editing)
  const handleAdUpdate = (updatedAd: Ad) => {
    setAds((prev) => prev.map((a) => (a.id === updatedAd.id ? updatedAd : a)));
    setAdsRefreshKey((k) => k + 1);
  };

  const openRefiner = (ad: Ad, type: "video" | "static") => {
    setSelectedAd({ ad, type });
    setRefinerOpen(true);
  };

  const handleApplyRefinement = async (newContent: any) => {
    if (!selectedAd) return;

    const updateData: Partial<Ad> = {};
    
    if (selectedAd.type === "video") {
      updateData.video_hook = newContent.hook;
      updateData.video_problem = newContent.problem;
      updateData.video_why_bad = newContent.why_bad;
      updateData.video_solution = newContent.solution;
      updateData.video_proof = newContent.proof;
      updateData.video_cta = newContent.cta;
      updateData.video_duration = newContent.duration;
      updateData.video_visual_notes = newContent.visual_notes;
    } else {
      updateData.headline = newContent.headline;
      updateData.subheadline = newContent.subheadline;
      updateData.body_text = newContent.body_text;
      updateData.eliminators = newContent.eliminators;
      updateData.cta = newContent.cta;
      updateData.visual_suggestion = newContent.visual_suggestion;
    }

    const { error } = await supabase
      .from("ads")
      .update(updateData)
      .eq("id", selectedAd.ad.id);

    if (error) {
      toast.error("Erro ao salvar alterações");
      return;
    }

    // Update local state
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === selectedAd.ad.id ? { ...ad, ...updateData } : ad
      )
    );
    setAdsRefreshKey((k) => k + 1);
    toast.success("Anúncio atualizado com sucesso!");
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

  // Separate ads by type and angle
  const videoAds = ads.filter(ad => ad.asset_type === "video_ad");
  const staticAds = ads.filter(ad => ad.asset_type === "static_ad");
  const painBasedAds = staticAds.filter(ad => ad.angle === "pain");
  const desireBasedAds = staticAds.filter(ad => ad.angle === "desire");

  // Video type labels
  const videoTypeLabels: Record<string, string> = {
    pattern_break: "Quebra de Padrão",
    question_box: "Caixinha de Perguntas",
    daily_scene: "Cotidiano + Problema",
    location_based: "Direcionado para Região",
    social_proof: "Prova Social",
    // Legacy types
    direct: "Direto",
    educational: "Educacional",
  };

  // Focus labels for static ads
  const focusLabels: Record<string, string> = {
    main_pain: "Dor Principal",
    secondary_pain: "Dor Secundária",
    impact_1: "Impacto 1",
    impact_2: "Impacto 2",
    consequence: "Consequência",
    desire_1: "Desejo 1",
    desire_2: "Desejo 2",
    promise: "Promessa",
    result: "Resultado",
    transformation: "Transformação",
  };

  const renderVideoAd = (ad: Ad) => {
    // Check if it's new format (has video_hook) or legacy (has script)
    const isNewFormat = ad.video_hook || ad.video_problem;
    const script = ad.script as VideoScript;
    
    const videoContent = isNewFormat ? {
      hook: ad.video_hook || "",
      problem: ad.video_problem || "",
      why_bad: ad.video_why_bad || "",
      solution: ad.video_solution || "",
      proof: ad.video_proof || "",
      cta: ad.video_cta || "",
      duration: ad.video_duration || "",
      visual_notes: ad.video_visual_notes || "",
    } : {
      hook: script?.hook || "",
      problem: "",
      why_bad: "",
      solution: "",
      proof: "",
      cta: script?.cta || "",
      duration: script?.duration || "",
      visual_notes: "",
      body: script?.body || "",
    };

    return (
      <div key={ad.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {videoTypeLabels[ad.video_type || ad.ad_angle || ""] || ad.ad_angle}
            </Badge>
            {videoContent.duration && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {videoContent.duration}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => openRefiner(ad, "video")}
            >
              <Sparkles className="h-3 w-3" />
              Refinar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const fullScript = isNewFormat
                  ? `HOOK:\n${videoContent.hook}\n\nPROBLEMA:\n${videoContent.problem}\n\nPOR QUE É RUIM:\n${videoContent.why_bad}\n\nSOLUÇÃO:\n${videoContent.solution}\n\nPROVA:\n${videoContent.proof}\n\nCTA:\n${videoContent.cta}`
                  : `HOOK:\n${videoContent.hook}\n\nDESENVOLVIMENTO:\n${videoContent.body}\n\nCTA:\n${videoContent.cta}`;
                copyToClipboard(fullScript, "Roteiro");
              }}
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
                    Tem certeza que deseja excluir este roteiro? Esta ação não pode ser desfeita.
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

        {isNewFormat ? (
          <div className="space-y-3 text-sm">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1">HOOK</p>
              <p>{videoContent.hook}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1">PROBLEMA</p>
              <p>{videoContent.problem}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                POR QUE ISSO É RUIM
              </p>
              <p>{videoContent.why_bad}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1">SOLUÇÃO</p>
              <p>{videoContent.solution}</p>
            </div>
            {videoContent.proof && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium mb-1">PROVA</p>
                <p>{videoContent.proof}</p>
              </div>
            )}
            <div className="bg-primary/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1">CTA</p>
              <p className="font-medium text-primary">{videoContent.cta}</p>
            </div>
            {videoContent.visual_notes && (
              <div className="border border-dashed p-3 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium mb-1">NOTAS VISUAIS</p>
                <p className="text-muted-foreground">{videoContent.visual_notes}</p>
              </div>
            )}
          </div>
        ) : (
          // Legacy format
          <div className="space-y-2 text-sm">
            {videoContent.hook && (
              <div>
                <p className="text-xs text-muted-foreground font-medium">Hook (Gancho)</p>
                <p>{videoContent.hook}</p>
              </div>
            )}
            {videoContent.body && (
              <div>
                <p className="text-xs text-muted-foreground font-medium">Desenvolvimento</p>
                <p>{videoContent.body}</p>
              </div>
            )}
            {videoContent.cta && (
              <div>
                <p className="text-xs text-muted-foreground font-medium">CTA</p>
                <p className="font-medium text-primary">{videoContent.cta}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStaticAd = (ad: Ad) => {
    const staticContent = {
      headline: ad.headline || "",
      subheadline: ad.subheadline || "",
      body_text: ad.body_text || "",
      eliminators: ad.eliminators || [],
      cta: ad.cta || "",
      visual_suggestion: ad.visual_suggestion || "",
    };

    return (
      <div key={ad.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={ad.angle === "pain" ? "destructive" : "default"} className="gap-1">
              {ad.angle === "pain" ? <AlertTriangle className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
              {focusLabels[ad.focus || ""] || ad.focus || ad.ad_angle}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => openRefiner(ad, "static")}
            >
              <Sparkles className="h-3 w-3" />
              Refinar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(
                `${staticContent.headline}\n\n${staticContent.subheadline}\n\n${staticContent.body_text}\n\n${staticContent.eliminators?.join('\n')}\n\n${staticContent.cta}`,
                "Anúncio"
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

        <div className="space-y-2">
          {staticContent.headline && (
            <p className="font-semibold text-lg">{staticContent.headline}</p>
          )}
          {staticContent.subheadline && (
            <p className="text-muted-foreground">{staticContent.subheadline}</p>
          )}
          {staticContent.body_text && (
            <p className="text-sm">{staticContent.body_text}</p>
          )}
          {staticContent.eliminators && staticContent.eliminators.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {staticContent.eliminators.map((el, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {el}
                </Badge>
              ))}
            </div>
          )}
          {staticContent.cta && (
            <p className="text-sm font-medium text-primary pt-2">{staticContent.cta}</p>
          )}
          {staticContent.visual_suggestion && (
            <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
              💡 {staticContent.visual_suggestion}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
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
                          <Badge variant="outline">Oferta {offerIdx + 1}{offer.icp_id ? ` - ${icps.find(i => i.id === offer.icp_id)?.name || "ICP"}` : ""}</Badge>
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
                            onboardingData={onboardingData}
                          />
                        ) : (
                          <>
                            {/* Legacy display for old offers without options */}
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
                                      {demandPlan.primary_strategy.audiences.map((aud: any, i) => {
                                        const audienceLabel =
                                          typeof aud === "string"
                                            ? aud
                                            : aud?.name || aud?.geo || aud?.source || "Público";

                                        return (
                                          <Badge key={i} variant="secondary" className="text-xs">{audienceLabel}</Badge>
                                        );
                                      })}
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
                                            {Array.isArray(demandPlan.acquisition_funnel.tofu.channels) 
                                              ? demandPlan.acquisition_funnel.tofu.channels.map((ch, i) => (
                                                  <Badge key={i} variant="secondary" className="text-xs">{ch}</Badge>
                                                ))
                                              : <Badge variant="secondary" className="text-xs">{demandPlan.acquisition_funnel.tofu.channels}</Badge>
                                            }
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
                                            {Array.isArray(demandPlan.acquisition_funnel.mofu.channels) 
                                              ? demandPlan.acquisition_funnel.mofu.channels.map((ch, i) => (
                                                  <Badge key={i} variant="secondary" className="text-xs">{ch}</Badge>
                                                ))
                                              : <Badge variant="secondary" className="text-xs">{demandPlan.acquisition_funnel.mofu.channels}</Badge>
                                            }
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
                                            {Array.isArray(demandPlan.acquisition_funnel.bofu.channels) 
                                              ? demandPlan.acquisition_funnel.bofu.channels.map((ch, i) => (
                                                  <Badge key={i} variant="secondary" className="text-xs">{ch}</Badge>
                                                ))
                                              : <Badge variant="secondary" className="text-xs">{demandPlan.acquisition_funnel.bofu.channels}</Badge>
                                            }
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
                            onboardingData={onboardingData}
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

            {/* Anúncios - Nova estrutura com tabs */}
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
                <AccordionContent className="pt-4">
                  {/* PDF Export Button for Ads */}
                  <div className="flex justify-end gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={isWebhookSending || staticAds.length === 0}
                      onClick={() => {
                        const icpName = offers[0]?.icp_id
                          ? icps.find(i => i.id === offers[0].icp_id)?.name
                          : undefined;
                        sendStaticAdsWebhook(staticAds, clientName, icpName);
                      }}
                    >
                      <Send className="h-4 w-4" />
                      {isWebhookSending ? "Enviando..." : "Enviar via Webhook"}
                    </Button>
                    <PDFExportButton
                      type="ads"
                      adsFilter="static"
                      clientName={clientName}
                      content={{ videoAds, staticAds }}
                      createdAt={new Date().toISOString()}
                      refreshKey={adsRefreshKey}
                    />
                    <PDFExportButton
                      type="ads"
                      adsFilter="video"
                      clientName={clientName}
                      content={{ videoAds, staticAds }}
                      createdAt={new Date().toISOString()}
                      refreshKey={adsRefreshKey}
                    />
                  </div>
                  
                  <Tabs defaultValue="statics" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="statics" className="gap-2">
                        <Image className="h-4 w-4" />
                        Estáticos ({staticAds.length})
                      </TabsTrigger>
                      <TabsTrigger value="videos" className="gap-2">
                        <Video className="h-4 w-4" />
                        Vídeos ({videoAds.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab Estáticos */}
                    <TabsContent value="statics" className="space-y-6 mt-4">
                      {/* Baseados em Dores */}
                      {painBasedAds.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Baseados em Dores ({painBasedAds.length})
                          </h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            {painBasedAds.map(renderStaticAd)}
                          </div>
                        </div>
                      )}

                      {/* Baseados em Desejos */}
                      {desireBasedAds.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Heart className="h-4 w-4 text-primary" />
                            Baseados em Desejos ({desireBasedAds.length})
                          </h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            {desireBasedAds.map(renderStaticAd)}
                          </div>
                        </div>
                      )}

                      {/* Legacy static ads (without angle) */}
                      {staticAds.filter(ad => !ad.angle).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Outros</h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            {staticAds.filter(ad => !ad.angle).map(renderStaticAd)}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab Vídeos */}
                    <TabsContent value="videos" className="space-y-4 mt-4">
                      <div className="grid gap-4">
                        {videoAds.map((ad) => (
                          <VideoAdCard
                            key={ad.id}
                            ad={ad}
                            onDelete={() => handleDeleteAd(ad.id)}
                            onRefine={() => openRefiner(ad, "video")}
                            onUpdate={handleAdUpdate}
                            isDeleting={deletingId === ad.id}
                          />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Refiner Chat Dialog */}
      {selectedAd && (
        <AdsRefinerChat
          isOpen={refinerOpen}
          onClose={() => {
            setRefinerOpen(false);
            setSelectedAd(null);
          }}
          adId={selectedAd.ad.id}
          adType={selectedAd.type}
          currentContent={
            selectedAd.type === "video"
              ? {
                  hook: selectedAd.ad.video_hook || (selectedAd.ad.script as any)?.hook || "",
                  problem: selectedAd.ad.video_problem || "",
                  why_bad: selectedAd.ad.video_why_bad || "",
                  solution: selectedAd.ad.video_solution || "",
                  proof: selectedAd.ad.video_proof || "",
                  cta: selectedAd.ad.video_cta || (selectedAd.ad.script as any)?.cta || "",
                  duration: selectedAd.ad.video_duration || (selectedAd.ad.script as any)?.duration || "",
                  visual_notes: selectedAd.ad.video_visual_notes || "",
                }
              : {
                  headline: selectedAd.ad.headline || "",
                  subheadline: selectedAd.ad.subheadline || "",
                  body_text: selectedAd.ad.body_text || "",
                  eliminators: selectedAd.ad.eliminators || [],
                  cta: selectedAd.ad.cta || "",
                  visual_suggestion: selectedAd.ad.visual_suggestion || "",
                }
          }
          onApply={handleApplyRefinement}
        />
      )}
    </>
  );
}
