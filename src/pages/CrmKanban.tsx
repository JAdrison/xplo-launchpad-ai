import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { NewDealDialog } from "@/components/crm/NewDealDialog";
import { DealDetailModal } from "@/components/crm/DealDetailModal";
import { usePipelines, usePipelineData } from "@/hooks/useCrm";

export default function CrmKanban() {
  const { pipelines, loading: pLoading } = usePipelines();
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const activeId = pipelineId ?? pipelines[0]?.id ?? null;
  const { columns, deals, refetch, moveDeal } = usePipelineData(activeId);

  const [search, setSearch] = useState("");
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [newDealColumn, setNewDealColumn] = useState<string | null>(null);
  const [openDealId, setOpenDealId] = useState<string | null>(null);

  const filtered = deals.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.client_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <Select value={activeId ?? ""} onValueChange={setPipelineId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder={pLoading ? "Carregando…" : "Selecione um pipeline"} />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar negócio ou cliente…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="ml-auto">
          <Button
            onClick={() => {
              if (!columns[0]) return;
              setNewDealColumn(columns[0].id);
              setNewDealOpen(true);
            }}
            disabled={!columns.length}
          >
            <Plus className="h-4 w-4 mr-1" /> Novo negócio
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden pt-4">
        {activeId ? (
          <KanbanBoard
            columns={columns}
            deals={filtered}
            onMove={moveDeal}
            onAddDeal={(colId) => { setNewDealColumn(colId); setNewDealOpen(true); }}
            onOpenDeal={(id) => setOpenDealId(id)}
            onColumnChanged={refetch}
          />
        ) : (
          <p className="p-8 text-center text-muted-foreground">Nenhum pipeline disponível.</p>
        )}
      </div>

      {activeId && newDealColumn && (
        <NewDealDialog
          open={newDealOpen}
          onOpenChange={setNewDealOpen}
          pipelineId={activeId}
          initialColumnId={newDealColumn}
          onCreated={refetch}
        />
      )}

      <DealDetailModal dealId={openDealId} onClose={() => setOpenDealId(null)} onChanged={refetch} />
    </div>
  );
}
