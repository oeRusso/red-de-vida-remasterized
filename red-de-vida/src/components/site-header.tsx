import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getOptionalUser } from "@/server/dal";
import { SiteNav } from "./site-nav";

async function AccountNav() {
  const current = await getOptionalUser();
  const user = current && { firstName: current.profile.firstName, isAdmin: current.isAdmin };
  return <SiteNav user={user} />;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30">
      <div className="hidden bg-wine text-xs text-white/80 lg:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-4">
          <p>Cada donación de sangre puede salvar hasta tres vidas.</p>
          <nav aria-label="Enlaces rápidos" className="flex gap-6">
            <Link href="/instituciones" className="hover:text-white">
              Dónde donar
            </Link>
            <Link href="/#requisitos" className="hover:text-white">
              ¿Puedo donar?
            </Link>
            <Link href="/#preguntas" className="hover:text-white">
              Preguntas frecuentes
            </Link>
          </nav>
        </div>
      </div>
      <div className="border-b border-line bg-surface/95 backdrop-blur">
        <div className="relative mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-3">
            {/* El logo es blanco: necesita fondo de marca. */}
            <span className="grid size-11 place-items-center rounded-full bg-brand">
              <Image src="/logo.svg" alt="" width={28} height={30} priority />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Red de Vida</span>
          </Link>
          <Suspense fallback={<div className="h-11" />}>
            <AccountNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
