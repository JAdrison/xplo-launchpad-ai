import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical } from "lucide-react";
import { DealCard } from "./DealCard";
import { formatBRL } from "@/lib/crmFormat";
import { cn } from "@/lib/utils";
import type { PipelineColumn, DealWithMeta } from "@/hooks/useCrm";

interface Props {
  column: PipelineColumn;
  deals: DealWithMeta[];
  onAddDeal: (columnId: string) => void;
  onOpenDeal: (dealId: string) => void;
}

export function KanbanColumn({ column, deals, onAddDeal, onOpenDeal }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const total = deals.reduce((s, d) => s + (d.value_cents || 0), 0);

  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg">
      <div
        className="px-3 py-2 border-l-4 rounded-t-lg bg-background flex items-center justify-between"
        style={{ borderLeftColor: column.color }}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{column.name}</h3>
          <p className="text-xs text-muted-foreground">
            {formatBRL(total)} · {deals.length} {deals.length === 1 ? "negócio" : "negócios"}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
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
    </div>
  );
}
