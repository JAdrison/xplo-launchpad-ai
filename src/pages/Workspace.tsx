import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileStack, FileText, Layout, Video, ArrowRight, Building2, Plus,
  Link2, Check, Sparkles, Play, Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GenerateAIDialog } from "@/components/workspace/GenerateAIDialog";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type ClientStatus = Tables<"clients">["status"];

interface ClientCard {
  id: string;
  name: string;
  niche: string | null;
  status: ClientStatus;
  productName: string | null;
  completedSteps: number; // 0..7
  offersCount: number;
  landingPagesCount: number;
  adsCount: number;
}

type StateLevel = "pending" | "in_progress" | "completed";
type FilterTab = "all" | "in_progress" | "completed" | "with_assets";

const STATE_INFO: Record<StateLevel, { label: string; dot: string }> = {
  pending:     { label: "Pendente",       dot: "bg-slate-400" },
  in_progress: { label: "Em onboarding",  dot: "bg-amber-500" },
  completed:   { label: "X1 concluído",   dot: "bg-emerald-500" },
};

function getState(c: ClientCard): StateLevel {
  if (["ppp_completed", "offer_generated", "assets_generated"].includes(c.status)) return "completed";
  if (c.status === "ppp_in_progress" || (c.status === "draft" && c.completedSteps > 0)) return "in_progress";
  return "pending";
}

