"use client";

import { CalendarSearch, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatWeekday } from "@/lib/format";
import type { NearestSlot } from "@/server/services/appointments";
import { Alert, Button, cn, Skeleton } from "./ui";

type Props = {
  selected: Pick<NearestSlot, "institutionId" | "date" | "time"> | null;
  onChoose: (slot: NearestSlot) => void;
};

/** Evita probar institución por institución: muestra el primer turno libre de las más cercanas en fecha. */
export function NearestSlotFinder({ selected, onChoose }: Props) {
  const [slots, setSlots] = useState<NearestSlot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    try {
      setSlots(await api<NearestSlot[]>("/api/appointments/nearest"));
    } catch (caught) {
      setSlots(null);
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Turno más cercano" className="rounded-2xl border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg">¿Te da igual dónde donar?</h3>
          <p className="text-sm text-muted">Te mostramos los primeros turnos libres.</p>
        </div>
        <Button variant="secondary" size="sm" disabled={loading} onClick={search}>
          <CalendarSearch aria-hidden className="size-4" />
          {loading ? "Buscando…" : slots ? "Buscar de nuevo" : "Buscar el turno más cercano"}
        </Button>
      </div>

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {loading && !slots && (
        <div role="status" aria-label="Buscando turnos" className="mt-4 grid gap-2">
          <Skeleton className="h-18 rounded-xl" />
          <Skeleton className="h-18 rounded-xl" />
        </div>
      )}

      {slots?.length === 0 && <p className="mt-4 text-sm text-muted">No encontramos turnos libres dentro de tu ventana de reserva.</p>}

      {slots && slots.length > 0 && (
        <ul aria-live="polite" className="mt-4 grid gap-2">
          {slots.map((slot, index) => {
            const active = slot.institutionId === selected?.institutionId && slot.date === selected.date && slot.time === selected.time;
            return (
              <li key={slot.institutionId} style={{ animationDelay: `${index * 70}ms` }} className="animate-rise">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChoose(slot)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    active ? "border-brand bg-blush-soft" : "border-line bg-surface hover:border-brand",
                  )}
                >
                  <span className="block font-semibold">{slot.institutionName}</span>
                  <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock aria-hidden className="size-4 shrink-0 text-brand" />
                      <span className="inline-block first-letter:uppercase">
                        {formatWeekday(slot.date)}, {slot.time} h
                      </span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin aria-hidden className="size-4 shrink-0 text-brand" />
                      <span className="truncate">{slot.address}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
