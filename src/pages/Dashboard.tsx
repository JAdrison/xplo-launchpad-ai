import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  Sparkles,
  Megaphone,
  Plus,
  ClipboardList,
  AlertCircle,
  Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  PortfolioEvolutionChart,
  type PortfolioPoint,
} from "@/components/dashboard/PortfolioEvolutionChart";
import {
  OnboardingStatusDonut,
  type StatusSlice,
} from "@/components/dashboard/OnboardingStatusDonut";
import { CrmFunnelChart, type FunnelStage } from "@/components/dashboard/CrmFunnelChart";
import { InsightsPanel, type InsightItem } from "@/components/dashboard/InsightsPanel";

type ClientStatus =
  | "draft"
  | "ppp_in_progress"
  | "ppp_completed"
  | "offer_generated"
  | "assets_generated"
  | "archived";

interface ClientRow {
  id: string;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
  name: string;
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  draft: "hsl(260, 10%, 70%)",
  ppp_in_progress: "hsl(262, 83%, 72%)",
  ppp_completed: "hsl(262, 83%, 58%)",
  offer_generated: "hsl(262, 83%, 45%)",
  assets_generated: "hsl(262, 83%, 32%)",
  archived: "hsl(260, 10%, 85%)",
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  draft: "Rascunho",
  ppp_in_progress: "Em PPP",
  ppp_completed: "PPP OK",
  offer_generated: "Oferta",
  assets_generated: "Ativos",
  archived: "Arquivado",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [offersThisMonth, setOffersThisMonth] = useState(0);
  const [offersPrevMonth, setOffersPrevMonth] = useState(0);
  const [offersTotal, setOffersTotal] = useState(0);
  const [adsThisMonth, setAdsThisMonth] = useState(0);
  const [adsPrevMonth, setAdsPrevMonth] = useState(0);
  const [adsTotal, setAdsTotal] = useState(0);
  const [clientsWithoutOffers, setClientsWithoutOffers] = useState<ClientRow[]>([]);
  const [clientsWithoutAds, setClientsWithoutAds] = useState<ClientRow[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [pipelineName, setPipelineName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const now = new Date();
        const thisMonthStart = startOfMonth(now).toISOString();
        const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).toISOString();

        // Clients (full set for portfolio chart + status donut + deltas)
        const clientsRes = await supabase
          .from("clients")
          .select("id, status, created_at, updated_at, name")
          .order("created_at", { ascending: false });

        if (clientsRes.error) throw clientsRes.error;
        const allClients = (clientsRes.data || []) as ClientRow[];
        setClients(allClients);

        // Offers & ads counts (this month + prev month + total)
        const [
          offersTotalRes,
          offersThisRes,
          offersPrevRes,
          adsTotalRes,
          adsThisRes,
          adsPrevRes,
          offerDocsRes,
          adsByClientRes,
        ] = await Promise.all([
          supabase.from("client_offer_documents").select("id", { count: "exact", head: true }),
          supabase
            .from("client_offer_documents")
            .select("id", { count: "exact", head: true })
            .gte("created_at", thisMonthStart),
          supabase
            .from("client_offer_documents")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevMonthStart)
            .lt("created_at", thisMonthStart),
          supabase.from("ads").select("id", { count: "exact", head: true }),
          supabase
            .from("ads")
            .select("id", { count: "exact", head: true })
            .gte("created_at", thisMonthStart),
          supabase
            .from("ads")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevMonthStart)
            .lt("created_at", thisMonthStart),
          supabase.from("client_offer_documents").select("client_id"),
          supabase.from("ads").select("client_id"),
        ]);

        setOffersTotal(offersTotalRes.count || 0);
        setOffersThisMonth(offersThisRes.count || 0);
        setOffersPrevMonth(offersPrevRes.count || 0);
        setAdsTotal(adsTotalRes.count || 0);
        setAdsThisMonth(adsThisRes.count || 0);
        setAdsPrevMonth(adsPrevRes.count || 0);

        // Insights: clients without offers / without ads
        const clientIdsWithOffers = new Set((offerDocsRes.data || []).map((r: any) => r.client_id));
        const clientIdsWithAds = new Set((adsByClientRes.data || []).map((r: any) => r.client_id));

        setClientsWithoutOffers(
          allClients.filter(
            (c) =>
              c.status !== "archived" &&
              c.status !== "draft" &&
              !clientIdsWithOffers.has(c.id),
          ),
        );
        setClientsWithoutAds(
          allClients.filter(
            (c) =>
              c.status !== "archived" &&
              clientIdsWithOffers.has(c.id) &&
              !clientIdsWithAds.has(c.id),
          ),
        );

        // CRM funnel: primary pipeline + columns + deal counts
        const pipelinesRes = await supabase
          .from("pipelines")
          .select("id, name")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(1);

        if (pipelinesRes.data && pipelinesRes.data.length > 0) {
          const pipeline = pipelinesRes.data[0];
          setPipelineName(pipeline.name);

          const [columnsRes, dealsRes] = await Promise.all([
            supabase
              .from("pipeline_columns")
              .select("id, name, sort_order")
              .eq("pipeline_id", pipeline.id)
              .order("sort_order", { ascending: true }),
            supabase
              .from("deals")
              .select("column_id, status")
              .eq("pipeline_id", pipeline.id)
              .eq("status", "active"),
          ]);

          const columns = columnsRes.data || [];
          const counts = new Map<string, number>();
          (dealsRes.data || []).forEach((d: any) => {
            counts.set(d.column_id, (counts.get(d.column_id) || 0) + 1);
          });

          setFunnel(
            columns.map((c: any) => ({
              name: c.name,
              count: counts.get(c.id) || 0,
            })),
          );
        } else {
          setFunnel([]);
          setPipelineName(null);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        toast({
          title: "Erro ao carregar dashboard",
          description: "Não foi possível carregar todas as métricas.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, []);

  // Derived metrics
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const activeClients = clients.filter((c) => c.status !== "archived");
  const activeClientsPrev = clients.filter(
    (c) => c.status !== "archived" && new Date(c.created_at) < thisMonthStart,
  );
  const activeClientsDelta = pct(activeClients.length, activeClientsPrev.length);

  const inOnboarding = clients.filter(
    (c) => c.status === "draft" || c.status === "ppp_in_progress",
  );
  const inOnboardingPrev = clients.filter(
    (c) =>
      (c.status === "draft" || c.status === "ppp_in_progress") &&
      new Date(c.updated_at) < thisMonthStart &&
      new Date(c.updated_at) >= prevMonthStart,
  );
  const inOnboardingDelta = pct(inOnboarding.length, inOnboardingPrev.length);

  // Portfolio chart: last 6 months
  const portfolioData: PortfolioPoint[] = useMemo(() => {
    const buckets: PortfolioPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ month: MONTH_LABELS[d.getMonth()], clientes: 0 });
    }
    const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    clients.forEach((c) => {
      const created = new Date(c.created_at);
      if (created < firstMonth) return;
      const idx =
        (created.getFullYear() - firstMonth.getFullYear()) * 12 +
        (created.getMonth() - firstMonth.getMonth());
      if (idx >= 0 && idx < 6) buckets[idx].clientes += 1;
    });
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients]);

  // Status donut
  const statusSlices: StatusSlice[] = useMemo(() => {
    const counts: Record<ClientStatus, number> = {
      draft: 0,
      ppp_in_progress: 0,
      ppp_completed: 0,
      offer_generated: 0,
      assets_generated: 0,
      archived: 0,
    };
    clients.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return (Object.keys(counts) as ClientStatus[])
      .filter((k) => counts[k] > 0 && k !== "archived")
      .map((k) => ({
        name: STATUS_LABELS[k],
        value: counts[k],
        color: STATUS_COLORS[k],
      }));
  }, [clients]);

  // Insights (static rules)
  const stagnantClients = clients.filter((c) => {
    if (c.status !== "draft" && c.status !== "ppp_in_progress") return false;
    const diff = now.getTime() - new Date(c.updated_at).getTime();
    return diff > 7 * 24 * 60 * 60 * 1000;
  });

  const insights: InsightItem[] = [];
  if (stagnantClients.length > 0) {
    insights.push({
      id: "stagnant",
      icon: AlertCircle,
      title: `${stagnantClients.length} cliente${stagnantClients.length > 1 ? "s" : ""} parado${stagnantClients.length > 1 ? "s" : ""} há 7+ dias`,
      description: `Onboarding sem progresso recente. Retome o contato ou reinicie checkpoints.`,
      cta: "Ver clientes",
      href: "/clients",
      tone: "warning",
    });
  }
  if (clientsWithoutOffers.length > 0) {
    insights.push({
      id: "no-offers",
      icon: Rocket,
      title: `${clientsWithoutOffers.length} pronto${clientsWithoutOffers.length > 1 ? "s" : ""} para gerar ofertas`,
      description: `Clientes com PPP concluído sem banco de ofertas criado ainda.`,
      cta: "Gerar ofertas",
      href: "/generator",
      tone: "info",
    });
  }
  if (clientsWithoutAds.length > 0) {
    insights.push({
      id: "no-ads",
      icon: Megaphone,
      title: `${clientsWithoutAds.length} cliente${clientsWithoutAds.length > 1 ? "s" : ""} sem anúncios`,
      description: `Já têm ofertas mas ainda não geraram criativos de campanha.`,
      cta: "Gerar anúncios",
      href: "/generator",
      tone: "success",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>
          <p className="text-muted-foreground">Visão geral do seu workspace em tempo real</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/onboarding">
              <ClipboardList className="h-4 w-4" />
              Iniciar PPP
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link to="/clients/new">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Clientes Ativos"
          value={activeClients.length}
          icon={Users}
          deltaPct={activeClientsDelta}
          isLoading={isLoading}
          accent="primary"
        />
        <KpiCard
          label="Em Onboarding"
          value={inOnboarding.length}
          icon={ClipboardCheck}
          deltaPct={inOnboardingDelta}
          isLoading={isLoading}
          accent="warning"
        />
        <KpiCard
          label="Ofertas Geradas"
          value={offersTotal}
          icon={Sparkles}
          deltaPct={pct(offersThisMonth, offersPrevMonth)}
          isLoading={isLoading}
          accent="success"
        />
        <KpiCard
          label="Anúncios Gerados"
          value={adsTotal}
          icon={Megaphone}
          deltaPct={pct(adsThisMonth, adsPrevMonth)}
          isLoading={isLoading}
          accent="primary"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PortfolioEvolutionChart data={portfolioData} isLoading={isLoading} />
        </div>
        <OnboardingStatusDonut data={statusSlices} isLoading={isLoading} />
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CrmFunnelChart data={funnel} isLoading={isLoading} pipelineName={pipelineName} />
        </div>
        <InsightsPanel insights={insights} isLoading={isLoading} />
      </div>
    </div>
  );
}
