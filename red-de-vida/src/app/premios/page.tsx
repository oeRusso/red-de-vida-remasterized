import { ArrowRight, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, HeartHandshake, Stethoscope, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CancelAppointmentButton } from "@/components/appointment-actions";
import { DonorCard, DropGauge, InstitutionBlock, MedalsGrid, StatsRow } from "@/components/donor-widgets";
import { MedalReveal } from "@/components/medal-reveal";
import { PageTransition, SuspenseReveal } from "@/components/motion/transitions";
import { PreparationList } from "@/components/preparation-list";
import { buttonClass, Card, cn, PageSkeleton } from "@/components/ui";
import { type AppointmentStatus, DONATIONS_PER_PAGE, levelProgress } from "@/domain/rules";
import { formatLongDate, formatShortDate, formatTime, formatWeekday } from "@/lib/format";
import {
  type AppointmentView,
  type DonationView,
  getBookingContext,
  getDonorHistory,
  type ProfileView,
  requireUser,
} from "@/server/dal";

export const metadata: Metadata = { title: "Premios" };

type SearchParams = Promise<{ pagina?: string }>;

const STATUS: Record<AppointmentStatus, { label: string; style: string }> = {
  Pending: { label: "Pendiente", style: "bg-info-soft text-info" },
  Completed: { label: "Completada", style: "bg-success-soft text-success" },
  Cancelled: { label: "Cancelada", style: "bg-blush-soft text-brand-deep" },
};

type NextStep = { icon: typeof Timer; title: string; text: string; href: string; action: string };

/** Lo primero que ve el donante es qué le toca hacer ahora. */
function nextStepFor(
  profile: ProfileView,
  appointment: AppointmentView | null,
  context: Awaited<ReturnType<typeof getBookingContext>>,
): NextStep {
  if (context.hasPending && appointment) {
    return {
      icon: CalendarClock,
      title: "Tienes una cita agendada",
      text: `${formatWeekday(appointment.date)}, ${formatTime(appointment.date)} h · ${appointment.institutionName}`,
      href: "#mi-cita",
      action: "Ver detalles",
    };
  }
  if (profile.diseases.length > 0) {
    return {
      icon: Stethoscope,
      title: "Tu perfil tiene enfermedades registradas",
      text: "Mientras estén registradas no podrás agendar una cita.",
      href: "/perfil",
      action: "Revisar mi perfil",
    };
  }
  if (context.mustWait) {
    return {
      icon: Timer,
      title: "Tu cuerpo se está recuperando",
      text: `Podrás volver a donar desde el ${formatLongDate(context.window.from)}.`,
      href: "/instituciones",
      action: "Ver dónde donar",
    };
  }
  return {
    icon: HeartHandshake,
    title: "Ya puedes donar",
    text: "Elige sede, fecha y hora en tres pasos.",
    href: "/agendar",
    action: "Agendar cita",
  };
}

function AppointmentCard({ appointment }: { appointment: AppointmentView | null }) {
  if (!appointment) {
    return (
      <Card id="mi-cita" className="flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl">Mi última cita</h2>
        <p className="text-sm text-muted">Aún no tienes ninguna cita agendada.</p>
      </Card>
    );
  }
  const status = STATUS[appointment.status];
  return (
    <Card id="mi-cita">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl">Mi última cita</h2>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", status.style)}>{status.label}</span>
      </div>
      <p className="mt-4 font-display text-xl font-semibold">{formatLongDate(appointment.date)}</p>
      <p className="text-sm text-muted">{formatTime(appointment.date)} h</p>
      <InstitutionBlock name={appointment.institutionName} address={appointment.institutionAddress} />
      {appointment.status === "Pending" && (
        <>
          <details className="group mt-4 rounded-2xl bg-canvas p-4">
            <summary className="flex list-none items-center justify-between gap-2 text-sm font-semibold">
              Cómo prepararte
              <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3">
              <PreparationList />
            </div>
          </details>
          <div className="mt-5">
            <CancelAppointmentButton id={appointment.id} compact />
          </div>
        </>
      )}
    </Card>
  );
}

