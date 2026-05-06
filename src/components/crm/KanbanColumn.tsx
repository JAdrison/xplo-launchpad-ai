import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DealCard } from "./DealCard";
import { ColumnAutomationDialog } from "./ColumnAutomationDialog";
import { formatBRL, getMaintenanceStatus } from "@/lib/crmFormat";
import { cn } from "@/lib/utils";
import type { PipelineColumn, DealWithMeta } from "@/hooks/useCrm";

interface Props {
  column: PipelineColumn & { checkpoint_code?: string | null };
  deals: DealWithMeta[];
  onAddDeal: (columnId: string) => void;
  onOpenDeal: (dealId: string) => void;
  onColumnChanged?: () => void;
}

export function KanbanColumn({ column, deals, onAddDeal, onOpenDeal, onColumnChanged }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const total = deals.reduce((s, d) => s + (d.value_cents || 0), 0);
  const [autoOpen, setAutoOpen] = useState(false);

  const isMaintenance = column.checkpoint_code === "maint_active";
  const maintSummary = isMaintenance
    ? deals.reduce(
        (acc, d) => {
          const s = getMaintenanceStatus(d.maintenance);
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        },
        { waiting: 0, ontrack: 0, today: 0, overdue: 0 } as Record<string, number>,
      )
    : null;

  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg">
      <div
        className="px-3 py-2 border-l-4 rounded-t-lg bg-background flex items-center justify-between"
        style={{ borderLeftColor: column.color }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold truncate">{column.name}</h3>
            {column.automation_enabled && (
              <Zap className="h-3 w-3 text-primary shrink-0" aria-label="Automação ativa" />
            )}
            {column.checkpoint_code && /^0[1-5]$/.test(column.checkpoint_code) && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                AUTO
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBRL(total)} · {deals.length} {deals.length === 1 ? "negócio" : "negócios"}
          </p>
          {maintSummary && deals.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] font-medium">
              {maintSummary.overdue > 0 && (
                <span className="text-red-600">🔴 {maintSummary.overdue} atrasado{maintSummary.overdue > 1 ? "s" : ""}</span>
              )}
              {maintSummary.today > 0 && (
                <span className="text-amber-700">🟡 {maintSummary.today} hoje</span>
              )}
              {maintSummary.ontrack > 0 && (
                <span className="text-emerald-700">🟢 {maintSummary.ontrack} em dia</span>
              )}
              {maintSummary.waiting > 0 && (
                <span className="text-slate-600">⚪ {maintSummary.waiting} aguardando</span>
              )}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setAutoOpen(true)}>
              <Zap className="h-4 w-4 mr-2" /> Configurar automações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 min-h-[200px] transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} onClick={() => onOpenDeal(d.id)} />
        ))}
      </div>

      <div className="p-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAddDeal(column.id)}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar negócio
        </Button>
      </div>

      <ColumnAutomationDialog
        open={autoOpen}
        onOpenChange={setAutoOpen}
        column={column}
        onSaved={onColumnChanged}
      />
    </div>
  );
}
