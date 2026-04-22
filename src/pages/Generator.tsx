import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { getAIConfig } from "@/lib/aiConfig";
import { parseOfferBank, getOfferState, type OfferStatesMap } from "@/lib/offerParser";

type Client = Tables<"clients">;

interface ClientWithPPP {
  id: string;
  name: string;
  status: Client["status"];
  hasProfile: boolean;
  hasPromise: boolean;
  icps: { id: string; name: string }[];
}

interface BankOfferOption {
  key: string; // documentId::offerId
  documentId: string;
  documentName: string;
  offerId: string;
  offerName: string;
  partLabel: string;
  rawText: string;
}

type GenerationType = "offer" | "ads";

export default function Generator() {
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("client");
  const typeParam = searchParams.get("type") as GenerationType | null;

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clients, setClients] = useState<ClientWithPPP[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientIdParam);
  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(null);
  const [bankOptions, setBankOptions] = useState<BankOfferOption[]>([]);
  const [selectedBankKey, setSelectedBankKey] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<GenerationType>>(
    typeParam ? new Set([typeParam]) : new Set()
  );
  const [generationResults, setGenerationResults] = useState<{
    offer?: boolean;
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
      fetchBankOffersForClient(selectedClientId);
      setSelectedIcpId(null);
      setSelectedBankKey(null);
    }
  }, [selectedClientId]);

  const fetchEligibleClients = async () => {
    setIsLoading(true);

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

  const fetchBankOffersForClient = async (clientId: string) => {
    const { data } = await supabase
      .from("client_offer_documents")
      .select("id, name, generated_text, offer_states")
      .eq("client_id", clientId)
      .order("sort_order", { ascending: true });

    const opts: BankOfferOption[] = [];
    for (const doc of data || []) {
      if (!doc.generated_text) continue;
      const parsed = parseOfferBank(doc.generated_text);
      const states = (doc.offer_states as OfferStatesMap) || {};
      for (const offer of parsed.offers) {
        const st = getOfferState(states, offer.id);
        if (!st.enabled || st.deleted) continue;
        opts.push({
          key: `${doc.id}::${offer.id}`,
          documentId: doc.id,
          documentName: doc.name,
          offerId: offer.id,
          offerName: offer.name,
          partLabel: offer.partLabel,
          rawText: offer.rawText,
        });
      }
    }
    setBankOptions(opts);
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

    if (selectedTypes.has("offer") && !selectedIcpId) {
      toast.error("Selecione um perfil de cliente para gerar a oferta");
      return;
    }

    if (selectedTypes.has("ads") && bankOptions.length > 0 && !selectedBankKey) {
      toast.error("Selecione uma oferta do Banco para gerar os anúncios");
      return;
    }

    setIsGenerating(true);
    setGenerationResults({});

    try {
      const [profileRes, icpsRes, painsRes, promiseRes, clientRes] = await Promise.all([
        supabase.from("client_profile").select("*").eq("client_id", selectedClientId).maybeSingle(),
        supabase.from("icps").select("*").eq("client_id", selectedClientId).order("sort_order"),
        supabase.from("icp_pains").select("*, icps(name)").eq("icps.client_id", selectedClientId),
        supabase.from("client_promise").select("*").eq("client_id", selectedClientId).maybeSingle(),
        supabase.from("clients").select("niche").eq("id", selectedClientId).maybeSingle(),
      ]);

      const filteredIcps = selectedIcpId
        ? (icpsRes.data || []).filter((icp) => icp.id === selectedIcpId)
        : icpsRes.data || [];

      const filteredPains = selectedIcpId
        ? (painsRes.data || []).filter((pain) => pain.icp_id === selectedIcpId)
        : painsRes.data || [];

      const pppData = {
        profile: profileRes.data,
        icps: filteredIcps,
        pains: filteredPains,
        promise: promiseRes.data,
        niche: clientRes.data?.niche || null,
      };

      const results: typeof generationResults = {};
      const selectedBank = bankOptions.find((o) => o.key === selectedBankKey) || null;

      for (const type of selectedTypes) {
        try {
          const aiConfig = getAIConfig();
          const body: Record<string, unknown> = {
            type,
            clientId: selectedClientId,
            pppData,
            aiConfig,
          };

          if (type === "offer") {
            body.icpId = selectedIcpId;
          }

          if (type === "ads" && selectedBank) {
            body.bankOfferText = selectedBank.rawText;
            body.bankOfferDocumentId = selectedBank.documentId;
            body.bankOfferId = selectedBank.offerId;
          }

          const { data, error } = await supabase.functions.invoke("generate-content", {
            body,
          });

          if (error) {
            console.error(`Error generating ${type}:`, error);
            toast.error(`Erro ao gerar ${type === "offer" ? "oferta" : "anúncios"}`);
            results[type] = false;
          } else {
            results[type] = true;
            toast.success(`${type === "offer" ? "Oferta" : "Anúncios"} gerado(s) com sucesso!`);
          }
        } catch (err) {
          console.error(`Error generating ${type}:`, err);
          results[type] = false;
        }
      }

      setGenerationResults(results);

      const hasAnySuccess = Object.values(results).some((v) => v);
      if (hasAnySuccess) {
        const selectedClient = clients.find((c) => c.id === selectedClientId);
        if (selectedClient?.status === "ppp_completed") {
          await supabase
            .from("clients")
            .update({ status: "offer_generated" })
            .eq("id", selectedClientId);
        }
        setRefreshTrigger((prev) => prev + 1);
        if (results.offer) {
          fetchBankOffersForClient(selectedClientId);
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
          <p className="text-muted-foreground">Gere ofertas e anúncios com IA</p>
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

  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Gerador IA</h1>
          <p className="text-muted-foreground">Gere ofertas e anúncios com IA</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum cliente pronto para geração</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Complete o Onboarding X1 de um cliente para poder gerar ofertas e anúncios com IA.
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
        <p className="text-muted-foreground">Gere ofertas e anúncios com IA</p>
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
                      {client.icps.length} Perfil{client.icps.length > 1 ? "s" : ""}
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
                {selectedClient.icps.length} Perfil{selectedClient.icps.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Selection */}
      {selectedClientId && selectedClient && selectedClient.icps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              2. Selecione um Perfil de Cliente
            </CardTitle>
            <CardDescription>
              A oferta será gerada especificamente para este perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedIcpId || ""}
              onValueChange={(value) => setSelectedIcpId(value || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um perfil..." />
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
                      ⚠️ Selecione um perfil de cliente acima para gerar a oferta
                    </p>
                  )}
                </div>
              </div>

              {/* Ads */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="ads"
                  checked={selectedTypes.has("ads")}
                  onCheckedChange={() => toggleType("ads")}
                  disabled={bankOptions.length === 0}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="ads"
                    className={`flex items-center gap-2 font-medium cursor-pointer ${bankOptions.length === 0 ? "text-muted-foreground" : ""}`}
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
                    Gera <strong>16 anúncios</strong>: 6 roteiros de vídeo (incluindo formato "Caixinha de Perguntas") + 10 estáticos (5 dores, 5 desejos)
                  </p>
                  {bankOptions.length === 0 ? (
                    <p className="text-sm text-destructive mt-2">
                      ⚠️ Gere o <strong>Banco de Ofertas</strong> primeiro no detalhe do cliente para criar anúncios
                    </p>
                  ) : selectedTypes.has("ads") && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">
                        Selecione qual oferta do banco será a base dos anúncios:
                      </Label>
                      <Select
                        value={selectedBankKey || ""}
                        onValueChange={(value) => setSelectedBankKey(value || null)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione uma oferta do banco..." />
                        </SelectTrigger>
                        <SelectContent>
                          {bankOptions.map((opt) => (
                            <SelectItem key={opt.key} value={opt.key}>
                              <span className="text-xs text-muted-foreground">{opt.partLabel}</span>
                              {" — "}
                              <span>{opt.offerName}</span>
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
          clientName={clients.find((c) => c.id === selectedClientId)?.name}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
}
