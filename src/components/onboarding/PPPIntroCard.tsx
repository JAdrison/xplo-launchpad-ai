import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, Target, ArrowRight, Info } from "lucide-react";

interface PPPIntroCardProps {
  onStart: () => void;
  clientName: string;
}

export function PPPIntroCard({ onStart, clientName }: PPPIntroCardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Onboarding X1
        </h1>
        <p className="text-muted-foreground">{clientName}</p>
      </div>

      {/* Intro Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            O que é o PPP?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            O PPP é a metodologia que usamos para entender profundamente seu negócio:
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Público */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">P - Público</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Quem são seus clientes ideais (ICPs)? Vamos definir até 3 perfis de cliente que você deseja atrair.
              </p>
            </div>

            {/* Problema */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-semibold text-lg">P - Problema</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Quais dores eles enfrentam? Vamos mapear as principais dores e consequências de cada ICP.
              </p>
            </div>

            {/* Promessa */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">P - Promessa</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                O que você promete resolver? Crie uma promessa clara e impactante para seus clientes.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Por que isso é importante?</strong> Essas informações serão usadas para gerar 
              ofertas irresistíveis, landing pages de alta conversão e anúncios personalizados com IA.
            </p>
          </div>

          <Button onClick={onStart} size="lg" className="w-full gap-2">
            Iniciar Onboarding
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
