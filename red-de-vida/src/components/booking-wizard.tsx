"use client";

import { Building2, CalendarDays, CalendarPlus, Check, CircleCheckBig, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { availableSlots, DONATION_INTERVAL_MONTHS, type InstitutionSchedule, slotToDate } from "@/domain/rules";
import { api, errorMessage } from "@/lib/api";
import { appointmentIcs } from "@/lib/calendar";
import { formatLongDate, formatWeekday } from "@/lib/format";
import type { InstitutionOption, ProfileView } from "@/server/dal";
import { AvailabilityCalendar } from "./availability-calendar";
import { ProfileForm } from "./profile-form";
import { Alert, Button, buttonClass, Card, cn, Field, inputClass, Skeleton } from "./ui";

const STEPS = ["Tus datos", "Tu cita", "Confirmación"];

type Props = {
  profile: ProfileView;
  institutions: InstitutionOption[];
  preselected?: string;
  hasPending: boolean;
  mustWait: boolean;
  window: { from: string; to: string };
};

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className={cn("flex items-center", index < 2 && "flex-1")}>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-full text-sm font-bold transition-colors",
                  done || active ? "bg-brand text-white" : "border border-line bg-surface text-muted",
                )}
              >
                {done ? <Check aria-hidden className="size-5" /> : step}
              </span>
              <span className={cn("hidden text-sm font-semibold sm:inline", !active && "text-muted")}>{label}</span>
            </span>
            {index < 2 && <span aria-hidden className={cn("mx-3 h-0.5 flex-1", done ? "bg-brand" : "bg-line")} />}
          </li>
        );
      })}
    </ol>
  );
}

