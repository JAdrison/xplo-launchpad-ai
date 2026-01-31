import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileStack, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Assets() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Ativos</h1>
        <p className="text-muted-foreground">Landing pages e anúncios gerados</p>
      </div>

      {/* Empty state */}
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
