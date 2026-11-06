import Image from "next/image";
import Link from "next/link";

const COLUMNS = [
  {
    title: "Donar",
    links: [
      { href: "/agendar", label: "Agendar cita" },
      { href: "/instituciones", label: "Dónde donar" },
      { href: "/#requisitos", label: "¿Puedo donar?" },
    ],
  },
  {
    title: "Mi cuenta",
    links: [
      { href: "/premios", label: "Premios" },
      { href: "/perfil", label: "Perfil" },
      { href: "/registro", label: "Registrarme" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { href: "/#como-funciona", label: "Cómo funciona" },
      { href: "/#preguntas", label: "Preguntas frecuentes" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-wine text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="" width={38} height={40} />
            <p className="font-display text-xl font-semibold">Red de Vida</p>
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Juntos podemos marcar la diferencia. Dona sangre, salva vidas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sm font-semibold">{column.title}</p>
              <ul className="mt-3 grid gap-2 text-sm text-white/70">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-white/60">
        Red de Vida · Proyecto demostrativo: las sedes y las citas son ficticias.
      </p>
    </footer>
  );
}
