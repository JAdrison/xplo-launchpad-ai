import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching clients:", error);
      } else {
        setClients(data || []);
      }
      setIsLoading(false);
    }

    fetchClients();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e projetos</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/clients/new">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum cliente ainda</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Comece criando seu primeiro cliente para iniciar o processo de onboarding.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/clients/new">
                <Plus className="h-4 w-4" />
                Criar primeiro cliente
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Clients list */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{client.name}</h3>
                    {client.niche && (
                      <p className="text-sm text-muted-foreground truncate">{client.niche}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANTS[client.status]}>
                    {STATUS_LABELS[client.status]}
                  </Badge>
                </div>
                {client.notes && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{client.notes}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/clients/${client.id}`}>Ver detalhes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
