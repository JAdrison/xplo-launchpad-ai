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

type Client = Tables<"clients">;

interface ClientWithPPP {
  id: string;
  name: string;
  status: Client["status"];
  hasProfile: boolean;
  hasPromise: boolean;
  icpCount: number;
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
  const [selectedTypes, setSelectedTypes] = useState<Set<GenerationType>>(
    typeParam ? new Set([typeParam]) : new Set()
  );
  const [generationResults, setGenerationResults] = useState<{
    offer?: boolean;
    lp?: boolean;
    ads?: boolean;
  }>({});

  useEffect(() => {
    fetchEligibleClients();
  }, []);

  useEffect(() => {
    if (clientIdParam && !selectedClientId) {
      setSelectedClientId(clientIdParam);
    }
  }, [clientIdParam]);

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
      supabase.from("icps").select("client_id").in("client_id", clientIds),
    ]);

    const profileSet = new Set(profilesRes.data?.map((p) => p.client_id) || []);
    const promiseSet = new Set(promisesRes.data?.map((p) => p.client_id) || []);
    const icpCountMap = new Map<string, number>();
    icpsRes.data?.forEach((icp) => {
      icpCountMap.set(icp.client_id, (icpCountMap.get(icp.client_id) || 0) + 1);
    });

    const clientsWithPPP = clientsData.map((client) => ({
      id: client.id,
      name: client.name,
      status: client.status,
      hasProfile: profileSet.has(client.id),
      hasPromise: promiseSet.has(client.id),
      icpCount: icpCountMap.get(client.id) || 0,
    }));

    setClients(clientsWithPPP);
    setIsLoading(false);
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

    setIsGenerating(true);
    setGenerationResults({});

    try {
      // Fetch all PPP data for the client
      const [profileRes, icpsRes, painsRes, promiseRes] = await Promise.all([
        supabase.from("client_profile").select("*").eq("client_id", selectedClientId).maybeSingle(),
        supabase.from("icps").select("*").eq("client_id", selectedClientId).order("sort_order"),
        supabase.from("icp_pains").select("*, icps(name)").eq("icps.client_id", selectedClientId),
        supabase.from("client_promise").select("*").eq("client_id", selectedClientId).maybeSingle(),
      ]);

      const pppData = {
        profile: profileRes.data,
        icps: icpsRes.data || [],
        pains: painsRes.data || [],
        promise: promiseRes.data,
      };

      const results: typeof generationResults = {};

      // Generate each selected type
      for (const type of selectedTypes) {
        try {
          const { data, error } = await supabase.functions.invoke("generate-content", {
            body: {
              type,
              clientId: selectedClientId,
              pppData,
            },
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
              Complete o Onboarding PPP de um cliente para poder gerar ofertas, LPs e anúncios com IA.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/onboarding">
                Ir para Onboarding PPP
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
            Selecione um cliente
          </CardTitle>
          <CardDescription>
            Apenas clientes com PPP concluído estão disponíveis
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
                      {client.icpCount} ICP{client.icpCount > 1 ? "s" : ""}
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
                {selectedClient.icpCount} ICP{selectedClient.icpCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Options */}
      {selectedClientId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              O que deseja gerar?
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
                    Gera uma oferta irresistível com promessa, mecanismo único, garantia, prova social e pilha de valor
                  </p>
                </div>
              </div>

              {/* Landing Page */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="lp"
                  checked={selectedTypes.has("lp")}
                  onCheckedChange={() => toggleType("lp")}
                />
                <div className="flex-1">
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Gera seções de LP com variantes (Direta, Consultiva, Agressiva) incluindo headline, subheadline, benefícios e CTA
                  </p>
                </div>
              </div>

              {/* Ads */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="ads"
                  checked={selectedTypes.has("ads")}
                  onCheckedChange={() => toggleType("ads")}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="ads"
                    className="flex items-center gap-2 font-medium cursor-pointer"
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
                    Gera 2 anúncios estáticos + 3 scripts de vídeo (Direto, Educacional, Caixinha de Perguntas)
                  </p>
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
    </div>
  );
}
