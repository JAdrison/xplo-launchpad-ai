import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
import {
  formatBRL, initialsOf, timeInColumn,
  getMaintenanceStatus, MAINTENANCE_LABEL, MAINTENANCE_CLASSES,
} from "@/lib/crmFormat";
import { cn } from "@/lib/utils";
import type { DealWithMeta } from "@/hooks/useCrm";

interface Props {
  deal: DealWithMeta;
  onClick: () => void;
  columnCheckpoint?: string | null;
}

export function DealCard({ deal, onClick, columnCheckpoint }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  const isMaintenance = columnCheckpoint === "maint_active";
  const maintStatus = isMaintenance ? getMaintenanceStatus(deal.maintenance) : null;
  const maintMeta = deal.maintenance;

  const total = deal.activities_total ?? 0;
  const done = deal.activities_done ?? 0;
  const pct = total > 0 ? (done / total) * 100 : 0;

  const nextDueLabel = (() => {
    if (!isMaintenance || !maintMeta?.nextDueAt) return null;
    const diff = Math.ceil((new Date(maintMeta.nextDueAt).getTime() - Date.now()) / 86400000);
    if (diff <= 0) return null;
    return `Próx. em ${diff}d`;
  })();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => { if (!isDragging) onClick(); }}
      className="cursor-grab active:cursor-grabbing p-3 hover:shadow-md transition-shadow bg-card"
    >
      <div className="flex items-start gap-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {initialsOf(deal.client_name || deal.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{deal.name}</p>
          <p className="text-xs text-muted-foreground truncate">{deal.client_name}</p>
        </div>
      </div>

      {deal.value_cents > 0 && (
        <p className="text-sm font-semibold text-primary mt-2">{formatBRL(deal.value_cents)}</p>
      )}

      {isMaintenance && maintStatus && (
        <div className="mt-2 space-y-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded",
              MAINTENANCE_CLASSES[maintStatus].badge,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", MAINTENANCE_CLASSES[maintStatus].dot)} />
            {MAINTENANCE_LABEL[maintStatus]}
            {maintStatus === "overdue" && maintMeta && ` · ${maintMeta.overdueCount} há ${maintMeta.maxDaysLate}d`}
            {maintStatus === "today" && maintMeta && ` · ${maintMeta.dueTodayCount}`}
          </span>
          {maintStatus === "waiting" && (
            <p className="text-[10px] text-muted-foreground">Sem tarefas geradas. Abra para iniciar.</p>
          )}
          {maintStatus === "ontrack" && nextDueLabel && (
            <p className="text-[10px] text-muted-foreground">{nextDueLabel}</p>
          )}
        </div>
      )}

      {!isMaintenance && total > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tarefas</span>
            <span>{done}/{total}</span>
          </div>
          <Progress value={pct} className="h-1" />
        </div>
      )}

      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{timeInColumn(deal.entered_current_column_at)}</span>
      </div>
    </Card>
  );
}
