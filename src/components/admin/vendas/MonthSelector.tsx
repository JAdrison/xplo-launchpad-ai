import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { MESES } from "@/lib/vendasFormat";

interface Props {
  mes: number;
  ano: number;
  onChange: (mes: number, ano: number) => void;
}

export function MonthSelector({ mes, ano, onChange }: Props) {
  const prev = () => {
    const d = new Date(ano, mes - 2, 1);
    onChange(d.getMonth() + 1, d.getFullYear());
  };
  const next = () => {
    const d = new Date(ano, mes, 1);
    onChange(d.getMonth() + 1, d.getFullYear());
  };
  return (
    <div className="inline-flex items-center gap-1 rounded-full border bg-background px-1 py-1">
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={prev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 px-3 text-sm font-medium">
        <Calendar className="h-4 w-4" />
        {MESES[mes - 1]} {ano}
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={next}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
