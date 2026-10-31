"use client";

import { Check } from "lucide-react";
import { DISEASES } from "@/domain/rules";
import { cn } from "./ui";

/** Conserva enfermedades guardadas que no están en el catálogo actual. */
export function DiseasePicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const options = [...new Set([...DISEASES, ...value])];

  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((disease) => disease !== name) : [...value, name]);

  return (
    <fieldset>
      <legend className="text-sm font-semibold">¿Padeces alguna enfermedad?</legend>
      <p className="mt-1 text-xs text-muted">Marca las que correspondan. Con alguna enfermedad registrada no se puede agendar una cita.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((name) => {
          const selected = value.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(name)}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                selected ? "border-brand bg-blush-soft text-brand-deep" : "border-line bg-surface hover:border-brand",
              )}
            >
              {selected && <Check aria-hidden className="size-4" />}
              {name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
