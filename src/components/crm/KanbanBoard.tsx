import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import type { PipelineColumn, DealWithMeta } from "@/hooks/useCrm";

interface Props {
  columns: PipelineColumn[];
  deals: DealWithMeta[];
  onMove: (dealId: string, newColumnId: string) => void;
  onAddDeal: (columnId: string) => void;
  onOpenDeal: (dealId: string) => void;
}

export function KanbanBoard({ columns, deals, onMove, onAddDeal, onOpenDeal }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const dealId = e.active.id as string;
    const newColumnId = e.over?.id as string | undefined;
    if (!newColumnId) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.column_id === newColumnId) return;
    onMove(dealId, newColumnId);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            deals={deals.filter((d) => d.column_id === col.id)}
            onAddDeal={onAddDeal}
            onOpenDeal={onOpenDeal}
          />
        ))}
      </div>
    </DndContext>
  );
}
