import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, DollarSign, ShoppingCart, Receipt, TrendingUp, Megaphone, Users, CalendarCheck, ShoppingBag, Loader2 } from "lucide-react";
import { useVendas, variacaoPct } from "@/hooks/useVendas";
import { MonthSelector } from "@/components/admin/vendas/MonthSelector";
import { MetricCard } from "@/components/admin/vendas/MetricCard";
import { ClientesAtivosTable } from "@/components/admin/vendas/ClientesAtivosTable";
import { EvolucaoChart } from "@/components/admin/vendas/EvolucaoChart";
import { formatBRL } from "@/lib/vendasFormat";

const MASK_KEY = "vendas:masked";

export default function AdminVendas() {
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [ano, setAno] = useState(today.getFullYear());
  const [masked, setMasked] = useState<boolean>(true);

  const toggleMask = () => {
    const v = !masked;
    setMasked(v);
    localStorage.setItem(MASK_KEY, v ? "1" : "0");
  };

  const v = useVendas(mes, ano);
  const { metrics, evolucao } = v;

  if (v.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground">Acompanhe seu faturamento, MRR e métricas de custo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleMask} aria-label="Alternar visibilidade">
            {masked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <MonthSelector mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total de Vendas"
          value={formatBRL(metrics.totalAtual, masked)}
          variation={variacaoPct(metrics.totalAtual, metrics.totalAnt)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <MetricCard
          label="Ticket Médio"
          value={formatBRL(metrics.ticketMedio, masked)}
          subtitle="por venda"
          icon={<Receipt className="h-5 w-5" />}
        />
        <MetricCard
          label="MRR"
          value={formatBRL(metrics.mrrAtual, masked)}
          variation={variacaoPct(metrics.mrrAtual, metrics.mrrAnt)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          label="Quantidade de Vendas"
          value={String(metrics.qtdAtual)}
          variation={variacaoPct(metrics.qtdAtual, metrics.qtdAnt)}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
      </div>

      {/* Métricas de custo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Gasto em Anúncios"
          subtitle="investimento total"
          value={formatBRL(metrics.gasto, masked)}
          icon={<Megaphone className="h-5 w-5" />}
          iconBg="bg-amber-100 text-amber-600"
        />
        <MetricCard
          label="Custo por Lead"
          subtitle={`CPL · ${metrics.leads} leads`}
          value={formatBRL(metrics.cpl, masked)}
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <MetricCard
          label="Custo por Reunião"
          subtitle={`${metrics.reunioes} reuniões`}
          value={formatBRL(metrics.cpr, masked)}
          icon={<CalendarCheck className="h-5 w-5" />}
          iconBg="bg-blue-100 text-blue-600"
        />
        <MetricCard
          label="Custo por Venda"
          subtitle="CAC"
          value={formatBRL(metrics.cac, masked)}
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="bg-pink-100 text-pink-600"
        />
      </div>

      {/* Tabela */}
      <ClientesAtivosTable
        clientes={v.clientes}
        pagamentos={v.pagamentos}
        gastos={v.gastos}
        vendedores={v.vendedores}
        sdrs={v.sdrs}
        ano={ano}
        onChanged={v.refetch}
        masked={masked}
      />

      {/* Gráfico */}
      <EvolucaoChart data={evolucao} masked={masked} />
    </div>
  );
}
