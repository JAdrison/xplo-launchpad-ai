import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MonthSelector } from "./MonthSelector";
import { formatBRL } from "@/lib/vendasFormat";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ClienteFormDialog } from "./ClienteFormDialog";
import { GastosAnunciosDialog } from "./GastosAnunciosDialog";
import type { ClienteVendido, Pagamento, GastoAnuncio, UserOption } from "@/hooks/useVendas";

interface Props {
  clientes: ClienteVendido[];
  pagamentos: Pagamento[];
  gastos: GastoAnuncio[];
  vendedores: UserOption[];
  sdrs: UserOption[];
  ano: number;
  onChanged: () => void;
  masked: boolean;
}

type SortKey = "vencimento" | "nome" | "valor" | "cadastro";
type PagFilter = "todos" | "pagos" | "pendentes";

export function ClientesAtivosTable({
  clientes, pagamentos, gastos, vendedores, sdrs, ano, onChanged, masked,
}: Props) {
  const { toast } = useToast();
  const today = new Date();
  const [pagMes, setPagMes] = useState(today.getMonth() + 1);
  const [pagAno, setPagAno] = useState(today.getFullYear());
  const [sortBy, setSortBy] = useState<SortKey>("vencimento");
  const [pagFilter, setPagFilter] = useState<PagFilter>("todos");
  const [vendFilter, setVendFilter] = useState<string>("all");
  const [sdrFilter, setSdrFilter] = useState<string>("all");
  const [editingCliente, setEditingCliente] = useState<ClienteVendido | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openGastos, setOpenGastos] = useState(false);

  const ativos = clientes.filter((c) => c.ativo);
  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    [...vendedores, ...sdrs].forEach((u) => (m[u.user_id] = u.email));
    return m;
  }, [vendedores, sdrs]);

  const isPago = (cid: string) =>
    pagamentos.some((p) => p.cliente_id === cid && p.mes === pagMes && p.ano === pagAno);

  const filtered = useMemo(() => {
    let list = [...ativos];
    if (pagFilter === "pagos") list = list.filter((c) => isPago(c.id));
    else if (pagFilter === "pendentes") list = list.filter((c) => !isPago(c.id));
    if (vendFilter !== "all") list = list.filter((c) => c.vendedor_id === vendFilter);
    if (sdrFilter !== "all") list = list.filter((c) => c.sdr_id === sdrFilter);
    list.sort((a, b) => {
      switch (sortBy) {
        case "vencimento": return a.dia_vencimento - b.dia_vencimento;
        case "nome": return a.nome.localeCompare(b.nome);
        case "valor": return b.valor_mensal_cents - a.valor_mensal_cents;
        case "cadastro": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativos, pagFilter, vendFilter, sdrFilter, sortBy, pagamentos, pagMes, pagAno]);

  const pagosCount = ativos.filter((c) => isPago(c.id)).length;
  const recebido = ativos
    .filter((c) => isPago(c.id))
    .reduce((acc, c) => acc + c.valor_mensal_cents, 0);
  const esperado = ativos.reduce((acc, c) => acc + c.valor_mensal_cents, 0);

  const togglePagamento = async (c: ClienteVendido) => {
    if (isPago(c.id)) {
      const { error } = await supabase
        .from("pagamentos_clientes")
        .delete()
        .match({ cliente_id: c.id, mes: pagMes, ano: pagAno });
      if (error) return toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      const { error } = await supabase
        .from("pagamentos_clientes")
        .upsert(
          { cliente_id: c.id, mes: pagMes, ano: pagAno, valor_cents: c.valor_mensal_cents },
          { onConflict: "cliente_id,mes,ano" }
        );
      if (error) return toast({ variant: "destructive", title: "Erro", description: error.message });
    }
    onChanged();
  };

  const remover = async (c: ClienteVendido) => {
    const { error } = await supabase.from("clientes_vendidos").update({ ativo: false }).eq("id", c.id);
    if (error) return toast({ variant: "destructive", title: "Erro", description: error.message });
    toast({ title: "Cliente desativado" });
    onChanged();
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">Clientes Ativos</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setOpenGastos(true)}>
            <DollarSign className="h-4 w-4 mr-2" /> Gasto em Anúncios
          </Button>
          <Button onClick={() => { setEditingCliente(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-muted/40 p-4 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm font-medium">Pagamentos de {new Date(pagAno, pagMes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pagosCount} de {ativos.length} pagos</Badge>
            <Badge variant="outline">Recebido: {formatBRL(recebido, masked)}</Badge>
            <MonthSelector mes={pagMes} ano={pagAno} onChange={(m, a) => { setPagMes(m); setPagAno(a); }} />
          </div>
        </div>
        <Progress value={esperado > 0 ? (recebido / esperado) * 100 : 0} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatBRL(recebido, masked)} recebido</span>
          <span>{formatBRL(esperado, masked)} esperado</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vencimento">Vencimento</SelectItem>
            <SelectItem value="nome">Nome</SelectItem>
            <SelectItem value="valor">Valor Mensal</SelectItem>
            <SelectItem value="cadastro">Data Cadastro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pagFilter} onValueChange={(v) => setPagFilter(v as PagFilter)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pagos">Pagos</SelectItem>
            <SelectItem value="pendentes">Pendentes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vendFilter} onValueChange={setVendFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos vendedores</SelectItem>
            {vendedores.map((v) => <SelectItem key={v.user_id} value={v.user_id}>{v.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sdrFilter} onValueChange={setSdrFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="SDR" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos SDRs</SelectItem>
            {sdrs.map((v) => <SelectItem key={v.user_id} value={v.user_id}>{v.email}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Venc.</th>
              <th className="px-3 py-2 text-right">Mensal</th>
              <th className="px-3 py-2 text-right hidden lg:table-cell">Setup</th>
              <th className="px-3 py-2 text-left hidden md:table-cell">Vendedor</th>
              <th className="px-3 py-2 text-left hidden md:table-cell">SDR</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Nenhum cliente</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <button
                    aria-label="Toggle pagamento"
                    onClick={() => togglePagamento(c)}
                    className={`h-3 w-3 rounded-full ${isPago(c.id) ? "bg-emerald-500" : "bg-red-500"} hover:scale-125 transition`}
                  />
                </td>
                <td className="px-3 py-2 font-medium">{c.nome}</td>
                <td className="px-3 py-2 text-muted-foreground">Dia {c.dia_vencimento}</td>
                <td className="px-3 py-2 text-right text-primary font-medium">{formatBRL(c.valor_mensal_cents, masked)}</td>
                <td className="px-3 py-2 text-right hidden lg:table-cell">{formatBRL(c.valor_setup_cents, masked)}</td>
                <td className="px-3 py-2 hidden md:table-cell text-xs">{c.vendedor_id ? userMap[c.vendedor_id] ?? "—" : "—"}</td>
                <td className="px-3 py-2 hidden md:table-cell text-xs">{c.sdr_id ? userMap[c.sdr_id] ?? "—" : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingCliente(c); setOpenForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O cliente será desativado mas o histórico de pagamentos é preservado.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remover(c)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClienteFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        cliente={editingCliente}
        vendedores={vendedores}
        sdrs={sdrs}
        onSaved={onChanged}
      />
      <GastosAnunciosDialog
        open={openGastos}
        onOpenChange={setOpenGastos}
        ano={ano}
        gastos={gastos}
        onSaved={onChanged}
      />
    </Card>
  );
}
