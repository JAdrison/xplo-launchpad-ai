import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { variacaoPct } from "@/hooks/useVendas";
import { formatBRL } from "@/lib/vendasFormat";

interface Props {
  data: { label: string; vendas: number; mrr: number }[];
  masked: boolean;
}

export function EvolucaoChart({ data, masked }: Props) {
  const first = data[0]?.mrr ?? 0;
  const last = data[data.length - 1]?.mrr ?? 0;
  const growth = variacaoPct(last, first);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Evolução de Vendas e MRR</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Crescimento MRR:</span>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
          </Badge>
        </div>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => masked ? "***" : `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: any) => formatBRL((v as number) * 100, masked)}
              contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
            />
            <Legend />
            <Bar dataKey="vendas" name="Vendas do Mês" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="mrr" name="MRR Acumulado" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
