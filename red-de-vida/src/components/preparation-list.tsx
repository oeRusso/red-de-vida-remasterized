import { Check } from "lucide-react";
import { BEFORE_DONATING } from "@/lib/donation-guide";

export function PreparationList() {
  return (
    <ul className="grid gap-2 text-sm">
      {BEFORE_DONATING.map((item) => (
        <li key={item} className="flex gap-2">
          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
          {item}
        </li>
      ))}
    </ul>
  );
}
