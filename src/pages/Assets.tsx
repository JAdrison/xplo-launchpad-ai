import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileStack, FileText, Layout, Video, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ClientAssets {
  id: string;
  name: string;
  offersCount: number;
  landingPagesCount: number;
  adsCount: number;
}

export default function Assets() {
  const [isLoading, setIsLoading] = useState(true);
  const [clientAssets, setClientAssets] = useState<ClientAssets[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setIsLoading(true);

    // Fetch all clients
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (!clients || clients.length === 0) {
      setClientAssets([]);
      setIsLoading(false);
      return;
    }

    // Fetch counts for each client
    const assetsPromises = clients.map(async (client) => {
      const [offersRes, lpsRes, adsRes] = await Promise.all([
        supabase
          .from("offers_hormozi")
          .select("id", { count: "exact", head: true })
          .eq("client_id", client.id),
        supabase
          .from("landing_pages")
          .select("id", { count: "exact", head: true })
          .eq("client_id", client.id),
        supabase
          .from("ads")
          .select("id", { count: "exact", head: true })
          .eq("client_id", client.id),
      ]);

      return {
        id: client.id,
        name: client.name,
        offersCount: offersRes.count || 0,
        landingPagesCount: lpsRes.count || 0,
        adsCount: adsRes.count || 0,
      };
    });

    const results = await Promise.all(assetsPromises);
    setClientAssets(results);
    setIsLoading(false);
  };

  const filteredAssets = selectedClient === "all"
    ? clientAssets
    : clientAssets.filter((c) => c.id === selectedClient);

  const hasAnyAssets = clientAssets.some(
    (c) => c.offersCount > 0 || c.landingPagesCount > 0 || c.adsCount > 0
  );

  const totalOffers = clientAssets.reduce((sum, c) => sum + c.offersCount, 0);
  const totalLPs = clientAssets.reduce((sum, c) => sum + c.landingPagesCount, 0);
  const totalAds = clientAssets.reduce((sum, c) => sum + c.adsCount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (clientAssets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Ativos</h1>
          <p className="text-muted-foreground">Landing pages e anúncios gerados</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <FileStack className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum cliente cadastrado</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Cadastre seu primeiro cliente para começar a gerar ofertas e ativos.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/clients/new">
                Cadastrar Cliente
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAnyAssets) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Ativos</h1>
          <p className="text-muted-foreground">Landing pages e anúncios gerados</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <FileStack className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum ativo gerado</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Complete o Onboarding X1 e gere ofertas para criar seus primeiros ativos.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/clients">
                Ir para Clientes
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Ativos</h1>
        <p className="text-muted-foreground">Landing pages e anúncios gerados</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOffers}</p>
              <p className="text-sm text-muted-foreground">Ofertas Geradas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Layout className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLPs}</p>
              <p className="text-sm text-muted-foreground">Landing Pages</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAds}</p>
              <p className="text-sm text-muted-foreground">Anúncios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Filtrar por cliente:</span>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clientAssets.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((client) => {
          const hasAssets =
            client.offersCount > 0 || client.landingPagesCount > 0 || client.adsCount > 0;

          if (!hasAssets) return null;

          return (
            <Card key={client.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 border-b p-4">
                  <div className="rounded-full bg-muted p-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold truncate">{client.name}</h3>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Ofertas</span>
                    </div>
                    <Badge variant={client.offersCount > 0 ? "default" : "secondary"}>
                      {client.offersCount}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Landing Pages</span>
                    </div>
                    <Badge variant={client.landingPagesCount > 0 ? "default" : "secondary"}>
                      {client.landingPagesCount}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Anúncios</span>
                    </div>
                    <Badge variant={client.adsCount > 0 ? "default" : "secondary"}>
                      {client.adsCount}
                    </Badge>
                  </div>
                </div>

                <div className="border-t p-3">
                  <Button asChild variant="ghost" className="w-full gap-2">
                    <Link to={`/clients/${client.id}`}>
                      Ver detalhes
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
