"use client";

import { CalendarPlus, ChevronDown, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { ConfirmDialog } from "./confirm-dialog";
import { buttonClass, cn } from "./ui";

type Props = { user: { firstName: string; isAdmin: boolean } | null };

const linkClass = (active: boolean) =>
  cn(
    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
    active ? "bg-blush-soft text-brand-deep" : "text-ink hover:text-brand",
  );

export function SiteNav({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const links = user
    ? [
        { href: "/premios", label: "Premios" },
        { href: "/instituciones", label: "Dónde donar" },
        { href: "/perfil", label: "Perfil" },
        ...(user.isAdmin ? [{ href: "/admin", label: "Administración" }] : []),
      ]
    : [
        { href: "/instituciones", label: "Dónde donar" },
        { href: "/#como-funciona", label: "Cómo funciona" },
      ];

  const navItems = links.map((link) => (
    <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={linkClass(pathname === link.href)}>
      {link.label}
    </Link>
  ));

  const logoutControl = (
    <ConfirmDialog
      title="Cerrar sesión"
      description="¿Seguro que deseas cerrar sesión?"
      confirmLabel="Cerrar sesión"
      onConfirm={logout}
      trigger={{ children: "Cerrar sesión", variant: "ghost" }}
    />
  );

  // El botón de agendar está siempre a la vista, como en los centros de sangre de referencia.
  const bookLink = (
    <Link href="/agendar" onClick={() => setOpen(false)} className={buttonClass("primary", "!min-h-10 !py-2")}>
      <CalendarPlus aria-hidden className="size-4" />
      Agendar cita
    </Link>
  );

  const loginLink = (
    <Link href="/login" onClick={() => setOpen(false)} className={linkClass(pathname === "/login")}>
      Iniciar sesión
    </Link>
  );

  return (
    <>
      <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
        {navItems}
        {!user && loginLink}
        <span className="ml-2">{bookLink}</span>
        {user && (
          <details className="group relative ml-2">
            <summary className="flex list-none items-center gap-2 rounded-full border border-line py-1.5 pr-3 pl-1.5 text-sm font-semibold hover:border-brand">
              <span className="grid size-7 place-items-center rounded-full bg-blush text-brand-deep">
                <UserRound aria-hidden className="size-4" />
              </span>
              {user.firstName}
              <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 z-20 mt-2 rounded-2xl border border-line bg-surface p-2 whitespace-nowrap shadow-lift">
              {logoutControl}
            </div>
          </details>
        )}
      </nav>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-movil"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen(!open)}
        className="grid size-11 place-items-center rounded-full text-ink hover:bg-blush-soft lg:hidden"
      >
        {open ? <X aria-hidden /> : <Menu aria-hidden />}
      </button>

      {open && (
        <nav
          id="menu-movil"
          aria-label="Principal móvil"
          className="absolute inset-x-0 top-full z-20 flex flex-col gap-1 border-b border-line bg-surface p-4 shadow-card lg:hidden"
        >
          {navItems}
          {!user && loginLink}
          <div className="mt-2 grid">{bookLink}</div>
          {user && logoutControl}
        </nav>
      )}
    </>
  );
}
