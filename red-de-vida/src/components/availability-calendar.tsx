"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { addDays, dayState, firstAvailableDay, type InstitutionSchedule } from "@/domain/rules";
import { formatMonth, formatWeekday } from "@/lib/format";
import { cn } from "./ui";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const monthOf = (dateKey: string) => dateKey.slice(0, 7);

function shiftMonth(month: string, delta: number) {
  const date = new Date(`${month}-01T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

/** Celdas del mes, con huecos iniciales para que la semana empiece en lunes. */
function monthCells(month: string): (string | null)[] {
  const first = `${month}-01`;
  const leading = (new Date(`${first}T00:00:00.000Z`).getUTCDay() + 6) % 7;
  const days: string[] = [];
  for (let day = first; monthOf(day) === month; day = addDays(day, 1)) days.push(day);
  return [...Array<null>(leading).fill(null), ...days];
}

type Props = {
  schedule: InstitutionSchedule;
  from: string;
  to: string;
  selected: string | null;
  onSelect: (dateKey: string) => void;
};

const STATE_LABEL = { available: "disponible", full: "sin turnos", closed: "cerrado" };

export function AvailabilityCalendar({ schedule, from, to, selected, onSelect }: Props) {
  // A fin de mes el mes en curso puede no tener nada reservable: se abre donde sí lo hay.
  const [month, setMonth] = useState(() => monthOf(firstAvailableDay(schedule, from, to) ?? from));

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={month <= monthOf(from)}
          onClick={() => setMonth(shiftMonth(month, -1))}
          className="grid size-10 place-items-center rounded-full hover:bg-blush-soft disabled:opacity-30"
        >
          <ChevronLeft aria-hidden />
        </button>
        <p aria-live="polite" className="font-bold first-letter:uppercase">
          {formatMonth(`${month}-01`)}
        </p>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={month >= monthOf(to)}
          onClick={() => setMonth(shiftMonth(month, 1))}
          className="grid size-10 place-items-center rounded-full hover:bg-blush-soft disabled:opacity-30"
        >
          <ChevronRight aria-hidden />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} aria-hidden className="py-1 text-xs font-semibold text-muted">
            {day}
          </span>
        ))}
        {monthCells(month).map((day, index) => {
          if (!day) return <span key={`gap-${index}`} />;
          const inWindow = day >= from && day <= to;
          const state = inWindow ? dayState(schedule, day) : "closed";
          const isSelected = day === selected;
          return (
            <button
              key={day}
              type="button"
              disabled={state !== "available"}
              aria-pressed={isSelected}
              aria-label={`${formatWeekday(day)}, ${inWindow ? STATE_LABEL[state] : "fuera de la ventana de reserva"}`}
              onClick={() => onSelect(day)}
              className={cn(
                "aspect-square min-h-10 rounded-2xl text-sm font-medium transition-all",
                isSelected && "bg-brand font-bold text-white shadow-md",
                !isSelected && state === "available" && "bg-blush-soft hover:scale-105 hover:bg-blush",
                state === "full" && "text-muted line-through",
                state === "closed" && "text-muted/40",
              )}
            >
              {Number(day.slice(-2))}
            </button>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded bg-blush" /> Con turnos
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="font-semibold line-through">
            15
          </span>{" "}
          Sin turnos
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="text-muted/50">
            15
          </span>{" "}
          No disponible
        </li>
      </ul>
    </div>
  );
}
