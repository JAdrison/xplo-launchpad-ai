import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ClipboardCheck, FileStack, Sparkles, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

const STATUS_LABELS: Record<Client["status"], string> = {
  draft: "Rascunho",
  ppp_in_progress: "PPP em andamento",
  ppp_completed: "PPP concluído",
  offer_generated: "Oferta gerada",
  assets_generated: "Assets gerados",
  archived: "Arquivado",
};

const STATUS_VARIANTS: Record<Client["status"], "default" | "secondary" | "outline"> = {
  draft: "secondary",
  ppp_in_progress: "outline",
  ppp_completed: "default",
  offer_generated: "default",
  assets_generated: "default",
  archived: "secondary",
};

interface DashboardStats {
  totalClients: number;
  inOnboarding: number;
  pppCompleted: number;
  assetsGenerated: number;
}

const quickActions = [
  { name: "Novo Cliente", href: "/clients/new", icon: Plus },
  { name: "Iniciar PPP", href: "/onboarding", icon: ClipboardCheck },
  { name: "Gerar Oferta", href: "/generator", icon: Sparkles },
];

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    inOnboarding: 0,
    pppCompleted: 0,
    assetsGenerated: 0,
  });
  const [recentClients, setRecentClients] = useState<Client[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [
          totalClientsRes,
          inOnboardingRes,
          pppCompletedRes,
          offersRes,
          landingPagesRes,
          adsRes,
          recentClientsRes,
        ] = await Promise.all([
          // Total clients
          supabase.from("clients").select("id", { count: "exact", head: true }),
          // In onboarding
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "ppp_in_progress"),
          // PPP completed
          supabase.from("clients").select("id", { count: "exact", head: true }).in("status", ["ppp_completed", "offer_generated", "assets_generated"]),
          // Assets counts
          supabase.from("offers_hormozi").select("id", { count: "exact", head: true }),
          supabase.from("landing_pages").select("id", { count: "exact", head: true }),
          supabase.from("ads").select("id", { count: "exact", head: true }),
          // Recent clients
          supabase.from("clients").select("*").order("updated_at", { ascending: false }).limit(5),
        ]);

        // Check for errors
        const errors = [
          totalClientsRes.error,
          inOnboardingRes.error,
          pppCompletedRes.error,
          offersRes.error,
          landingPagesRes.error,
          adsRes.error,
          recentClientsRes.error,
        ].filter(Boolean);

        if (errors.length > 0) {
          console.error("Dashboard fetch errors:", errors);
          toast({
            title: "Erro ao carregar métricas",
            description: "Não foi possível carregar todas as métricas do dashboard",
            variant: "destructive",
          });
        }

        // Calculate assets total
        const assetsTotal = 
          (offersRes.count || 0) + 
          (landingPagesRes.count || 0) + 
          (adsRes.count || 0);

        setStats({
          totalClients: totalClientsRes.count || 0,
          inOnboarding: inOnboardingRes.count || 0,
          pppCompleted: pppCompletedRes.count || 0,
          assetsGenerated: assetsTotal,
        });

        setRecentClients(recentClientsRes.data || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast({
          title: "Erro ao carregar dashboard",
          description: "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statsConfig = [
    {
      name: "Total de Clientes",
      value: stats.totalClients,
      icon: Users,
      description: "Cadastrados no sistema",
    },
    {
      name: "Em Onboarding",
      value: stats.inOnboarding,
      icon: ClipboardCheck,
      description: "PPP em andamento",
    },
    {
      name: "PPP Concluídos",
      value: stats.pppCompleted,
      icon: Sparkles,
      description: "Prontos para geração",
    },
    {
      name: "Ativos Gerados",
      value: stats.assetsGenerated,
      icon: FileStack,
      description: "LPs e anúncios criados",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu workspace</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Comece por aqui</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Button key={action.name} asChild variant="outline" className="gap-2">
              <Link to={action.href}>
                <action.icon className="h-4 w-4" />
                {action.name}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Recent clients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Últimos Clientes</CardTitle>
            <CardDescription>Clientes editados recentemente</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/clients">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum cliente cadastrado ainda
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/clients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeiro cliente
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{client.name}</p>
                    {client.niche && (
                      <p className="text-sm text-muted-foreground truncate">{client.niche}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant={STATUS_VARIANTS[client.status]}>
                      {STATUS_LABELS[client.status]}
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/clients/${client.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
