import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking-wizard";
import { PageTransition, SuspenseReveal } from "@/components/motion/transitions";
import { PageHeading, PageSkeleton } from "@/components/ui";
import { getBookingContext, getInstitutionOptions, requireUser } from "@/server/dal";

export const metadata: Metadata = { title: "Agendar cita" };

type SearchParams = Promise<{ institucion?: string }>;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireUser();
  const [context, institutions, { institucion }] = await Promise.all([
    getBookingContext(profile),
    getInstitutionOptions(),
    searchParams,
  ]);
  const preselected = institutions.some((option) => option.id === institucion) ? institucion : undefined;
  return <BookingWizard profile={profile} institutions={institutions} preselected={preselected} {...context} />;
}

export default function BookingPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <PageHeading title="Agenda tu cita" description="Tres pasos y tu lugar queda reservado." />
        <SuspenseReveal fallback={<PageSkeleton />}>
          <Content searchParams={searchParams} />
        </SuspenseReveal>
      </div>
    </PageTransition>
  );
}
