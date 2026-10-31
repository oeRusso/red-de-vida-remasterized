"use client";

import { Building2, Clock, ExternalLink, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { institutionWebsite } from "@/domain/institution-directory";
import { type DayHours, INSTITUTION_TYPES } from "@/domain/rules";
import type { InstitutionOption } from "@/server/dal";
import { buttonClass, cn, inputClass } from "./ui";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const hoursLabel = (hours?: DayHours | null) => (hours?.open && hours?.close ? `${hours.open} a ${hours.close}` : "Cerrado");

export function InstitutionsDirectory({ institutions }: { institutions: InstitutionOption[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");

  const needle = normalize(query.trim());
  const visible = institutions.filter(
    (institution) =>
      (!type || institution.type === type) && normalize(`${institution.name} ${institution.address}`).includes(needle),
  );

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search aria-hidden className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            aria-label="Buscar por nombre o dirección"
            placeholder="Busca por nombre o dirección"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={cn(inputClass(), "pl-12")}
          />
        </div>
        <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
          {["", ...INSTITUTION_TYPES].map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={type === option}
              onClick={() => setType(option)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                type === option ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand",
              )}
            >
              {option || "Todas"}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-muted">
        {visible.length === 1 ? "1 institución" : `${visible.length} instituciones`}
      </p>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-3xl border border-dashed border-line p-10 text-center text-muted">
          No encontramos instituciones con esa búsqueda.
        </p>
      ) : (
        <ul className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((institution) => {
            const website = institutionWebsite(institution.name);
            const { mondayToFriday, saturday, sunday } = institution.operatingHours;
            return (
              <li key={institution.id} className="flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blush-soft px-3 py-1 text-xs font-bold text-brand-deep">
                  <Building2 aria-hidden className="size-3.5" />
                  {institution.type}
                </p>
                <h2 className="mt-3 text-xl">{institution.name}</h2>
                <p className="mt-2 flex gap-2 text-sm text-muted">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                  {institution.address}
                </p>
                <div className="mt-3 flex gap-2 text-sm text-muted">
                  <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3">
                    <dt>Lun a vie</dt>
                    <dd>{hoursLabel(mondayToFriday)}</dd>
                    <dt>Sábado</dt>
                    <dd>{hoursLabel(saturday)}</dd>
                    <dt>Domingo</dt>
                    <dd>{hoursLabel(sunday)}</dd>
                  </dl>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <Link href={`/agendar?institucion=${institution.id}`} className={buttonClass("primary", "!min-h-10 !py-2")}>
                    Agendar aquí
                  </Link>
                  {website && (
                    <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-deep hover:underline">
                      Sitio web
                      <ExternalLink aria-hidden className="size-3.5" />
                      <span className="sr-only">(se abre en otra pestaña)</span>
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
