import { Check, ChevronDown, Droplet, Lock, MapPin } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { type BloodType, type Gender, levelProgress, MEDALS, nextEligibleDate } from "@/domain/rules";
import { formatLongDate } from "@/lib/format";
import { InstitutionMap } from "./institution-map";
import { CountUp } from "./motion/count-up";
import { cn } from "./ui";

export function LevelBar({ points }: { points: number }) {
  const { level, percent, pointsToNext } = levelProgress(points);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-xl font-semibold">Nivel {level}</p>
        <p className="text-sm text-muted">
          {pointsToNext} pts para el nivel {level + 1}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={`Progreso hacia el nivel ${level + 1}`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-blush-soft"
      >
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

const DROP_PATH = "M60 6C60 6 14 58 14 92a46 46 0 0 0 92 0C106 58 60 6 60 6Z";
const DROP_TOP = 6;
const DROP_BOTTOM = 138;
/** Con 0 % se deja un resto de líquido: una gota vacía se leería como un error de carga. */
const MIN_VISIBLE_PERCENT = 6;

/** La sangre como medida del nivel: la gota se llena hasta el siguiente. */
export function DropGauge({ points }: { points: number }) {
  const { level, percent, pointsToNext } = levelProgress(points);
  const height = DROP_BOTTOM - DROP_TOP;
  const surface = DROP_BOTTOM - (height * Math.max(percent, MIN_VISIBLE_PERCENT)) / 100;
  return (
    <div
      role="progressbar"
      aria-label={`Nivel ${level}: faltan ${pointsToNext} puntos para el siguiente`}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative h-36 w-31 shrink-0"
    >
      <svg viewBox="0 0 120 140" className="size-full">
        <clipPath id="drop-gauge">
          <path d={DROP_PATH} />
        </clipPath>
        <path d={DROP_PATH} fill="currentColor" className="text-white/10" />
        <g clipPath="url(#drop-gauge)">
          <g className="drop-level" style={{ "--drop-level": `${surface}px`, "--drop-empty": `${DROP_BOTTOM}px` } as CSSProperties}>
            <path d="M-60 4q15 -8 30 0t30 0t30 0t30 0t30 0t30 0t30 0v140h-180Z" fill="currentColor" className="drop-wave text-brand" />
          </g>
        </g>
        <path d={DROP_PATH} fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30" />
      </svg>
      <div className="absolute inset-x-0 bottom-[11%] grid text-center">
        <span className="text-[0.6rem] font-bold tracking-widest text-white/80 uppercase">Nivel</span>
        <span className="font-display text-4xl leading-none font-semibold">{level}</span>
      </div>
    </div>
  );
}

/** Carné digital, inspirado en el de los centros de sangre. */
export function DonorCard({ name, bloodType, donations }: { name: string; bloodType: BloodType; donations: number }) {
  return (
    <div className="card-shine relative flex h-full min-h-56 flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br from-brand to-brand-deep p-7 text-white shadow-lift">
      <Droplet aria-hidden className="absolute -right-8 -bottom-10 size-52 fill-white/10 text-transparent" />
      <div className="relative flex items-center gap-2">
        <Image src="/logo.svg" alt="" width={26} height={28} />
        <p className="text-sm font-semibold">Carné de donante</p>
      </div>
      <div className="relative">
        <p className="text-xs text-white/80">Tipo de sangre</p>
        <p className="font-display text-6xl leading-none font-semibold">{bloodType}</p>
      </div>
      <div className="relative flex items-end justify-between gap-4 text-sm">
        <p className="font-semibold">{name}</p>
        <p className="shrink-0 text-white/85">{donations === 1 ? "1 donación" : `${donations} donaciones`}</p>
      </div>
    </div>
  );
}

export function StatsRow({ points, donations, gender, lastDonation }: { points: number; donations: number; gender: Gender; lastDonation?: string }) {
  const eligible = nextEligibleDate(gender, lastDonation);
  const stats = [
    { label: "Donaciones", value: <CountUp value={donations} /> },
    { label: "Puntos", value: <CountUp value={points} /> },
    { label: "Vidas que pudiste salvar", value: <CountUp value={donations * 3} />, wide: true },
    { label: "Próxima donación desde", value: eligible ? formatLongDate(eligible) : "Hoy mismo", wide: true },
  ];
  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className={cn("rounded-3xl border border-line bg-surface p-5 shadow-card", stat.wide && "col-span-2 lg:col-span-1")}>
          <dt className="text-sm text-muted">{stat.label}</dt>
          <dd className="mt-1 font-display text-2xl font-semibold">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Las medallas como un recorrido: se entiende de un vistazo cuánto falta. */
export function MedalsGrid({ points }: { points: number }) {
  const next = MEDALS.find((medal) => points < medal.pointsRequired);
  return (
    <>
      <ol className="grid grid-cols-3 gap-y-6 sm:grid-cols-6">
        {MEDALS.map((medal, index) => {
          const unlocked = points >= medal.pointsRequired;
          const nextUnlocked = points >= (MEDALS[index + 1]?.pointsRequired ?? Infinity);
          return (
            <li key={medal.level} className="relative flex flex-col items-center gap-2 text-center">
              {index < MEDALS.length - 1 && (
                <span aria-hidden className="absolute top-8 left-1/2 hidden h-0.5 w-full bg-line sm:block">
                  {nextUnlocked && <span style={{ animationDelay: `${index * 140}ms` }} className="block size-full origin-left animate-grow-x bg-brand" />}
                </span>
              )}
              <span className="relative z-10 grid size-16 place-items-center rounded-full bg-surface">
                <Image
                  src={`/medals/medal${medal.level}.svg`}
                  alt={`${medal.name}${unlocked ? "" : " (bloqueada)"}`}
                  width={64}
                  height={64}
                  style={unlocked ? { animationDelay: `${index * 140}ms` } : undefined}
                  className={cn("size-14 object-contain", unlocked ? "animate-pop" : "opacity-35 grayscale")}
                />
                <span
                  aria-hidden
                  className={cn(
                    "absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full border-2 border-surface",
                    unlocked ? "bg-success text-white" : "bg-line text-muted",
                  )}
                >
                  {unlocked ? <Check className="size-3" strokeWidth={3} /> : <Lock className="size-2.5" />}
                </span>
              </span>
              <span className={cn("text-xs font-semibold", unlocked ? "text-ink" : "text-muted")}>{medal.pointsRequired} pts</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">
        {next ? (
          <>
            Te faltan <strong className="text-ink">{next.pointsRequired - points} puntos</strong> para tu próxima medalla.
          </>
        ) : (
          "¡Desbloqueaste todas las medallas!"
        )}
      </p>
    </>
  );
}

export function InstitutionBlock({ name, address }: { name: string; address: string }) {
  return (
    <div className="mt-4">
      <p className="flex items-start gap-2 text-sm font-semibold">
        <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
        {name}
      </p>
      {address && <p className="mt-1 ml-6 text-sm text-muted">{address}</p>}
      {address && (
        <details className="group mt-3">
          <summary className="ml-6 inline-flex list-none items-center gap-1 text-sm font-semibold text-brand-deep hover:underline">
            Ver mapa
            <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3">
            <InstitutionMap name={name} address={address} />
          </div>
        </details>
      )}
    </div>
  );
}
