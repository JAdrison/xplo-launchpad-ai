import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClienteVendido {
  id: string;
  nome: string;
  valor_mensal_cents: number;
  valor_setup_cents: number;
  vendedor_id: string | null;
  sdr_id: string | null;
  dia_vencimento: number;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
}

export interface Pagamento {
  cliente_id: string;
  mes: number;
  ano: number;
  valor_cents: number;
}

export interface GastoAnuncio {
  mes: number;
  ano: number;
  valor_cents: number;
  leads_manual: number | null;
  reunioes_manual: number | null;
}

export interface UserOption {
  user_id: string;
  email: string;
}

export function useVendas(mesMetricas: number, anoMetricas: number) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteVendido[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [gastos, setGastos] = useState<GastoAnuncio[]>([]);
  const [dealsCountByMonth, setDealsCountByMonth] = useState<Record<string, number>>({});
  const [vendedores, setVendedores] = useState<UserOption[]>([]);
  const [sdrs, setSdrs] = useState<UserOption[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p, g, d, ujf] = await Promise.all([
        supabase.from("clientes_vendidos").select("*").order("created_at", { ascending: false }),
        supabase.from("pagamentos_clientes").select("*"),
        supabase.from("gastos_anuncios").select("*"),
        supabase.from("deals").select("created_at"),
        supabase.from("user_job_functions").select("user_id, job_function").in("job_function", ["vendedor", "sdr"]),
      ]);
      if (c.error) throw c.error;
      if (p.error) throw p.error;
      if (g.error) throw g.error;
      setClientes((c.data ?? []) as ClienteVendido[]);
      setPagamentos((p.data ?? []) as Pagamento[]);
      setGastos((g.data ?? []) as GastoAnuncio[]);

      const counts: Record<string, number> = {};
      (d.data ?? []).forEach((row: any) => {
        const dt = new Date(row.created_at);
        const k = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
        counts[k] = (counts[k] ?? 0) + 1;
      });
      setDealsCountByMonth(counts);

      // Resolve vendor/sdr emails
      const userIds = Array.from(new Set((ujf.data ?? []).map((r: any) => r.user_id)));
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: emailData } = await supabase.functions.invoke("get-user-emails", {
          body: { userIds },
        });
        if (emailData) {
          for (const [uid, info] of Object.entries(emailData as Record<string, any>)) {
            emailMap[uid] = typeof info === "string" ? info : info?.email ?? uid;
          }
        }
      }
      const vs: UserOption[] = [];
      const ss: UserOption[] = [];
      (ujf.data ?? []).forEach((r: any) => {
        const opt = { user_id: r.user_id, email: emailMap[r.user_id] ?? r.user_id };
        if (r.job_function === "vendedor") vs.push(opt);
        else if (r.job_function === "sdr") ss.push(opt);
      });
      setVendedores(vs);
      setSdrs(ss);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao carregar Vendas", description: e.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Helpers ===========================
  const clientesAtivos = clientes.filter((c) => c.ativo);

  const isClienteAtivoNoMes = (c: ClienteVendido, mes: number, ano: number) => {
    const created = new Date(c.created_at);
    const lastDay = new Date(ano, mes, 0, 23, 59, 59);
    return created <= lastDay && c.ativo;
  };

  const totalVendasCents = (mes: number, ano: number) =>
    clientes
      .filter((c) => {
        const dt = new Date(c.created_at);
        return dt.getMonth() + 1 === mes && dt.getFullYear() === ano;
      })
      .reduce((acc, c) => acc + c.valor_mensal_cents + c.valor_setup_cents, 0);

  const qtdVendas = (mes: number, ano: number) =>
    clientes.filter((c) => {
      const dt = new Date(c.created_at);
      return dt.getMonth() + 1 === mes && dt.getFullYear() === ano;
    }).length;

  const mrrCents = (mes: number, ano: number) =>
    clientes
      .filter((c) => isClienteAtivoNoMes(c, mes, ano))
      .reduce((acc, c) => acc + c.valor_mensal_cents, 0);

  const gastoCents = (mes: number, ano: number) =>
    gastos.find((g) => g.mes === mes && g.ano === ano)?.valor_cents ?? 0;

  const leadsMes = (mes: number, ano: number) => {
    const g = gastos.find((g) => g.mes === mes && g.ano === ano);
    if (g?.leads_manual != null) return g.leads_manual;
    return dealsCountByMonth[`${ano}-${mes}`] ?? 0;
  };

  const reunioesMes = (mes: number, ano: number) => {
    const g = gastos.find((g) => g.mes === mes && g.ano === ano);
    return g?.reunioes_manual ?? 0;
  };

  // Aggregates for current month
  const totalAtual = totalVendasCents(mesMetricas, anoMetricas);
  const totalAnt = (() => {
    const d = new Date(anoMetricas, mesMetricas - 2, 1);
    return totalVendasCents(d.getMonth() + 1, d.getFullYear());
  })();
  const mrrAtual = mrrCents(mesMetricas, anoMetricas);
  const mrrAnt = (() => {
    const d = new Date(anoMetricas, mesMetricas - 2, 1);
    return mrrCents(d.getMonth() + 1, d.getFullYear());
  })();
  const qtdAtual = qtdVendas(mesMetricas, anoMetricas);
  const qtdAnt = (() => {
    const d = new Date(anoMetricas, mesMetricas - 2, 1);
    return qtdVendas(d.getMonth() + 1, d.getFullYear());
  })();
  const ticketMedio = qtdAtual > 0 ? totalAtual / qtdAtual : 0;
  const gasto = gastoCents(mesMetricas, anoMetricas);
  const leads = leadsMes(mesMetricas, anoMetricas);
  const reunioes = reunioesMes(mesMetricas, anoMetricas);
  const cpl = leads > 0 ? gasto / leads : 0;
  const cpr = reunioes > 0 ? gasto / reunioes : 0;
  const cac = qtdAtual > 0 ? gasto / qtdAtual : 0;

  const evolucao = (() => {
    const arr: { label: string; vendas: number; mrr: number; mes: number; ano: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anoMetricas, mesMetricas - 1 - i, 1);
      const m = d.getMonth() + 1;
      const a = d.getFullYear();
      arr.push({
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        vendas: totalVendasCents(m, a) / 100,
        mrr: mrrCents(m, a) / 100,
        mes: m,
        ano: a,
      });
    }
    return arr;
  })();

  return {
    loading,
    clientes,
    clientesAtivos,
    pagamentos,
    gastos,
    vendedores,
    sdrs,
    refetch: fetchAll,
    metrics: {
      totalAtual, totalAnt, mrrAtual, mrrAnt,
      qtdAtual, qtdAnt, ticketMedio,
      gasto, leads, reunioes, cpl, cpr, cac,
    },
    evolucao,
  };
}

export function variacaoPct(atual: number, anterior: number) {
  if (anterior === 0) return atual === 0 ? 0 : 100;
  return ((atual - anterior) / anterior) * 100;
}
