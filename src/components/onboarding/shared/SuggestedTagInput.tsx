import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestedTagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions: string[];
}

export function SuggestedTagInput({ value, onChange, placeholder, suggestions }: SuggestedTagInputProps) {
  const [draft, setDraft] = useState("");

  const isSelected = (s: string) => value.some((v) => v.toLowerCase() === s.toLowerCase());

  const toggle = (s: string) => {
    if (isSelected(s)) {
      onChange(value.filter((v) => v.toLowerCase() !== s.toLowerCase()));
    } else {
      onChange([...value, s]);
    }
  };

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (value.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const active = isSelected(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {active ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {s}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? "Adicionar outro..."}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.filter((v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase())).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value
            .filter((v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase()))
            .map((item) => (
              <Badge key={item} variant="secondary" className="gap-1">
                {item}
                <button type="button" onClick={() => remove(item)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}
