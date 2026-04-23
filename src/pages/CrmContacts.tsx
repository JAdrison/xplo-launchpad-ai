import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBRL, daysInColumn } from "@/lib/crmFormat";
import { toast } from "@/hooks/use-toast";

interface ContactRow {
  client_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  pipeline_name: string | null;
  column_name: string | null;
  value_cents: number;
  status: string;
  last_activity: string | null;
  created_at: string;
}

export default function CrmContacts() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, phone, email, created_at")
        .order("created_at", { ascending: false });

      const { data: deals } = await supabase
        .from("deals")
        .select("client_id, value_cents, status, entered_current_column_at, pipelines(name), pipeline_columns(name)")
        .order("created_at", { ascending: false });

      const { data: acts } = await supabase
        .from("activities")
        .select("client_id, scheduled_at, completed_at")
        .order("scheduled_at", { ascending: false });

      const byClient = new Map<string, any>();
      (deals ?? []).forEach((d: any) => {
        if (!byClient.has(d.client_id)) {
          byClient.set(d.client_id, {
            value_cents: d.value_cents,
            status: d.status,
            pipeline_name: d.pipelines?.name ?? null,
            column_name: d.pipeline_columns?.name ?? null,
          });
        }
      });
      const lastActByClient = new Map<string, string>();
      (acts ?? []).forEach((a: any) => {
        const ts = a.completed_at || a.scheduled_at;
        if (ts && !lastActByClient.has(a.client_id)) lastActByClient.set(a.client_id, ts);
      });

      const final: ContactRow[] = (clients ?? []).map((c) => {
        const d = byClient.get(c.id) ?? {};
        return {
          client_id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          pipeline_name: d.pipeline_name ?? null,
          column_name: d.column_name ?? null,
          value_cents: d.value_cents ?? 0,
          status: d.status ?? "—",
          last_activity: lastActByClient.get(c.id) ?? null,
          created_at: c.created_at,
        };
      });

      setRows(final);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.pipeline_name ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const exportCSV = () => {
    const headers = ["Nome", "Telefone", "E-mail", "Pipeline", "Etapa", "Valor", "Status", "Última atividade", "Criado em"];
    const lines = filtered.map((r) =>
      [
        r.name,
        r.phone ?? "",
        r.email ?? "",
        r.pipeline_name ?? "",
        r.column_name ?? "",
        formatBRL(r.value_cents),
        r.status,
        r.last_activity ?? "",
        new Date(r.created_at).toLocaleDateString("pt-BR"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-contatos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: `${filtered.length} contatos exportados.` });
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-sm text-muted-foreground">Todos os clientes e seu status no CRM</p>
        </div>
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, telefone, e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-72"
            />
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Pipeline</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última atividade</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum contato.</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.client_id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.phone || "—"}</TableCell>
                <TableCell>{r.email || "—"}</TableCell>
                <TableCell>{r.pipeline_name || "—"}</TableCell>
                <TableCell>{r.column_name || "—"}</TableCell>
                <TableCell className="text-right">{r.value_cents ? formatBRL(r.value_cents) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "won" ? "default" : r.status === "lost" ? "destructive" : "secondary"}>
                    {r.status === "won" ? "Ganho" : r.status === "lost" ? "Perdido" : r.status === "active" ? "Ativo" : "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.last_activity ? daysInColumn(r.last_activity) : "—"}
                </TableCell>
                <TableCell>
                  <Button asChild size="icon" variant="ghost">
                    <Link to={`/clients/${r.client_id}`}><ExternalLink className="h-4 w-4" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
