"use client";

import { CalendarPlus, ChevronDown, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ConfirmDialog } from "./confirm-dialog";
import { buttonClass, cn } from "./ui";

type Props = { user: { firstName: string; isAdmin: boolean } | null };

/** Pantallas donde ya hay una acción propia que haría redundante el botón del encabezado. */
const NO_BOOK_LINK = ["/agendar", "/login", "/registro", "/premios"];
const AUTH_PAGES = ["/login", "/registro"];

const linkClass = (active: boolean) =>
  cn(
    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
    active ? "bg-blush-soft text-brand-deep" : "text-ink hover:text-brand",
  );

/** En la landing, el botón del encabezado aparece recién cuando el del hero sale de la vista. */
function useHeroCtaVisible(enabled: boolean) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const cta = enabled ? document.getElementById("hero-cta") : null;
    if (!cta) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(cta);
    return () => observer.disconnect();
  }, [enabled]);
  return visible;
}

function AccountMenu({ firstName, active, logoutControl }: { firstName: string; active: boolean; logoutControl: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={root} className="relative ml-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-cuenta"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-line py-1.5 pr-3 pl-1.5 text-sm font-semibold transition-colors hover:border-brand"
      >
        <span className="grid size-7 place-items-center rounded-full bg-blush text-brand-deep">
          <UserRound aria-hidden className="size-4" />
        </span>
        {firstName}
        <ChevronDown aria-hidden className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id="menu-cuenta" className="absolute right-0 z-20 mt-2 grid min-w-44 gap-1 rounded-2xl border border-line bg-surface p-2 whitespace-nowrap shadow-lift">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn("flex min-h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors hover:bg-blush-soft", active && "bg-blush-soft text-brand-deep")}
          >
            Mi perfil
          </Link>
          {logoutControl}
        </div>
      )}
    </div>
  );
}

export function SiteNav({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const heroCtaVisible = useHeroCtaVisible(pathname === "/");

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const links = user
    ? [
        { href: "/premios", label: "Premios" },
        { href: "/instituciones", label: "Dónde donar" },
        ...(user.isAdmin ? [{ href: "/admin", label: "Administración" }] : []),
      ]
    : [
        { href: "/instituciones", label: "Dónde donar" },
        { href: "/#como-funciona", label: "Cómo funciona" },
      ];

  const renderLinks = (items: typeof links) =>
    items.map((link) => (
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
      trigger={{ children: "Cerrar sesión", variant: "ghost", size: "sm", className: "w-full !justify-start !rounded-xl" }}
    />
  );

  const showBookLink = !NO_BOOK_LINK.includes(pathname);
  const bookLink = (
    <Link href="/agendar" onClick={() => setOpen(false)} className={buttonClass("primary")}>
      <CalendarPlus aria-hidden className="size-4" />
      Agendar cita
    </Link>
  );

  const loginLink = !user && !AUTH_PAGES.includes(pathname) && (
    <Link href="/login" onClick={() => setOpen(false)} className={linkClass(false)}>
      Iniciar sesión
    </Link>
  );

  return (
    <>
      <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
        {renderLinks(links)}
        {loginLink}
        {showBookLink && !(pathname === "/" && heroCtaVisible) && <span className="ml-2 animate-rise">{bookLink}</span>}
        {user && <AccountMenu firstName={user.firstName} active={pathname === "/perfil"} logoutControl={logoutControl} />}
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
          {renderLinks(user ? [...links, { href: "/perfil", label: "Mi perfil" }] : links)}
          {loginLink}
          {showBookLink && <div className="mt-2 grid">{bookLink}</div>}
          {user && logoutControl}
        </nav>
      )}
    </>
  );
}
