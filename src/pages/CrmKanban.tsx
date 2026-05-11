import { useState } from "react";
import { Search, Plus, Settings2, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { NewDealDialog } from "@/components/crm/NewDealDialog";
import { DealDetailModal } from "@/components/crm/DealDetailModal";
import { NewColumnDialog } from "@/components/crm/NewColumnDialog";
import { PipelinesConfig } from "@/components/crm/config/PipelinesConfig";
import { TagsConfig } from "@/components/crm/config/TagsConfig";
import { FieldsConfig } from "@/components/crm/config/FieldsConfig";
import { TemplatesConfig } from "@/components/crm/config/TemplatesConfig";
import { XploTasksConfig } from "@/components/crm/config/XploTasksConfig";

import { CrmContactsView } from "./CrmContacts";
import { usePipelines, usePipelineData } from "@/hooks/useCrm";

type ConfigKey = "pipelines" | "tags" | "fields" | "templates" | "xplo";

const CONFIG_TITLES: Record<ConfigKey, string> = {
  pipelines: "Pipelines",
  tags: "Tags",
  fields: "Campos customizáveis",
  templates: "Templates de atividade",
  xplo: "Tarefas automáticas XPLO (recorrência)",
};


export default function CrmKanban() {
  const { pipelines, loading: pLoading, refetch: refetchPipelines } = usePipelines();
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const activeId = pipelineId ?? pipelines[0]?.id ?? null;
  const { columns, deals, refetch, moveDeal } = usePipelineData(activeId);

  const [tab, setTab] = useState<"kanban" | "contatos">("kanban");
  const [search, setSearch] = useState("");
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [newDealColumn, setNewDealColumn] = useState<string | null>(null);
  const [openDealId, setOpenDealId] = useState<string | null>(null);
  const [newColumnOpen, setNewColumnOpen] = useState(false);
  const [configDialog, setConfigDialog] = useState<ConfigKey | null>(null);

  const filtered = deals.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.client_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Linha 1 — Abas + menu Configurar */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="contatos">Contatos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" /> Configurar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Configurações do CRM</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfigDialog("pipelines")}>Pipelines</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfigDialog("tags")}>Tags</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfigDialog("fields")}>Campos customizáveis</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfigDialog("templates")}>Templates de atividade</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfigDialog("xplo")}>Tarefas XPLO (recorrência)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Linha 2 — Ações do Kanban (só visível na aba Kanban) */}
      {tab === "kanban" && (
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
          <Select value={activeId ?? ""} onValueChange={setPipelineId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={pLoading ? "Carregando…" : "Selecione um pipeline"} />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setConfigDialog("pipelines")}>
            <Plus className="h-4 w-4 mr-1" /> Pipeline
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewColumnOpen(true)}
            disabled={!activeId}
          >
            <Columns3 className="h-4 w-4 mr-1" /> Coluna
          </Button>

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
      )}

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden">
        {tab === "kanban" && (
          <div className="h-full pt-4">
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
        )}


        {tab === "contatos" && (
          <div className="h-full overflow-y-auto"><CrmContactsView /></div>
        )}
      </div>

      {/* Dialogs Kanban */}
      {activeId && newDealColumn && (
        <NewDealDialog
          open={newDealOpen}
          onOpenChange={setNewDealOpen}
          pipelineId={activeId}
          initialColumnId={newDealColumn}
          onCreated={refetch}
        />
      )}

      {activeId && (
        <NewColumnDialog
          open={newColumnOpen}
          onOpenChange={setNewColumnOpen}
          pipelineId={activeId}
          columnsCount={columns.length}
          onCreated={refetch}
        />
      )}

      <DealDetailModal dealId={openDealId} onClose={() => setOpenDealId(null)} onChanged={refetch} />

      {/* Dialog único de configuração */}
      <Dialog open={!!configDialog} onOpenChange={(o) => !o && setConfigDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{configDialog ? CONFIG_TITLES[configDialog] : ""}</DialogTitle>
          </DialogHeader>
          {configDialog === "pipelines" && (
            <PipelinesConfig inDialog onChanged={() => { refetchPipelines(); refetch(); }} />
          )}
          {configDialog === "tags" && <TagsConfig inDialog onChanged={refetch} />}
          {configDialog === "fields" && <FieldsConfig inDialog onChanged={refetch} />}
          {configDialog === "templates" && <TemplatesConfig inDialog onChanged={refetch} />}
          {configDialog === "xplo" && <XploTasksConfig />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
