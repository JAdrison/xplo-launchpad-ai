import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Clients() {
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

      {/* Empty state */}
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
    </div>
  );
}
