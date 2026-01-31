import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Onboarding() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Onboarding PPP</h1>
        <p className="text-muted-foreground">Processo de discovery em 5 etapas</p>
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Selecione um cliente</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Para iniciar o onboarding PPP, primeiro selecione ou crie um cliente.
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
