import { CalendarClock, ClipboardList, Hourglass } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CancelAppointmentButton, ConfirmAppointmentButton } from "@/components/appointment-actions";
import { Card, PageHeading, PageSkeleton } from "@/components/ui";
import { toDateKey, todayKey } from "@/domain/rules";
import { formatTime, formatWeekday } from "@/lib/format";
import { getPendingAppointments, requireAdminUser } from "@/server/dal";

export const metadata: Metadata = { title: "Administración", robots: { index: false } };

async function Content() {
  await requireAdminUser();
  const appointments = await getPendingAppointments();
  const today = todayKey();

  const byDay = new Map<string, typeof appointments>();
  for (const appointment of appointments) {
    const day = toDateKey(new Date(appointment.date));
    byDay.set(day, [...(byDay.get(day) ?? []), appointment]);
  }

  const summary = [
    { icon: ClipboardList, label: "Pendientes", value: appointments.length },
    { icon: CalendarClock, label: "Para hoy", value: byDay.get(today)?.length ?? 0 },
    { icon: Hourglass, label: "Por confirmar de días anteriores", value: [...byDay.keys()].filter((day) => day < today).reduce((total, day) => total + (byDay.get(day)?.length ?? 0), 0) },
  ];

  return (
    <>
      <dl className="mb-8 grid gap-4 sm:grid-cols-3">
        {summary.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 shadow-card">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blush-soft text-brand">
              <Icon aria-hidden />
            </span>
            <div>
              <dd className="font-display text-3xl leading-none font-semibold">{value}</dd>
              <dt className="mt-1 text-sm text-muted">{label}</dt>
            </div>
          </div>
        ))}
      </dl>

      {appointments.length === 0 ? (
        <Card>
          <p className="text-center text-muted">No hay citas pendientes.</p>
        </Card>
      ) : (
        <div className="grid gap-8">
          {[...byDay.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 text-xl first-letter:uppercase">{day === today ? "Hoy" : formatWeekday(day)}</h2>
              <ul className="grid gap-3">
                {items.map((appointment) => (
                  <li key={appointment.id}>
                    <Card className="flex flex-col gap-4 !p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blush-soft font-display text-lg font-semibold text-brand-deep">
                          {appointment.bloodType}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold">{appointment.donorName}</p>
                          <p className="truncate text-sm text-muted">{appointment.donorEmail}</p>
                          <p className="mt-1 text-sm">
                            {formatTime(appointment.date)} h · {appointment.institutionName}
                          </p>
                          {appointment.notes && <p className="mt-1 text-sm text-muted">Nota: {appointment.notes}</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <ConfirmAppointmentButton id={appointment.id} donor={appointment.donorName} />
                        <CancelAppointmentButton id={appointment.id} compact />
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <PageHeading title="Citas pendientes" description="Confirma la cita cuando el donante haya donado: ahí se registra la donación y se otorgan los puntos." />
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </div>
  );
}
