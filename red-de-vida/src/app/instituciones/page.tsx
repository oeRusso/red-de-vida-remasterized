import type { Metadata } from "next";
import { connection } from "next/server";
import { InstitutionsDirectory } from "@/components/institutions-directory";
import { PageTransition, SuspenseReveal } from "@/components/motion/transitions";
import { PageHeading, Skeleton } from "@/components/ui";
import { getInstitutionOptions } from "@/server/dal";

export const metadata: Metadata = {
  title: "Dónde donar",
  description: "Encuentra la sede de Red de Vida que te quede mejor, con su dirección y horarios.",
};

async function Content() {
  // Sin sesión no hay ninguna lectura de la petición: esto evita consultar la base durante el build.
  await connection();
  return <InstitutionsDirectory institutions={await getInstitutionOptions()} />;
}

export default function InstitutionsPage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <PageHeading title="Dónde donar" description="Encuentra la sede que te quede mejor y agenda tu cita en minutos." />
        <SuspenseReveal
          fallback={
            <div role="status" aria-label="Cargando" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          }
        >
          <Content />
        </SuspenseReveal>
      </div>
    </PageTransition>
  );
}
