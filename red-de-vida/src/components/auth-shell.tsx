import { CalendarCheck, Medal, ShieldCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const POINTS = [
  { icon: CalendarCheck, text: "Agenda tu cita eligiendo hospital, fecha y hora." },
  { icon: Medal, text: "Suma puntos y desbloquea medallas con cada donación." },
  { icon: ShieldCheck, text: "Consulta tu historial y tu próxima fecha para donar." },
];

export function AuthShell({ title, subtitle, children, wide }: { title: string; subtitle: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 lg:grid-cols-[1fr_1.15fr] lg:py-14">
      <aside className="relative hidden min-h-[36rem] overflow-hidden rounded-[2rem] bg-wine p-10 text-white lg:flex lg:flex-col">
        <Image src="/heroes.png" alt="" width={512} height={512} className="absolute -right-10 -bottom-10 size-72" />
        <div className="relative">
          <h2 className="text-4xl leading-tight">Cada donación puede salvar hasta tres vidas</h2>
        </div>
        <ul className="relative mt-8 grid gap-4">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-white/85">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="pt-2 text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </aside>
      <div className={wide ? "w-full" : "mx-auto flex w-full max-w-md flex-col justify-center"}>
        <h1 className="text-4xl">{title}</h1>
        <p className="mt-2 mb-7 text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