export default function Workspace() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<ClientCard[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [tab, setTab] = useState<FilterTab>("all");
  const [copied, setCopied] = useState(false);
  const [genClient, setGenClient] = useState<{ id: string; name: string } | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    const { data: clients, error } = await supabase
      .from("clients")
      .select("id, name, niche, status")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar clientes");
      setIsLoading(false);
      return;
    }
    if (!clients || clients.length === 0) {
      setCards([]);
      setIsLoading(false);
      return;
    }

    const ids = clients.map((c) => c.id);
    const [profilesRes, icpsRes, promisesRes] = await Promise.all([
      supabase.from("client_profile")
        .select("client_id, product_name, main_pain, current_revenue, monthly_investment, initial_traffic_investment, region")
        .in("client_id", ids),
      supabase.from("icps").select("client_id").in("client_id", ids),
      supabase.from("client_promise").select("client_id, promise_text").in("client_id", ids),
    ]);

    const profileMap = new Map(profilesRes.data?.map((p) => [p.client_id, p]) || []);
    const icpsCount = new Map<string, number>();
    icpsRes.data?.forEach((i) => icpsCount.set(i.client_id, (icpsCount.get(i.client_id) ?? 0) + 1));
    const promiseMap = new Map(promisesRes.data?.map((p) => [p.client_id, p]) || []);

    // Counts em paralelo
    const counts = await Promise.all(clients.map(async (c) => {
      const [oH, oD, l, a] = await Promise.all([
        supabase.from("offers_hormozi").select("id", { count: "exact", head: true }).eq("client_id", c.id),
        supabase.from("client_offer_documents").select("id", { count: "exact", head: true }).eq("client_id", c.id),
        supabase.from("landing_pages").select("id", { count: "exact", head: true }).eq("client_id", c.id),
        supabase.from("ads").select("id", { count: "exact", head: true }).eq("client_id", c.id),
      ]);
      return { id: c.id, o: (oH.count ?? 0) + (oD.count ?? 0), l: l.count ?? 0, a: a.count ?? 0 };
    }));
    const countMap = new Map(counts.map((x) => [x.id, x]));

    const result: ClientCard[] = clients.map((c) => {
      const profile = profileMap.get(c.id);
      const icpN = icpsCount.get(c.id) ?? 0;
      const promise = promiseMap.get(c.id);
      let steps = 0;
      if (c.niche || (profile?.region && profile.region.length > 0)) steps++;
      if (profile?.product_name) steps++;
      if (profile?.main_pain) steps++;
      if (profile?.current_revenue || profile?.monthly_investment || profile?.initial_traffic_investment) steps++;
      if (promise?.promise_text) steps++;
      if (icpN > 0) steps++;
      if (["ppp_completed", "offer_generated", "assets_generated"].includes(c.status)) steps = 7;
      const cnt = countMap.get(c.id);
      return {
        id: c.id,
        name: c.name,
        niche: c.niche,
        status: c.status,
        productName: profile?.product_name ?? null,
        completedSteps: steps,
        offersCount: cnt?.o ?? 0,
        landingPagesCount: cnt?.l ?? 0,
        adsCount: cnt?.a ?? 0,
      };
    });
    setCards(result);
    setIsLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/register`);
    setCopied(true);
    toast.success("Link copiado! Envie para o cliente se cadastrar.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async (c: ClientCard) => {
    if (c.status === "draft") {
      await supabase.from("clients").update({ status: "ppp_in_progress" }).eq("id", c.id);
    }
    navigate(`/onboarding?client=${c.id}`);
  };

  const totals = {
    offers: cards.reduce((s, c) => s + c.offersCount, 0),
    lps: cards.reduce((s, c) => s + c.landingPagesCount, 0),
    ads: cards.reduce((s, c) => s + c.adsCount, 0),
    clients: cards.length,
  };

  const visible = cards
    .filter((c) => selectedClient === "all" || c.id === selectedClient)
    .filter((c) => {
      if (tab === "all") return true;
      const st = getState(c);
      if (tab === "in_progress") return st === "in_progress" || st === "pending";
      if (tab === "completed") return st === "completed";
      if (tab === "with_assets") return c.offersCount + c.landingPagesCount + c.adsCount > 0;
      return true;
    });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-40" /><Skeleton className="mt-2 h-4 w-64" /></div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Workspace</h1>
            <p className="text-muted-foreground">Seus clientes, onboarding e ativos em um só lugar</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyLink} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              Copiar link de registro
            </Button>
            <Button asChild className="gap-2">
              <Link to="/clients/new"><Plus className="h-4 w-4" />Novo Cliente</Link>
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {cards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4"><FileStack className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="mt-4 text-lg font-semibold">Nenhum cliente cadastrado</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Cadastre seu primeiro cliente para começar.
              </p>
              <Button asChild className="mt-6 gap-2">
                <Link to="/clients/new">Cadastrar Cliente<ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryTile icon={<Users className="h-5 w-5 text-primary" />} value={totals.clients} label="Clientes ativos" />
              <SummaryTile icon={<FileText className="h-5 w-5 text-primary" />} value={totals.offers} label="Ofertas geradas" />
              <SummaryTile icon={<Layout className="h-5 w-5 text-primary" />} value={totals.lps} label="Landing pages" />
              <SummaryTile icon={<Video className="h-5 w-5 text-primary" />} value={totals.ads} label="Anúncios" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="in_progress">Em onboarding</TabsTrigger>
                  <TabsTrigger value="completed">Concluídos</TabsTrigger>
                  <TabsTrigger value="with_assets">Com ativos</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Cliente:</span>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {cards.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cards */}
            {visible.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum cliente neste filtro.
              </CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((c) => {
                  const state = getState(c);
                  const info = STATE_INFO[state];
                  return (
                    <Card key={c.id} className="overflow-hidden hover:border-primary/40 transition-colors">
                      <CardContent className="p-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 border-b p-4">
                          <div className="rounded-full bg-muted p-2 shrink-0">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">{c.name}</h3>
                            {(c.productName || c.niche) && (
                              <p className="text-xs text-muted-foreground truncate">
                                {c.productName ?? c.niche}
                              </p>
                            )}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", info.dot)} />
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              {info.label} · {c.completedSteps}/7 etapas
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Counts */}
                        <div className="p-4 space-y-3">
                          <CountRow icon={<FileText className="h-4 w-4 text-muted-foreground" />} label="Ofertas" n={c.offersCount} />
                          <CountRow icon={<Layout className="h-4 w-4 text-muted-foreground" />} label="Landing Pages" n={c.landingPagesCount} />
                          <CountRow icon={<Video className="h-4 w-4 text-muted-foreground" />} label="Anúncios" n={c.adsCount} />
                        </div>

                        {/* Actions */}
                        <div className="border-t p-3 flex gap-2">
                          {state === "pending" && (
                            <Button size="sm" className="flex-1 gap-2" onClick={() => handleStart(c)}>
                              <Play className="h-4 w-4" />Iniciar onboarding
                            </Button>
                          )}
                          {state === "in_progress" && (
                            <Button size="sm" className="flex-1 gap-2" onClick={() => navigate(`/onboarding?client=${c.id}`)}>
                              <Play className="h-4 w-4" />Continuar
                            </Button>
                          )}
                          {state === "completed" && (
                            <Button size="sm" className="flex-1 gap-2" onClick={() => setGenClient({ id: c.id, name: c.name })}>
                              <Sparkles className="h-4 w-4" />Gerar com IA
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" asChild className="gap-1">
                            <Link to={`/clients/${c.id}`}>Ver<ArrowRight className="h-4 w-4" /></Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        <GenerateAIDialog
          clientId={genClient?.id ?? null}
          clientName={genClient?.name}
          open={!!genClient}
          onOpenChange={(o) => { if (!o) setGenClient(null); }}
          onGenerated={fetchAll}
        />
      </div>
    </TooltipProvider>
  );
}

function SummaryTile({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card><CardContent className="flex items-center gap-4 p-4">
      <div className="rounded-full bg-primary/10 p-3">{icon}</div>
      <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
    </CardContent></Card>
  );
}

function CountRow({ icon, label, n }: { icon: React.ReactNode; label: string; n: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">{icon}<span className="text-sm">{label}</span></div>
      <Badge variant={n > 0 ? "default" : "secondary"}>{n}</Badge>
    </div>
  );
}
