import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PortfolioPoint {
  month: string;
  clientes: number;
}

interface Props {
  data: PortfolioPoint[];
  isLoading?: boolean;
}

export function PortfolioEvolutionChart({ data, isLoading }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Evolução do Portfólio</CardTitle>
        <CardDescription>Novos clientes nos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="clientes"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
