import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Generator() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Gerador IA</h1>
        <p className="text-muted-foreground">Gere ofertas, LPs e anúncios com IA</p>
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Configure sua API Key</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Para usar o gerador IA, configure sua chave de API nas configurações.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link to="/settings">
              Ir para Configurações
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
