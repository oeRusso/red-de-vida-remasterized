import type { Metadata } from "next";
import { DeleteAccount } from "@/components/delete-account";
import { DonorCard, LevelBar } from "@/components/donor-widgets";
import { PageTransition, SuspenseReveal } from "@/components/motion/transitions";
import { ProfileForm } from "@/components/profile-form";
import { Card, PageHeading, PageSkeleton } from "@/components/ui";
import { GENDER_LABELS } from "@/domain/rules";
import { formatLongDate } from "@/lib/format";
import { requireUser } from "@/server/dal";

export const metadata: Metadata = { title: "Perfil" };

async function Content() {
  const { profile } = await requireUser();
  const facts = [
    { label: "Fecha de nacimiento", value: formatLongDate(profile.birthday) },
    { label: "Género", value: GENDER_LABELS[profile.gender] },
    { label: "Puntos totales", value: profile.totalPoints },
  ];

  return (
    <>
      <PageHeading title="Mi perfil" description="Mantén tus datos al día para agendar sin contratiempos." />
      <div className="grid items-start gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Card>
          <h2 className="mb-5 text-2xl">Mis datos</h2>
          <ProfileForm profile={profile} />
        </Card>
        <div className="flex flex-col gap-6">
          <DonorCard name={`${profile.firstName} ${profile.lastName}`} bloodType={profile.bloodType} donations={profile.donationCount} />
          <Card>
            <LevelBar points={profile.totalPoints} />
            <dl className="mt-5 grid gap-3 text-sm">
              {facts.map((fact) => (
                <div key={fact.label} className="flex justify-between gap-4">
                  <dt className="text-muted">{fact.label}</dt>
                  <dd className="text-right font-semibold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <h2 className="text-xl">Eliminar cuenta</h2>
            <p className="mt-1 mb-4 text-sm text-muted">Borra tus datos, donaciones, citas y medallas de forma permanente.</p>
            <DeleteAccount userId={profile.id} />
          </Card>
        </div>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <SuspenseReveal fallback={<PageSkeleton />}>
          <Content />
        </SuspenseReveal>
      </div>
    </PageTransition>
  );
}
