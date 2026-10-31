import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { Alert, Skeleton } from "@/components/ui";
import { getOptionalUser } from "@/server/dal";

export const metadata: Metadata = { title: "Iniciar sesión" };

type SearchParams = Promise<{ next?: string; registrado?: string }>;

/** Solo rutas internas: `next` viene de la URL y no debe poder sacar al usuario del sitio. */
const safeNext = (next?: string) => (next?.startsWith("/") && !next.startsWith("//") ? next : "/premios");

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (await getOptionalUser()) redirect("/premios");
  const { next, registrado } = await searchParams;
  return (
    <>
      {registrado && (
        <Alert tone="success" className="mb-4">
          Registro exitoso. Ya puedes iniciar sesión.
        </Alert>
      )}
      <LoginForm next={safeNext(next)} />
    </>
  );
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthShell title="Iniciar sesión" subtitle="Te damos la bienvenida de nuevo a Red de Vida.">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