export function BookingWizard({ profile, institutions, preselected, hasPending, mustWait, window }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dirty, setDirty] = useState(false);

  const [institutionId, setInstitutionId] = useState(preselected ?? "");
  const [schedule, setSchedule] = useState<InstitutionSchedule | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasDiseases = profile.diseases.length > 0;
  const institution = institutions.find((option) => option.id === institutionId);
  const slots = schedule && date ? availableSlots(schedule, date) : [];

  async function loadSchedule(id: string) {
    setLoadingSchedule(true);
    setError(null);
    try {
      setSchedule(await api<InstitutionSchedule>(`/api/institutions/${id}/appointments`));
    } catch (caught) {
      setSchedule(null);
      setError(errorMessage(caught));
    } finally {
      setLoadingSchedule(false);
    }
  }

  function chooseInstitution(id: string) {
    setInstitutionId(id);
    setDate(null);
    setTime(null);
    void loadSchedule(id);
  }

  function goToAppointment() {
    setStep(2);
    if (institutionId && !schedule) void loadSchedule(institutionId);
  }

  function addToCalendar() {
    if (!date || !time) return;
    const ics = appointmentIcs({
      dateKey: date,
      time,
      title: "Donación de sangre · Red de Vida",
      location: `${institution?.name}, ${institution?.address}`,
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    link.download = "cita-red-de-vida.ics";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function book() {
    if (!date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      await api("/api/appointments", {
        method: "POST",
        body: { institutionId, appointmentDate: slotToDate(date, time).toISOString(), notes: notes.trim() || undefined },
      });
      setStep(3);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      // Si otra persona tomó el turno, la agenda en pantalla quedó vieja.
      setTime(null);
      void loadSchedule(institutionId);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Stepper current={step} />

      {step === 1 && (
        <Card>
          <h2 className="text-2xl">Confirma tus datos</h2>
          <p className="mt-1 mb-5 text-sm text-muted">Revisa que sean correctos antes de elegir tu cita.</p>
          {hasPending && (
            <Alert tone="error" className="mb-5">
              Tienes una cita pendiente: complétala o cancélala antes de agendar otra.{" "}
              <Link href="/premios" className="font-semibold underline">
                Ver mi cita
              </Link>
            </Alert>
          )}
          {hasDiseases && (
            <Alert tone="error" className="mb-5">
              No puedes agendar una cita mientras tengas enfermedades registradas en tu perfil.
            </Alert>
          )}
          <ProfileForm profile={profile} onDirtyChange={setDirty} />
          <div className="mt-6 flex justify-end border-t border-line pt-5">
            <Button disabled={hasPending || hasDiseases || dirty} onClick={goToAppointment}>
              Siguiente
            </Button>
          </div>
          {dirty && <p className="mt-2 text-right text-xs text-muted">Guarda los cambios para continuar.</p>}
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="text-2xl">Elige tu cita</h2>
          {mustWait && (
            <Alert tone="info" className="mt-4">
              Para garantizar tu bienestar debes esperar {DONATION_INTERVAL_MONTHS[profile.gender]} meses entre donaciones. Podrás
              donar desde el <strong>{formatLongDate(window.from)}</strong>.
            </Alert>
          )}
          {error && (
            <Alert tone="error" className="mt-4">
              {error}
            </Alert>
          )}

          <div className="mt-5 grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Field id="institution" label="Hospital o institución">
                <select
                  id="institution"
                  value={institutionId}
                  onChange={(event) => chooseInstitution(event.target.value)}
                  className={inputClass()}
                >
                  <option value="" disabled>
                    Selecciona al que asistirás
                  </option>
                  {institutions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </Field>
              {institution && (
                <div className="flex gap-3 rounded-xl bg-canvas p-4 text-sm">
                  <Building2 aria-hidden className="size-5 shrink-0 text-brand" />
                  <div>
                    <p className="font-semibold">{institution.type}</p>
                    <p className="text-muted">{institution.address}</p>
                  </div>
                </div>
              )}
              <Field id="notes" label="Notas importantes (opcional)">
                <textarea
                  id="notes"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <div className="rounded-2xl bg-blush-soft p-5">
                <h3 className="text-lg">Tu reserva</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div className="flex gap-3">
                    <Building2 aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                    <div>
                      <dt className="text-xs text-muted">Institución</dt>
                      <dd className="font-semibold">{institution?.name ?? "Sin elegir"}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                    <div>
                      <dt className="text-xs text-muted">Fecha</dt>
                      <dd className="font-semibold first-letter:uppercase">{date ? formatWeekday(date) : "Sin elegir"}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                    <div>
                      <dt className="text-xs text-muted">Hora</dt>
                      <dd className="font-semibold">{time ? `${time} h` : "Sin elegir"}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              {!institutionId && (
                <p className="grid h-full min-h-48 place-items-center rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                  Selecciona una institución para ver sus fechas disponibles.
                </p>
              )}
              {loadingSchedule && <Skeleton className="h-80" />}
              {schedule && !loadingSchedule && (
                <>
                  <AvailabilityCalendar
                    schedule={schedule}
                    from={window.from}
                    to={window.to}
                    selected={date}
                    onSelect={(day) => {
                      setDate(day);
                      setTime(null);
                    }}
                  />
                  {date && (
                    <fieldset className="mt-5">
                      <legend className="text-sm font-semibold first-letter:uppercase">{formatWeekday(date)}</legend>
                      {slots.length === 0 ? (
                        <p className="mt-2 text-sm text-brand-deep">No quedan horarios disponibles para este día.</p>
                      ) : (
                        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              aria-pressed={slot === time}
                              onClick={() => setTime(slot)}
                              className={cn(
                                "min-h-10 rounded-full border text-sm font-medium transition-colors",
                                slot === time ? "border-brand bg-brand text-white" : "border-line hover:border-brand",
                              )}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </fieldset>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between gap-3 border-t border-line pt-5">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button disabled={!date || !time || submitting} onClick={book}>
              {submitting ? "Agendando…" : "Agendar cita"}
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && date && time && (
        <Card className="animate-rise py-12 text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-success-soft">
            <CircleCheckBig aria-hidden className="size-10 text-success" />
          </span>
          <h2 className="mt-5 text-3xl">Tu cita se agendó correctamente</h2>
          <p className="mt-2 text-muted">
            Te esperamos el <strong className="text-ink">{formatWeekday(date)}</strong> a las{" "}
            <strong className="text-ink">{time}</strong> en <strong className="text-ink">{institution?.name}</strong>.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/premios" className={buttonClass("primary")}>
              Ver mi cita
            </Link>
            <Button variant="secondary" onClick={addToCalendar}>
              <CalendarPlus aria-hidden className="size-4" />
              Añadir a mi calendario
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
