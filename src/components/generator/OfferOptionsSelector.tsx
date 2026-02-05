import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EditableOptionCard } from "./EditableOptionCard";
import { RefreshCw, Save, Target, Sparkles, Shield, Award, Undo2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAIConfig } from "@/lib/aiConfig";

type OfferField = "promise" | "unique_mechanism" | "guarantee" | "proof" | "risk_reversal" | "main_cta";

interface GeneratedOptions {
  promise?: string[];
  unique_mechanism?: string[];
  guarantee?: string[];
  proof?: string[];
  risk_reversal?: string[];
  main_cta?: string[];
}

interface SelectedOptions {
  promise?: number[];
  unique_mechanism?: number[];
  guarantee?: number[];
  proof?: number[];
  risk_reversal?: number[];
  main_cta?: number[];
}

interface OfferOptionsSelectorProps {
  offerId: string;
  clientId: string;
  generatedOptions: GeneratedOptions;
  selectedOptions: SelectedOptions;
  onOptionsUpdate: (options: GeneratedOptions, selected: SelectedOptions) => void;
  onEditChange?: (currentOptions: GeneratedOptions, currentSelected: SelectedOptions) => void;
  pppData?: any;
}

interface FieldConfig {
  key: OfferField;
  label: string;
  icon: React.ReactNode;
}

const FIELD_CONFIGS: FieldConfig[] = [
  { key: "promise", label: "Promessa Principal", icon: <Target className="h-4 w-4" /> },
  { key: "unique_mechanism", label: "Mecanismo Único", icon: <Sparkles className="h-4 w-4" /> },
  { key: "guarantee", label: "Garantia", icon: <Shield className="h-4 w-4" /> },
  { key: "proof", label: "Prova Social", icon: <Award className="h-4 w-4" /> },
  { key: "risk_reversal", label: "Reversão de Risco", icon: <Undo2 className="h-4 w-4" /> },
  { key: "main_cta", label: "CTA Principal", icon: <MessageSquare className="h-4 w-4" /> },
];

