import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  FileText,
  Layout,
  Video,
  Loader2,
  CheckCircle,
  Users,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { GeneratedContentViewer } from "@/components/generator/GeneratedContentViewer";

type LPVariant = "direct" | "consultive" | "aggressive";

type Client = Tables<"clients">;
type Offer = Tables<"offers_hormozi">;

interface ClientWithPPP {
  id: string;
  name: string;
  status: Client["status"];
  hasProfile: boolean;
  hasPromise: boolean;
  icps: { id: string; name: string }[];
}

type GenerationType = "offer" | "lp" | "ads";

export default function Generator() {
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("client");
  const typeParam = searchParams.get("type") as GenerationType | null;

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clients, setClients] = useState<ClientWithPPP[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientIdParam);
  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [selectedLpVariant, setSelectedLpVariant] = useState<LPVariant>("direct");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<GenerationType>>(
    typeParam ? new Set([typeParam]) : new Set()
  );
  const [generationResults, setGenerationResults] = useState<{
    offer?: boolean;
    lp?: boolean;
    ads?: boolean;
  }>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchEligibleClients();
  }, []);

  useEffect(() => {
    if (clientIdParam && !selectedClientId) {
      setSelectedClientId(clientIdParam);
    }
  }, [clientIdParam]);

  useEffect(() => {
    if (selectedClientId) {
      fetchOffersForClient(selectedClientId);
      // Reset ICP selection when client changes
      setSelectedIcpId(null);
      setSelectedOfferId(null);
    }
  }, [selectedClientId]);

  const fetchEligibleClients = async () => {
    setIsLoading(true);

    // Fetch clients with PPP completed status
    const { data: clientsData, error } = await supabase
      .from("clients")
      .select("id, name, status")
      .in("status", ["ppp_completed", "offer_generated", "assets_generated"])
      .order("name");

    if (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar clientes");
      setIsLoading(false);
      return;
    }

    if (!clientsData || clientsData.length === 0) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    const clientIds = clientsData.map((c) => c.id);

    // Fetch related data
    const [profilesRes, promisesRes, icpsRes] = await Promise.all([
      supabase.from("client_profile").select("client_id").in("client_id", clientIds),
      supabase.from("client_promise").select("client_id").in("client_id", clientIds),
      supabase.from("icps").select("id, name, client_id").in("client_id", clientIds),
    ]);

    const profileSet = new Set(profilesRes.data?.map((p) => p.client_id) || []);
    const promiseSet = new Set(promisesRes.data?.map((p) => p.client_id) || []);
    const icpsMap = new Map<string, { id: string; name: string }[]>();
    icpsRes.data?.forEach((icp) => {
      if (!icpsMap.has(icp.client_id)) {
        icpsMap.set(icp.client_id, []);
      }
      icpsMap.get(icp.client_id)!.push({ id: icp.id, name: icp.name });
    });

    const clientsWithPPP = clientsData.map((client) => ({
      id: client.id,
      name: client.name,
      status: client.status,
      hasProfile: profileSet.has(client.id),
      hasPromise: promiseSet.has(client.id),
      icps: icpsMap.get(client.id) || [],
    }));

    setClients(clientsWithPPP);
    setIsLoading(false);
  };

  const fetchOffersForClient = async (clientId: string) => {
    const { data } = await supabase
      .from("offers_hormozi")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    
    setOffers(data || []);
  };

  const toggleType = (type: GenerationType) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  const handleGenerate = async () => {
    if (!selectedClientId || selectedTypes.size === 0) {
      toast.error("Selecione um cliente e pelo menos um tipo de geração");
      return;
    }

    // Validate ICP selection for offer generation
    if (selectedTypes.has("offer") && !selectedIcpId) {
      toast.error("Selecione um ICP para gerar a oferta");
      return;
    }

    // Validate offer selection for ads generation
    if (selectedTypes.has("ads") && !selectedOfferId && offers.length > 0) {
      toast.error("Selecione uma oferta para gerar os anúncios");
      return;
    }

    setIsGenerating(true);
    setGenerationResults({});

    try {
      // Fetch PPP data for the client
      const [profileRes, icpsRes, painsRes, promiseRes, clientRes] = await Promise.all([
        supabase.from("client_profile").select("*").eq("client_id", selectedClientId).maybeSingle(),
        supabase.from("icps").select("*").eq("client_id", selectedClientId).order("sort_order"),
        supabase.from("icp_pains").select("*, icps(name)").eq("icps.client_id", selectedClientId),
        supabase.from("client_promise").select("*").eq("client_id", selectedClientId).maybeSingle(),
        supabase.from("clients").select("niche").eq("id", selectedClientId).maybeSingle(),
      ]);

      // Filter to selected ICP if generating offer
      const filteredIcps = selectedIcpId 
        ? (icpsRes.data || []).filter(icp => icp.id === selectedIcpId)
        : icpsRes.data || [];

      const filteredPains = selectedIcpId
        ? (painsRes.data || []).filter(pain => pain.icp_id === selectedIcpId)
        : painsRes.data || [];

      const pppData = {
        profile: profileRes.data,
        icps: filteredIcps,
        pains: filteredPains,
        promise: promiseRes.data,
        niche: clientRes.data?.niche || null,
      };

      const results: typeof generationResults = {};

      // Generate each selected type
      for (const type of selectedTypes) {
        try {
          const body: Record<string, unknown> = {
            type,
            clientId: selectedClientId,
            pppData,
          };

          // Add ICP for offer generation (AI will decide channels automatically)
          if (type === "offer") {
            body.icpId = selectedIcpId;
          }

          // Add LP variant for landing page generation
          if (type === "lp") {
            body.lpVariant = selectedLpVariant;
          }

          // Add offer ID for ads generation
          if (type === "ads" && selectedOfferId) {
            body.offerId = selectedOfferId;
          }

          const { data, error } = await supabase.functions.invoke("generate-content", {
            body,
          });

          if (error) {
            console.error(`Error generating ${type}:`, error);
            toast.error(`Erro ao gerar ${type === "offer" ? "oferta" : type === "lp" ? "landing page" : "anúncios"}`);
            results[type] = false;
          } else {
            results[type] = true;
            toast.success(`${type === "offer" ? "Oferta" : type === "lp" ? "Landing Page" : "Anúncios"} gerado(s) com sucesso!`);
          }
        } catch (err) {
          console.error(`Error generating ${type}:`, err);
          results[type] = false;
        }
      }

      setGenerationResults(results);

      // Update client status if needed
      const hasAnySuccess = Object.values(results).some((v) => v);
      if (hasAnySuccess) {
        const selectedClient = clients.find((c) => c.id === selectedClientId);
        if (selectedClient?.status === "ppp_completed") {
          await supabase
            .from("clients")
            .update({ status: "offer_generated" })
            .eq("id", selectedClientId);
        }
        // Trigger refresh of generated content viewer and offers
        setRefreshTrigger(prev => prev + 1);
        if (results.offer) {
          fetchOffersForClient(selectedClientId);
        }
      }
    } catch (error) {
      console.error("Error in generation:", error);
      toast.error("Erro durante a geração");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Gerador IA</h1>
          <p className="text-muted-foreground">Gere ofertas, LPs e anúncios com IA</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state: no clients with PPP completed
  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Gerador IA</h1>
          <p className="text-muted-foreground">Gere ofertas, LPs e anúncios com IA</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum cliente pronto para geração</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Complete o Onboarding X1 de um cliente para poder gerar ofertas, LPs e anúncios com IA.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/onboarding">
                Ir para Onboarding X1
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Gerador IA</h1>
        <p className="text-muted-foreground">Gere ofertas, LPs e anúncios com IA</p>
      </div>

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            1. Selecione um cliente
          </CardTitle>
          <CardDescription>
            Apenas clientes com Onboarding X1 concluído estão disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedClientId || ""}
            onValueChange={(value) => setSelectedClientId(value || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex items-center gap-2">
                    <span>{client.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {client.icps.length} ICP{client.icps.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedClient && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {selectedClient.hasProfile && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  Produto definido
                </span>
              )}
              {selectedClient.hasPromise && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  Promessa definida
                </span>
              )}
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-primary" />
                {selectedClient.icps.length} ICP{selectedClient.icps.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ICP Selection */}
      {selectedClientId && selectedClient && selectedClient.icps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              2. Selecione um ICP
            </CardTitle>
            <CardDescription>
              A oferta será gerada especificamente para este perfil de cliente ideal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedIcpId || ""}
              onValueChange={(value) => setSelectedIcpId(value || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um ICP..." />
              </SelectTrigger>
              <SelectContent>
                {selectedClient.icps.map((icp) => (
                  <SelectItem key={icp.id} value={icp.id}>
                    {icp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Generation Options */}
      {selectedClientId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              3. O que deseja gerar?
            </CardTitle>
            <CardDescription>
              Selecione os tipos de conteúdo que deseja gerar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Offer */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="offer"
                  checked={selectedTypes.has("offer")}
                  onCheckedChange={() => toggleType("offer")}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="offer"
                    className="flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Oferta Hormozi
                    {generationResults.offer && (
                      <Badge variant="default" className="ml-2 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Gerado
                      </Badge>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gera uma oferta irresistível com promessa, mecanismo único, garantia, prova social, pilha de valor 
                    e <strong>plano estratégico de demanda automático</strong> (Facebook/Meta Ads como foco principal)
                  </p>
                  {!selectedIcpId && selectedTypes.has("offer") && (
                    <p className="text-sm text-destructive mt-1">
                      ⚠️ Selecione um ICP acima para gerar a oferta
                    </p>
                  )}
                </div>
              </div>

              {/* Landing Page */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="lp"
                  checked={selectedTypes.has("lp")}
                  onCheckedChange={() => toggleType("lp")}
                />
                <div className="flex-1 space-y-3">
                  <Label
                    htmlFor="lp"
                    className="flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Layout className="h-4 w-4 text-muted-foreground" />
                    Landing Page
                    {generationResults.lp && (
                      <Badge variant="default" className="ml-2 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Gerado
                      </Badge>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Gera uma LP completa com 10 seções: Hero, Problemas, Solução, Benefícios, Como Funciona, Prova Social, Garantia, Pilha de Valor, FAQ e CTA Final
                  </p>

                  {selectedTypes.has("lp") && (
                    <div className="pt-2 border-t">
                      <Label className="text-sm font-medium">Escolha o estilo da LP:</Label>
                      <RadioGroup 
                        value={selectedLpVariant} 
                        onValueChange={(v) => setSelectedLpVariant(v as LPVariant)}
                        className="mt-2 space-y-2"
                      >
                        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="direct" id="lp-direct" className="mt-1" />
                          <Label htmlFor="lp-direct" className="cursor-pointer flex-1">
                            <span className="font-medium">Direta</span>
                            <p className="text-xs text-muted-foreground font-normal">
                              Copy objetiva, focada no resultado, vai direto ao ponto
                            </p>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="consultive" id="lp-consultive" className="mt-1" />
                          <Label htmlFor="lp-consultive" className="cursor-pointer flex-1">
                            <span className="font-medium">Consultiva</span>
                            <p className="text-xs text-muted-foreground font-normal">
                              Copy educativa, explica o processo, gera confiança
                            </p>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="aggressive" id="lp-aggressive" className="mt-1" />
                          <Label htmlFor="lp-aggressive" className="cursor-pointer flex-1">
                            <span className="font-medium">Agressiva</span>
                            <p className="text-xs text-muted-foreground font-normal">
                              Copy urgente, escassez, FOMO, gatilhos mentais fortes
                            </p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              </div>

              {/* Ads */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="ads"
                  checked={selectedTypes.has("ads")}
                  onCheckedChange={() => toggleType("ads")}
                  disabled={offers.length === 0}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="ads"
                    className={`flex items-center gap-2 font-medium cursor-pointer ${offers.length === 0 ? "text-muted-foreground" : ""}`}
                  >
                    <Video className="h-4 w-4 text-muted-foreground" />
                    Anúncios
                    {generationResults.ads && (
                      <Badge variant="default" className="ml-2 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Gerado
                      </Badge>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gera <strong>15 anúncios</strong>: 5 roteiros de vídeo (com estrutura de 6 seções) + 10 estáticos de promessa (5 baseados em dores, 5 em desejos)
                  </p>
                  {offers.length === 0 ? (
                    <p className="text-sm text-destructive mt-2">
                      ⚠️ Gere uma oferta primeiro para criar anúncios
                    </p>
                  ) : selectedTypes.has("ads") && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">Selecione a oferta base:</Label>
                      <Select
                        value={selectedOfferId || ""}
                        onValueChange={(value) => setSelectedOfferId(value || null)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione uma oferta..." />
                        </SelectTrigger>
                        <SelectContent>
                          {offers.map((offer) => (
                            <SelectItem key={offer.id} value={offer.id}>
                              {offer.promise?.substring(0, 50)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <Button
              onClick={handleGenerate}
              disabled={selectedTypes.size === 0 || isGenerating}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Content Viewer */}
      {selectedClientId && (
        <GeneratedContentViewer 
          clientId={selectedClientId} 
          clientName={clients.find(c => c.id === selectedClientId)?.name}
          refreshTrigger={refreshTrigger} 
        />
      )}
    </div>
  );
}
