import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Users,
  Play,
  Pencil,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Package,
  Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface ClientWithOnboarding extends Client {
  client_profile: { product_name: string | null } | null;
  icps: { id: string; name: string }[];
  client_promise: { promise_text: string | null } | null;
  progress: number;
  completedSteps: number;
}

const STATUS_LABELS: Record<Client["status"], string> = {
  draft: "Pendente",
  ppp_in_progress: "Em andamento",
  ppp_completed: "X1 Concluído",
  offer_generated: "Oferta gerada",
  assets_generated: "Assets gerados",
  archived: "Arquivado",
};

const STATUS_VARIANTS: Record<Client["status"], "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  ppp_in_progress: "outline",
  ppp_completed: "default",
  offer_generated: "default",
  assets_generated: "default",
  archived: "secondary",
};

type FilterTab = "all" | "in_progress" | "completed" | "pending";

export function OnboardingDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<ClientWithOnboarding[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    fetchClientsWithOnboarding();
  }, []);

  const fetchClientsWithOnboarding = async () => {
    setIsLoading(true);

    // Fetch all clients
    const { data: clientsData, error } = await supabase
      .from("clients")
      .select("*")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      setIsLoading(false);
      return;
    }

    if (!clientsData || clientsData.length === 0) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    // Fetch related data for each client
    const clientIds = clientsData.map((c) => c.id);

    const [profilesRes, icpsRes, promisesRes] = await Promise.all([
      supabase
        .from("client_profile")
        .select("client_id, product_name, main_pain, current_revenue, monthly_investment, initial_traffic_investment, region")
        .in("client_id", clientIds),
      supabase.from("icps").select("id, name, client_id").in("client_id", clientIds),
      supabase.from("client_promise").select("client_id, promise_text").in("client_id", clientIds),
    ]);

    const profilesMap = new Map(profilesRes.data?.map((p) => [p.client_id, p]) || []);
    const icpsMap = new Map<string, { id: string; name: string }[]>();
    icpsRes.data?.forEach((icp) => {
      if (!icpsMap.has(icp.client_id)) {
        icpsMap.set(icp.client_id, []);
      }
      icpsMap.get(icp.client_id)!.push({ id: icp.id, name: icp.name });
    });
    const promisesMap = new Map(promisesRes.data?.map((p) => [p.client_id, p]) || []);

    // Calculate progress for each client (7 steps)
    const clientsWithProgress = clientsData.map((client) => {
      const profile = profilesMap.get(client.id);
      const icps = icpsMap.get(client.id) || [];
      const promise = promisesMap.get(client.id);

      let completedSteps = 0;

      // Step 1: Empresa (niche ou region)
      if (client.niche || (profile?.region && profile.region.length > 0)) {
        completedSteps++;
      }

      // Step 2: Produto
      if (profile?.product_name) {
        completedSteps++;
      }

      // Step 3: Dores (main_pain no profile)
      if (profile?.main_pain) {
        completedSteps++;
      }

      // Step 4: Mercado
      if (profile?.current_revenue || profile?.monthly_investment || profile?.initial_traffic_investment) {
        completedSteps++;
      }

      // Step 5: Promessa
      if (promise?.promise_text) {
        completedSteps++;
      }

      // Step 6: Público (ICPs)
      if (icps.length > 0) {
        completedSteps++;
      }

      // Step 7: Revisão/Complete
      if (["ppp_completed", "offer_generated", "assets_generated"].includes(client.status)) {
        completedSteps = 7;
      }

      return {
        ...client,
        client_profile: profile ? { product_name: profile.product_name } : null,
        icps,
        client_promise: promise ? { promise_text: promise.promise_text } : null,
        progress: (completedSteps / 7) * 100,
        completedSteps,
      };
    });

    setClients(clientsWithProgress);
    setIsLoading(false);
  };

  const getFilteredClients = () => {
    switch (activeTab) {
      case "in_progress":
        return clients.filter((c) => c.status === "ppp_in_progress" || (c.status === "draft" && c.completedSteps > 0));
      case "completed":
        return clients.filter((c) => ["ppp_completed", "offer_generated", "assets_generated"].includes(c.status));
      case "pending":
        return clients.filter((c) => c.status === "draft" && c.completedSteps === 0);
      default:
        return clients;
    }
  };

  const getCounts = () => ({
    all: clients.length,
    in_progress: clients.filter((c) => c.status === "ppp_in_progress" || (c.status === "draft" && c.completedSteps > 0)).length,
    completed: clients.filter((c) => ["ppp_completed", "offer_generated", "assets_generated"].includes(c.status)).length,
    pending: clients.filter((c) => c.status === "draft" && c.completedSteps === 0).length,
  });

  const filteredClients = getFilteredClients();
  const counts = getCounts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Onboarding X1</h1>
          <p className="text-muted-foreground">Acompanhe o processo de discovery dos seus clientes</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Onboarding X1</h1>
        <p className="text-muted-foreground">Acompanhe o processo de discovery dos seus clientes</p>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum cliente cadastrado</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Crie um cliente para iniciar o processo de Onboarding X1.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/clients/new">
                <Users className="h-4 w-4" />
                Novo Cliente
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="gap-2">
              Todos
              <Badge variant="secondary" className="ml-1 text-xs">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-2">
              <Clock className="h-4 w-4" />
              Em andamento
              <Badge variant="secondary" className="ml-1 text-xs">{counts.in_progress}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Concluídos
              <Badge variant="secondary" className="ml-1 text-xs">{counts.completed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Pendentes
              <Badge variant="secondary" className="ml-1 text-xs">{counts.pending}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {filteredClients.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum cliente nesta categoria.
                </CardContent>
              </Card>
            ) : (
              filteredClients.map((client) => (
                <ClientOnboardingCard
                  key={client.id}
                  client={client}
                  onNavigate={() => navigate(`/clients/${client.id}`)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface ClientOnboardingCardProps {
  client: ClientWithOnboarding;
  onNavigate: () => void;
}

function ClientOnboardingCard({ client, onNavigate }: ClientOnboardingCardProps) {
  const navigate = useNavigate();

  const isCompleted = ["ppp_completed", "offer_generated", "assets_generated"].includes(client.status);
  const isInProgress = client.status === "ppp_in_progress" || (client.status === "draft" && client.completedSteps > 0);
  const isPending = client.status === "draft" && client.completedSteps === 0;

  const handleStartOnboarding = async () => {
    if (client.status === "draft") {
      await supabase
        .from("clients")
        .update({ status: "ppp_in_progress" })
        .eq("id", client.id);
    }
    navigate(`/onboarding?client=${client.id}`);
  };

  const handleContinueOnboarding = () => {
    const nextStep = client.completedSteps + 1;
    navigate(`/onboarding?client=${client.id}&step=${Math.min(nextStep, 7)}`);
  };

  const handleEditOnboarding = () => {
    navigate(`/onboarding?client=${client.id}&step=1`);
  };

  const handleGenerateWithAI = () => {
    navigate(`/generator?client=${client.id}`);
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{client.name}</h3>
                {client.client_profile?.product_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {client.client_profile.product_name}
                  </p>
                )}
              </div>
              <Badge variant={STATUS_VARIANTS[client.status]}>
                {STATUS_LABELS[client.status]}
              </Badge>
            </div>

            {/* Progress */}
            {!isPending && (
              <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{client.completedSteps} de 7 etapas</span>
              </div>
                <Progress value={client.progress} className="h-2" />
              </div>
            )}

            {/* Info pills */}
            <div className="flex flex-wrap gap-2 text-sm">
              {client.icps.length > 0 && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {client.icps.length} ICP{client.icps.length > 1 ? "s" : ""}
                </span>
              )}
              {client.client_promise?.promise_text && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" />
                  Promessa definida
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:flex-col">
            {isPending && (
              <Button onClick={handleStartOnboarding} size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Iniciar Onboarding
              </Button>
            )}

            {isInProgress && (
              <>
                <Button onClick={handleContinueOnboarding} size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  Continuar
                </Button>
                <Button variant="outline" onClick={handleEditOnboarding} size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </>
            )}

            {isCompleted && (
              <>
                <Button variant="outline" onClick={onNavigate} size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Ver Detalhes
                </Button>
                <Button variant="outline" onClick={handleEditOnboarding} size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar X1
                </Button>
                <Button onClick={handleGenerateWithAI} size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