function LastDonationCard({ donation }: { donation?: DonationView }) {
  return (
    <Card>
      <h2 className="text-2xl">Última donación</h2>
      {donation ? (
        <>
          <p className="mt-4 font-display text-xl font-semibold">{formatLongDate(donation.date)}</p>
          <InstitutionBlock name={donation.institutionName} address={donation.institutionAddress} />
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">Aquí aparecerá tu última donación cuando completes una.</p>
      )}
    </Card>
  );
}

function DonationsTable({ donations, page }: { donations: DonationView[]; page: number }) {
  const totalPages = Math.max(1, Math.ceil(donations.length / DONATIONS_PER_PAGE));
  const current = Math.min(Math.max(1, page), totalPages);
  const visible = donations.slice((current - 1) * DONATIONS_PER_PAGE, current * DONATIONS_PER_PAGE);

  return (
    <Card className="mt-6">
      <h2 className="text-2xl">Mis donaciones</h2>
      {donations.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Aún no tienes donaciones.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-semibold">N.º</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Fecha</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Sede</th>
                <th scope="col" className="hidden py-2 font-semibold md:table-cell">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((donation) => (
                <tr key={donation.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-canvas">
                  <td className="py-3.5 pr-4 font-semibold">{donation.number}</td>
                  <td className="py-3.5 pr-4">{formatShortDate(donation.date)}</td>
                  <td className="py-3.5 pr-4">{donation.institutionName}</td>
                  <td className="hidden py-3.5 text-muted md:table-cell">{donation.institutionAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <nav aria-label="Paginación" className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Link
            aria-label="Página anterior"
            aria-disabled={current === 1}
            href={`/premios?pagina=${Math.max(1, current - 1)}`}
            className={cn("grid size-10 place-items-center rounded-full hover:bg-blush-soft", current === 1 && "pointer-events-none opacity-30")}
          >
            <ChevronLeft aria-hidden />
          </Link>
          <span>
            Página {current} de {totalPages}
          </span>
          <Link
            aria-label="Página siguiente"
            aria-disabled={current === totalPages}
            href={`/premios?pagina=${Math.min(totalPages, current + 1)}`}
            className={cn("grid size-10 place-items-center rounded-full hover:bg-blush-soft", current === totalPages && "pointer-events-none opacity-30")}
          >
            <ChevronRight aria-hidden />
          </Link>
        </nav>
      )}
    </Card>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireUser();
  const [{ donations, lastAppointment }, context, { pagina }] = await Promise.all([
    getDonorHistory(profile.id),
    getBookingContext(profile),
    searchParams,
  ]);
  const lastDonation = donations[0];
  const next = nextStepFor(profile, lastAppointment, context);
  const { pointsToNext, level } = levelProgress(profile.totalPoints);

  return (
    <>
      <MedalReveal userId={profile.id} points={profile.totalPoints} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col justify-between gap-8 rounded-3xl bg-wine p-7 text-white shadow-lift sm:p-9 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl">¡Hola, {profile.firstName}!</h1>
              <p className="mt-2 text-white/75">
                Te faltan {pointsToNext} puntos para llegar al nivel {level + 1}.
              </p>
            </div>
            <DropGauge points={profile.totalPoints} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/10 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand">
                <next.icon aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{next.title}</p>
                <p className="text-sm text-white/75 first-letter:uppercase">{next.text}</p>
              </div>
            </div>
            <Link href={next.href} className={buttonClass("inverse", undefined, "sm")}>
              {next.action}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </section>
        <DonorCard name={`${profile.firstName} ${profile.lastName}`} bloodType={profile.bloodType} donations={donations.length} />
      </div>

      <div className="mt-6">
        <StatsRow points={profile.totalPoints} donations={donations.length} gender={profile.gender} lastDonation={lastDonation?.date} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-6 text-2xl">Mis medallas</h2>
        <MedalsGrid points={profile.totalPoints} />
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <AppointmentCard appointment={lastAppointment} />
        <LastDonationCard donation={lastDonation} />
      </div>

      <DonationsTable donations={donations} page={Number(pagina) || 1} />
    </>
  );
}

export default function AwardsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <SuspenseReveal fallback={<PageSkeleton />}>
          <Content searchParams={searchParams} />
        </SuspenseReveal>
      </div>
    </PageTransition>
  );
}