export function OfferOptionsSelector({
  offerId,
  clientId,
  generatedOptions,
  selectedOptions,
  onOptionsUpdate,
  onEditChange,
  pppData,
}: OfferOptionsSelectorProps) {
  const [localOptions, setLocalOptions] = useState<GeneratedOptions>(generatedOptions);
  const [localSelected, setLocalSelected] = useState<SelectedOptions>(selectedOptions);
  const [refreshingField, setRefreshingField] = useState<OfferField | null>(null);
  const [savingField, setSavingField] = useState<OfferField | null>(null);

  const handleSelectOption = (field: OfferField, optionIndex: number) => {
    const currentSelected = localSelected[field] || [];
    let newSelected: number[];

    if (currentSelected.includes(optionIndex)) {
      // Deselect - but keep at least one selected
      newSelected = currentSelected.filter((i) => i !== optionIndex);
      if (newSelected.length === 0) {
        newSelected = [optionIndex]; // Keep at least one
      }
    } else {
      // Select - add to selection
      newSelected = [...currentSelected, optionIndex];
    }

    const newLocalSelected = {
      ...localSelected,
      [field]: newSelected,
    };

    setLocalSelected(newLocalSelected);
    
    // Notify parent of selection changes for PDF sync
    onEditChange?.(localOptions, newLocalSelected);
  };

  const handleEditOption = (field: OfferField, optionIndex: number, newText: string) => {
    const currentOptions = [...(localOptions[field] || [])];
    currentOptions[optionIndex] = newText;

    const newLocalOptions = {
      ...localOptions,
      [field]: currentOptions,
    };

    setLocalOptions(newLocalOptions);
    
    // Notify parent of edit changes for PDF sync
    onEditChange?.(newLocalOptions, localSelected);
  };

  const handleRefreshField = async (field: OfferField) => {
    setRefreshingField(field);
    try {
      const aiConfig = getAIConfig();
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "refresh-field",
          clientId,
          offerId,
          field,
          pppData,
          aiConfig,
        },
      });

      if (error) throw error;

      if (data.options) {
        setLocalOptions((prev) => ({
          ...prev,
          [field]: data.options,
        }));
        setLocalSelected((prev) => ({
          ...prev,
          [field]: [0],
        }));
        toast.success(`${FIELD_CONFIGS.find((f) => f.key === field)?.label} regenerado!`);
      }
    } catch (error) {
      console.error("Error refreshing field:", error);
      toast.error("Erro ao regenerar opções");
    } finally {
      setRefreshingField(null);
    }
  };

  const handleSaveField = async (field: OfferField) => {
    setSavingField(field);
    try {
      const selected = localSelected[field] || [0];
      const options = localOptions[field] || [];
      
      // Get the first selected option as the main value
      const mainValue = options[selected[0]] || options[0];

      const { error } = await supabase
        .from("offers_hormozi")
        .update({
          [field]: mainValue,
          generated_options: JSON.parse(JSON.stringify(localOptions)),
          selected_options: JSON.parse(JSON.stringify(localSelected)),
        })
        .eq("id", offerId);

      if (error) throw error;

      onOptionsUpdate(localOptions, localSelected);
      toast.success("Seleção salva!");
    } catch (error) {
      console.error("Error saving field:", error);
      toast.error("Erro ao salvar seleção");
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveAll = async () => {
    try {
      // Build update object with all first selected options
      const updateData: Record<string, any> = {
        generated_options: localOptions,
        selected_options: localSelected,
      };

      for (const field of FIELD_CONFIGS) {
        const selected = localSelected[field.key] || [0];
        const options = localOptions[field.key] || [];
        if (options.length > 0) {
          updateData[field.key] = options[selected[0]] || options[0];
        }
      }

      const { error } = await supabase
        .from("offers_hormozi")
        .update(updateData)
        .eq("id", offerId);

      if (error) throw error;

      onOptionsUpdate(localOptions, localSelected);
      toast.success("Todas as seleções foram salvas!");
    } catch (error) {
      console.error("Error saving all:", error);
      toast.error("Erro ao salvar seleções");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Selecione as Opções da Oferta</h3>
          <p className="text-sm text-muted-foreground">
            Escolha uma ou mais opções para cada campo. Use a canetinha para editar manualmente.
          </p>
        </div>
        <Button onClick={handleSaveAll} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Tudo
        </Button>
      </div>

      <Separator />

      {FIELD_CONFIGS.map((fieldConfig) => {
        const options = localOptions[fieldConfig.key] || [];
        const selected = localSelected[fieldConfig.key] || [0];

        if (options.length === 0) return null;

        return (
          <div key={fieldConfig.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-primary">{fieldConfig.icon}</span>
                <h4 className="font-medium">{fieldConfig.label}</h4>
                <Badge variant="outline" className="text-xs">
                  {selected.length} selecionada{selected.length > 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefreshField(fieldConfig.key)}
                  disabled={refreshingField === fieldConfig.key}
                  className="gap-1"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${
                      refreshingField === fieldConfig.key ? "animate-spin" : ""
                    }`}
                  />
                  Refazer
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleSaveField(fieldConfig.key)}
                  disabled={savingField === fieldConfig.key}
                  className="gap-1"
                >
                  <Save className="h-3 w-3" />
                  Salvar
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((option, idx) => (
                <EditableOptionCard
                  key={`${fieldConfig.key}-${idx}`}
                  text={option}
                  isSelected={selected.includes(idx)}
                  onSelect={() => handleSelectOption(fieldConfig.key, idx)}
                  onEdit={(newText) => handleEditOption(fieldConfig.key, idx, newText)}
                  optionIndex={idx}
                />
              ))}
            </div>

            <Separator className="mt-4" />
          </div>
        );
      })}
    </div>
  );
}
