import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ClipboardCheck, FileStack, Sparkles, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    name: "Total de Clientes",
    value: "0",
    icon: Users,
    description: "Cadastrados no sistema",
  },
  {
    name: "Em Onboarding",
    value: "0",
    icon: ClipboardCheck,
    description: "PPP em andamento",
  },
  {
    name: "PPP Concluídos",
    value: "0",
    icon: Sparkles,
    description: "Prontos para geração",
  },
  {
    name: "Ativos Gerados",
    value: "0",
    icon: FileStack,
    description: "LPs e anúncios criados",
  },
];

const quickActions = [
  { name: "Novo Cliente", href: "/clients/new", icon: Plus },
  { name: "Iniciar PPP", href: "/onboarding", icon: ClipboardCheck },
  { name: "Gerar Oferta", href: "/generator", icon: Sparkles },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu workspace</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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

      {/* Recent clients placeholder */}
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
        </CardContent>
      </Card>
    </div>
  );
}
