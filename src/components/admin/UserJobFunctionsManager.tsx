import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Briefcase, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  JOB_FUNCTIONS,
  JOB_FUNCTION_LABELS,
  JOB_FUNCTION_COLORS,
  JOB_FUNCTION_ICONS,
  type JobFunction,
} from "@/lib/jobFunctions";

interface Props {
  userId: string;
  disabled?: boolean;
}

export function UserJobFunctionsManager({ userId, disabled }: Props) {
  const [functions, setFunctions] = useState<JobFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_job_functions")
      .select("job_function")
      .eq("user_id", userId);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      setFunctions((data ?? []).map((d: any) => d.job_function as JobFunction));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggle = async (fn: JobFunction, checked: boolean) => {
    setSaving(true);
    if (checked) {
      const { error } = await supabase
        .from("user_job_functions")
        .insert({ user_id: userId, job_function: fn });
      if (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
      } else {
        setFunctions((f) => [...f, fn]);
      }
    } else {
      const { error } = await supabase
        .from("user_job_functions")
        .delete()
        .eq("user_id", userId)
        .eq("job_function", fn);
      if (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
      } else {
        setFunctions((f) => f.filter((x) => x !== fn));
      }
    }
    setSaving(false);
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {functions.length === 0 ? (
        <span className="text-xs text-muted-foreground italic">Sem funções</span>
      ) : (
        functions.map((fn) => {
          const Icon = JOB_FUNCTION_ICONS[fn];
          return (
            <Badge
              key={fn}
              variant="outline"
              className={`gap-1 ${JOB_FUNCTION_COLORS[fn]}`}
            >
              <Icon className="h-3 w-3" />
              {JOB_FUNCTION_LABELS[fn]}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggle(fn, false)}
                  className="ml-1 hover:opacity-70"
                  aria-label="Remover função"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          );
        })
      )}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" disabled={saving}>
              <Briefcase className="h-3 w-3 mr-1" />
              Funções
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="space-y-1">
              {JOB_FUNCTIONS.map((fn) => {
                const checked = functions.includes(fn);
                const Icon = JOB_FUNCTION_ICONS[fn];
                return (
                  <label
                    key={fn}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggle(fn, !!v)}
                      disabled={saving}
                    />
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{JOB_FUNCTION_LABELS[fn]}</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
