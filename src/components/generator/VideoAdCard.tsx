import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Copy,
  Trash2,
  Clock,
  Sparkles,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Ad = Tables<"ads">;

interface VideoAdCardProps {
  ad: Ad;
  onDelete: () => void;
  onRefine: () => void;
  onUpdate: (updatedAd: Ad) => void;
  isDeleting?: boolean;
}

interface VideoContent {
  hook: string;
  problem: string;
  why_bad: string;
  solution: string;
  cta: string;
  duration: string;
  visual_notes: string;
}

type SectionKey = keyof Omit<VideoContent, "duration">;

const SECTIONS: { key: SectionKey; label: string; icon?: React.ReactNode }[] = [
  { key: "hook", label: "HOOK" },
  { key: "problem", label: "PROBLEMA" },
  { key: "why_bad", label: "POR QUE ISSO É RUIM", icon: <AlertTriangle className="h-3 w-3" /> },
  { key: "solution", label: "SOLUÇÃO" },
  { key: "cta", label: "CTA" },
  { key: "visual_notes", label: "NOTAS VISUAIS" },
];

const COLUMN_MAP: Record<SectionKey, keyof Ad> = {
  hook: "video_hook",
  problem: "video_problem",
  why_bad: "video_why_bad",
  solution: "video_solution",
  cta: "video_cta",
  visual_notes: "video_visual_notes",
};

const VIDEO_TYPE_LABELS: Record<string, string> = {
  pattern_break: "Quebra de Padrão",
  question_box: "Caixinha de Perguntas",
  daily_scene: "Cotidiano + Problema",
  location_based: "Direcionado para Região",
  social_proof: "Prova Social",
  direct: "Direto",
  educational: "Educacional",
};

export function VideoAdCard({ ad, onDelete, onRefine, onUpdate, isDeleting }: VideoAdCardProps) {
  // Get video content from ad
  const videoContent: VideoContent = {
    hook: ad.video_hook || "",
    problem: ad.video_problem || "",
    why_bad: ad.video_why_bad || "",
    solution: ad.video_solution || "",
    cta: ad.video_cta || "",
    duration: ad.video_duration || "",
    visual_notes: ad.video_visual_notes || "",
  };

  // State for section selection
  const [selectedSections, setSelectedSections] = useState<Record<SectionKey, boolean>>({
    hook: true,
    problem: true,
    why_bad: true,
    solution: true,
    cta: true,
    visual_notes: true,
  });

  // State for inline editing
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggleSection = (section: SectionKey) => {
    setSelectedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const startEditing = (section: SectionKey) => {
    setEditingSection(section);
    setEditValue(videoContent[section]);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingSection) return;

    setIsSaving(true);
    const columnName = COLUMN_MAP[editingSection];

    const { error } = await supabase
      .from("ads")
      .update({ [columnName]: editValue })
      .eq("id", ad.id);

    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar alterações");
      return;
    }

    // Update local state
    const updatedAd = { ...ad, [columnName]: editValue };
    onUpdate(updatedAd);
    setEditingSection(null);
    setEditValue("");
    toast.success("Texto atualizado com sucesso!");
  };

  const copySelectedSections = () => {
    const parts: string[] = [];

    SECTIONS.forEach(({ key, label }) => {
      if (selectedSections[key] && videoContent[key]) {
        parts.push(`${label}:\n${videoContent[key]}`);
      }
    });

    if (parts.length === 0) {
      toast.error("Selecione pelo menos uma seção para copiar");
      return;
    }

    navigator.clipboard.writeText(parts.join("\n\n"));
    toast.success("Roteiro copiado para a área de transferência!");
  };

  const renderSection = (section: { key: SectionKey; label: string; icon?: React.ReactNode }) => {
    const isSelected = selectedSections[section.key];
    const isEditing = editingSection === section.key;
    const content = videoContent[section.key];

    if (!content && !isEditing) return null;

    const sectionStyle = section.key === "cta" ? "bg-primary/10" : section.key === "visual_notes" ? "border border-dashed" : "bg-muted/50";

    return (
      <div
        key={section.key}
        className={`p-3 rounded-lg transition-opacity ${sectionStyle} ${!isSelected ? "opacity-40" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`section-${ad.id}-${section.key}`}
              checked={isSelected}
              onCheckedChange={() => toggleSection(section.key)}
            />
            <label
              htmlFor={`section-${ad.id}-${section.key}`}
              className="text-xs text-muted-foreground font-medium flex items-center gap-1 cursor-pointer"
            >
              {section.icon}
              {section.label}
            </label>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => startEditing(section.key)}
              title="Editar texto"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[80px] text-sm"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={saveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <p className={`mt-1 text-sm ${section.key === "cta" ? "font-medium text-primary" : ""} ${section.key === "visual_notes" ? "text-muted-foreground" : ""}`}>
            {content}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {VIDEO_TYPE_LABELS[ad.video_type || ad.ad_angle || ""] || ad.ad_angle}
          </Badge>
          {videoContent.duration && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {videoContent.duration}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={onRefine}
          >
            <Sparkles className="h-3 w-3" />
            Refinar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copySelectedSections}
            title="Copiar seções selecionadas"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este roteiro? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {SECTIONS.map(renderSection)}
      </div>
    </div>
  );
}
