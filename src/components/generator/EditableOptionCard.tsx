import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableOptionCardProps {
  text: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (newText: string) => void;
  optionIndex: number;
}

export function EditableOptionCard({
  text,
  isSelected,
  onSelect,
  onEdit,
  optionIndex,
}: EditableOptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(text);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEdit(editValue);
      setIsEditing(false);
    }
    if (e.key === "Escape") {
      setEditValue(text);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 transition-all cursor-pointer",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-muted-foreground/50"
      )}
      onClick={() => !isEditing && onSelect()}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect()}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Opção {optionIndex + 1}
            </span>
          </div>

          {isEditing ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="min-h-[80px] text-sm"
              autoFocus
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{text}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={isEditing ? handleSaveEdit : handleStartEdit}
        >
          {isEditing ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
