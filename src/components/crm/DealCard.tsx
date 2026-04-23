import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
import { formatBRL, initialsOf, timeInColumn } from "@/lib/crmFormat";
import type { DealWithMeta } from "@/hooks/useCrm";

interface Props {
  deal: DealWithMeta;
  onClick: () => void;
}

export function DealCard({ deal, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  const total = deal.activities_total ?? 0;
  const done = deal.activities_done ?? 0;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // only treat as click if not dragging
        if (!isDragging) onClick();
      }}
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

      {total > 0 && (
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
