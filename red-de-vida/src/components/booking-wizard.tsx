"use client";

import { Building2, CalendarDays, CalendarPlus, Check, CircleCheck, Info, type LucideIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addTransitionType, type ReactNode, startTransition, useRef, useState, ViewTransition } from "react";
import { availableSlots, DONATION_INTERVAL_MONTHS, type InstitutionSchedule, slotToDate } from "@/domain/rules";
import { api, errorMessage } from "@/lib/api";
import { appointmentIcs } from "@/lib/calendar";
import { formatLongDate, formatWeekday } from "@/lib/format";
import type { InstitutionOption, ProfileView } from "@/server/dal";
import type { NearestSlot } from "@/server/services/appointments";
import { AvailabilityCalendar } from "./availability-calendar";
import { InstitutionMap } from "./institution-map";
import { NearestSlotFinder } from "./nearest-slot-finder";
import { PreparationList } from "./preparation-list";
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

const STEP_SLIDE = { "step-forward": "step-forward", "step-back": "step-back", default: "none" };

/** El check se dibuja: confirma que la reserva terminó, sin celebrar de más. */
function SuccessMark() {
  return (
    <span className="relative mx-auto grid size-20 animate-pop place-items-center rounded-full bg-success-soft">
      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-10 text-success">
        <path pathLength={1} className="draw-once" d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

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
            {index < 2 && (
              <span aria-hidden className="mx-3 h-0.5 flex-1 overflow-hidden bg-line">
                <span className={cn("block size-full origin-left bg-brand transition-transform duration-500 ease-soft", done ? "scale-x-100" : "scale-x-0")} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function EmptyPanel({ icon: Icon, className, children }: { icon: LucideIcon; className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid place-items-center content-center gap-2 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted", className)}>
      <Icon aria-hidden className="size-5" />
      <p>{children}</p>
    </div>
  );
}

/** Dice qué falta para confirmar y, cuando está todo, repite la cita antes de reservarla. */
function BookingSummary({ institutionName, date, time }: { institutionName?: string; date: string | null; time: string | null }) {
  const missing = !institutionName ? "dónde donar" : !date ? "la fecha" : !time ? "la hora" : null;
  const Icon = missing ? Info : CircleCheck;
  return (
    <p aria-live="polite" className={cn("flex gap-2 rounded-xl px-4 py-3 text-sm", missing ? "bg-canvas text-muted" : "bg-success-soft text-success")}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      {missing ? (
        <span>Para confirmar, elige {missing}.</span>
      ) : (
        <span>
          Tu cita será el <strong>{date && formatWeekday(date)}</strong> a las <strong>{time} h</strong> en <strong>{institutionName}</strong>.
        </span>
      )}
    </p>
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
  const scheduleRequest = useRef(0);

  /** El asistente desliza según la dirección: un `setState` normal no activaría la transición. */
  function goToStep(next: number) {
    startTransition(() => {
      addTransitionType(next > step ? "step-forward" : "step-back");
      setStep(next);
    });
  }

  async function loadSchedule(id: string) {
    // Al cambiar rápido de opción, una respuesta atrasada no debe pisar la agenda elegida.
    const request = ++scheduleRequest.current;
    setLoadingSchedule(true);
    setError(null);
    try {
      const loaded = await api<InstitutionSchedule>(`/api/institutions/${id}/appointments`);
      if (request === scheduleRequest.current) setSchedule(loaded);
    } catch (caught) {
      if (request !== scheduleRequest.current) return;
      setSchedule(null);
      setError(errorMessage(caught));
    } finally {
      if (request === scheduleRequest.current) setLoadingSchedule(false);
    }
  }

  function chooseInstitution(id: string) {
    setInstitutionId(id);
    setDate(null);
    setTime(null);
    void loadSchedule(id);
  }

  function chooseNearest(slot: NearestSlot) {
    setInstitutionId(slot.institutionId);
    setDate(slot.date);
    setTime(slot.time);
    void loadSchedule(slot.institutionId);
  }

  function goToAppointment() {
    goToStep(2);
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
      goToStep(3);
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

      <ViewTransition key={step} enter={STEP_SLIDE} exit={STEP_SLIDE} default="none">
        <div>
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

              <div className="mt-5">
                <NearestSlotFinder
                  selected={institutionId && date && time ? { institutionId, date, time } : null}
                  onChoose={chooseNearest}
                />
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-2">
                <section aria-labelledby="donde" className="flex flex-col gap-4">
                  <h3 id="donde" className="text-lg">
                    ¿Dónde quieres donar?
                  </h3>
                  <Field id="institution" label="Sede">
                    <select
                      id="institution"
                      value={institutionId}
                      onChange={(event) => chooseInstitution(event.target.value)}
                      className={inputClass()}
                    >
                      <option value="" disabled>
                        Selecciona una sede
                      </option>
                      {institutions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {institution?.address ? (
                    <div>
                      <p className="mb-3 flex gap-2 text-sm text-muted">
                        <Building2 aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                        {institution.type} · {institution.address}
                      </p>
                      <InstitutionMap key={institution.address} name={institution.name} address={institution.address} />
                    </div>
                  ) : (
                    <EmptyPanel icon={MapPin} className="h-52">
                      Aquí verás el mapa de la sede que elijas.
                    </EmptyPanel>
                  )}
                  <Field id="notes" label="Nota para el equipo (opcional)" hint="Por ejemplo, si necesitas ayuda para movilizarte.">
                    <textarea
                      id="notes"
                      rows={2}
                      maxLength={500}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                </section>

                <section aria-labelledby="cuando" className="flex flex-col gap-4">
                  <h3 id="cuando" className="text-lg">
                    ¿Cuándo?
                  </h3>
                  {!institutionId && (
                    <EmptyPanel icon={CalendarDays} className="min-h-48 flex-1">
                      Primero elige dónde donar y verás sus fechas disponibles.
                    </EmptyPanel>
                  )}
                  {loadingSchedule && <Skeleton className="h-80" />}
                  {schedule && !loadingSchedule && (
                    <div>
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
                        <fieldset key={date} className="mt-5">
                          <legend className="text-sm font-semibold first-letter:uppercase">{formatWeekday(date)}</legend>
                          {slots.length === 0 ? (
                            <p className="mt-2 text-sm text-brand-deep">No quedan horarios disponibles para este día.</p>
                          ) : (
                            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
                              {slots.map((slot, index) => (
                                <button
                                  key={slot}
                                  type="button"
                                  aria-pressed={slot === time}
                                  onClick={() => setTime(slot)}
                                  style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
                                  className={cn(
                                    "min-h-9 animate-rise rounded-full border text-sm font-medium transition-colors",
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
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <BookingSummary institutionName={institution?.name} date={date} time={time} />
                <div className="mt-4 flex justify-between gap-3">
                  <Button variant="secondary" onClick={() => goToStep(1)}>
                    Atrás
                  </Button>
                  <Button disabled={!date || !time || submitting} onClick={book}>
                    {submitting ? "Confirmando…" : "Confirmar cita"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {step === 3 && date && time && (
            <Card className="py-12 text-center">
              <SuccessMark />
              <h2 className="mt-5 text-3xl">Tu cita se agendó correctamente</h2>
              <p className="mt-2 text-muted">
                Te esperamos el <strong className="text-ink">{formatWeekday(date)}</strong> a las{" "}
                <strong className="text-ink">{time}</strong> en <strong className="text-ink">{institution?.name}</strong>.
              </p>
              <div className="mx-auto mt-7 max-w-md rounded-2xl bg-canvas p-5 text-left">
                <h3 className="text-lg">Para el día de tu cita</h3>
                <div className="mt-3">
                  <PreparationList />
                </div>
                <p className="mt-3 text-xs text-muted">Reservar te guarda el lugar. El equipo de salud confirma ese día si puedes donar.</p>
              </div>
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
      </ViewTransition>
    </div>
  );
}
