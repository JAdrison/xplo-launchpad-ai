import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { JOB_FUNCTION_LABELS, type JobFunction } from "@/lib/jobFunctions";

type ActivityType = "lembrete" | "mensagem" | "ligacao" | "email";

export interface ActivityEditable {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  scheduled_at: string | null;
  duration_minutes?: number | null;
  required_function?: JobFunction | null;
  recurrence_days?: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dealId: string;
  clientId: string;
  onCreated: () => void;
  /** Quando informado, abre em modo edição. */
  activity?: ActivityEditable | null;
}

const FUNCTIONS: (JobFunction | "none")[] = [
  "none", "social_media", "video_editor", "designer", "ads_manager", "ai_specialist", "salesperson", "fulfillment", "manager"
];

export function ActivityFormDialog({ open, onOpenChange, dealId, clientId, onCreated, activity }: Props) {
  const { user } = useAuth();
  const isEdit = !!activity;
  const [type, setType] = useState<ActivityType>("lembrete");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("");
  const [requiredFunction, setRequiredFunction] = useState<JobFunction | "none">("none");
  const [recurrenceDays, setRecurrenceDays] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (activity) {
      setType(activity.type);
      setSubject(activity.subject);
      setDescription(activity.description ?? "");
      setScheduledAt(activity.scheduled_at ? activity.scheduled_at.slice(0, 16) : "");
      setDuration(activity.duration_minutes ? String(activity.duration_minutes) : "");
      setRequiredFunction((activity.required_function as JobFunction) ?? "none");
      setRecurrenceDays(activity.recurrence_days ? String(activity.recurrence_days) : "");
    } else {
      setType("lembrete");
      setSubject("");
      setDescription("");
      setScheduledAt("");
      setDuration("");
      setRequiredFunction("none");
      setRecurrenceDays("");
    }
  }, [open, activity]);

  const submit = async () => {
    if (!subject.trim()) {
      toast({ title: "Informe o assunto", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      type,
      subject,
      description: description || null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      duration_minutes: duration ? parseInt(duration) : null,
      required_function: requiredFunction === "none" ? null : requiredFunction,
      recurrence_days: recurrenceDays ? parseInt(recurrenceDays) : null,
    };

    let error;
    if (isEdit && activity) {
      ({ error } = await supabase.from("activities").update(payload).eq("id", activity.id));
    } else {
      ({ error } = await supabase.from("activities").insert({
        ...payload,
        deal_id: dealId,
        client_id: clientId,
        responsible_id: user?.id ?? null,
        auto_generated: false,
      }));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isEdit ? "Atividade atualizada" : "Atividade criada" });
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar atividade" : "Nova atividade"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lembrete">Lembrete</SelectItem>
                <SelectItem value="mensagem">Mensagem</SelectItem>
                <SelectItem value="ligacao">Ligação</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agendar para</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Função responsável</Label>
              <Select value={requiredFunction} onValueChange={(v) => setRequiredFunction(v as JobFunction | "none")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUNCTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f === "none" ? "Nenhuma" : JOB_FUNCTION_LABELS[f as JobFunction]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recorrência (dias)</Label>
              <Input type="number" placeholder="ex.: 30" value={recurrenceDays} onChange={(e) => setRecurrenceDays(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{isEdit ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
