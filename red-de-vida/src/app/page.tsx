import {
  ArrowRight,
  Award,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Clock,
  Droplets,
  HeartPulse,
  MapPin,
  Medal,
  ShieldCheck,
  Timer,
  UserRoundPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EligibilityCheck } from "@/components/eligibility-check";
import { buttonClass, Eyebrow, SectionHeading } from "@/components/ui";
import {
  BOOKING_WINDOW_DAYS,
  DONATION_INTERVAL_MONTHS,
  MEDALS,
  PENDING_GRACE_DAYS,
  POINTS_PER_DONATION,
} from "@/domain/rules";

const FACTS = [
  { value: "Hasta 3", label: "vidas por cada donación" },
  { value: "Hasta 1 hora", label: "dura una donación promedio" },
  { value: `${POINTS_PER_DONATION} puntos`, label: "por cada donación" },
  { value: `${MEDALS.length} medallas`, label: "para desbloquear" },
];

const REASONS = [
  { icon: Timer, title: "Es rápido y seguro", text: "Una donación promedio no toma más de una hora." },
  { icon: Droplets, title: "Tu cuerpo se regenera", text: "Donar sangre ayuda a renovar tus células sanguíneas." },
  { icon: HeartPulse, title: "Salva vidas", text: "Tu sangre puede marcar la diferencia en emergencias médicas, tratamientos de cáncer, cirugías y más." },
];

const STEPS = [
  { icon: UserRoundPlus, title: "Crea tu cuenta", text: "Regístrate o inicia sesión en un minuto." },
  { icon: CalendarCheck, title: "Agenda tu cita", text: "Elige hospital, fecha y hora disponibles." },
  { icon: Droplets, title: "Dona sangre", text: "Asiste a tu cita y completa la donación." },
  { icon: Medal, title: "Gana puntos", text: "Suma puntos, sube de nivel y desbloquea medallas." },
];

const FAQS = [
  {
    question: "¿Cuánto tiempo toma donar?",
    answer: "Una donación promedio no toma más de una hora.",
  },
  {
    question: "¿Cada cuánto puedo donar?",
    answer: `Los hombres deben esperar ${DONATION_INTERVAL_MONTHS.Male} meses entre donaciones y las mujeres ${DONATION_INTERVAL_MONTHS.Female}. Tu panel te muestra la fecha exacta en la que podrás volver a donar.`,
  },
  {
    question: "¿Con cuánta anticipación puedo agendar?",
    answer: `Puedes reservar hasta ${BOOKING_WINDOW_DAYS} días a partir de tu primera fecha disponible. Solo puedes tener una cita pendiente a la vez.`,
  },
  {
    question: "¿Puedo agendar si tengo una enfermedad registrada?",
    answer: "No. Mientras tengas una enfermedad registrada en tu perfil no podrás agendar una cita.",
  },
  {
    question: "¿Qué pasa si no puedo asistir?",
    answer: `Puedes cancelar tu cita desde tu panel y el horario quedará libre para otra persona. Si no asistes, la cita caduca sola ${PENDING_GRACE_DAYS === 1 ? "al terminar el día siguiente" : `${PENDING_GRACE_DAYS} días después`} y podrás agendar otra.`,
  },
  {
    question: "¿Cómo gano puntos y medallas?",
    answer: `Cada donación confirmada suma ${POINTS_PER_DONATION} puntos. Con ellos subes de nivel y desbloqueas ${MEDALS.length} medallas.`,
  },
];

/** Vista previa ilustrativa del panel: son datos de ejemplo, no de ninguna persona. */
function HeroVisual() {
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
      <div className="absolute inset-[6%] rounded-full bg-blush/70" />
      <div className="absolute inset-[18%] rounded-full bg-blush" />
      <Image
        src="/heroes.png"
        alt=""
        width={512}
        height={512}
        priority
        className="absolute inset-[20%] size-[60%] animate-float object-contain"
      />
      <div className="absolute top-[8%] left-0 w-56 rounded-2xl border border-line bg-surface p-4 shadow-lift">
        <p className="flex items-center gap-2 text-xs font-semibold text-muted">
          <CalendarDays className="size-4 text-brand" />
          Tu próxima cita
        </p>
        <p className="mt-1 font-display text-lg font-semibold">Lunes, 10:30 h</p>
        <p className="text-xs text-muted">Hospital de tu elección</p>
      </div>
      <div className="absolute right-0 bottom-[10%] flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lift">
        <span className="grid size-11 place-items-center rounded-full bg-blush-soft text-brand">
          <Award />
        </span>
        <div>
          <p className="text-sm font-bold">¡Medalla desbloqueada!</p>
          <p className="text-xs text-muted">+{POINTS_PER_DONATION} puntos</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden bg-linear-to-b from-blush-soft to-canvas">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="animate-rise">
            <Eyebrow>Donación de sangre</Eyebrow>
            <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Sé el héroe que <span className="text-brand italic">alguien necesita</span> hoy
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Juntos podemos marcar la diferencia. Cada donación de sangre puede salvar hasta tres vidas, y agendarla te toma
              solo unos minutos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/agendar" className={buttonClass("primary", "!px-7")}>
                Agendar mi cita
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="#requisitos" className={buttonClass("secondary", "!px-7")}>
                ¿Puedo donar?
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted">
              <li className="flex items-center gap-2">
                <Clock aria-hidden className="size-4 text-brand" />
                Elige día y horario
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden className="size-4 text-brand" />
                Elige dónde donar
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck aria-hidden className="size-4 text-brand" />
                Rápido y seguro
              </li>
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section aria-label="Datos clave" className="border-y border-line bg-surface">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 lg:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label}>
              <dd className="font-display text-3xl font-semibold text-brand">{fact.value}</dd>
              <dt className="mt-1 text-sm text-muted">{fact.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading eyebrow="Por qué donar" title="Un gesto pequeño con un impacto enorme" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="group rounded-3xl border border-line bg-surface p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
              <span className="grid size-13 place-items-center rounded-2xl bg-blush-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                <Icon aria-hidden />
              </span>
              <h3 className="mt-5 text-xl">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="bg-wine text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-2xl">
            <Eyebrow onDark>Cómo funciona</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl">De tu registro a tu primera medalla</h2>
          </div>
          <ol className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <span aria-hidden className="absolute top-7 right-[12%] left-[12%] hidden h-px bg-white/20 lg:block" />
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="relative">
                <span className="grid size-14 place-items-center rounded-full bg-brand ring-8 ring-wine">
                  <Icon aria-hidden />
                </span>
                <p className="mt-5 text-xs font-bold tracking-[0.14em] text-blush uppercase">Paso {index + 1}</p>
                <h3 className="mt-1 text-xl">{title}</h3>
                <p className="mt-2 text-sm text-white/75">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="requisitos" className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Requisitos"
            title="¿Puedo donar?"
            description="Responde tres preguntas para saber si cumples los requisitos básicos antes de agendar."
          />
          <div className="mt-6 rounded-3xl bg-blush-soft p-6">
            <h3 className="text-xl">Sobre nosotros</h3>
            <p className="mt-2 text-muted">
              Nuestra misión es crear un impacto positivo en la vida de las personas mediante la promoción de la donación de
              sangre. Desde 2016 trabajamos para facilitar el acceso a la donación mediante innovación, educación y compromiso
              con nuestra comunidad.
            </p>
          </div>
        </div>
        <EligibilityCheck />
      </section>

      <section id="preguntas" className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading eyebrow="Preguntas frecuentes" title="Lo que necesitas saber" />
            <Link href="/instituciones" className={buttonClass("secondary", "mt-6")}>
              Ver dónde donar
            </Link>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex list-none items-center justify-between gap-4 py-5 font-semibold transition-colors hover:text-brand">
                  {faq.question}
                  <ChevronDown aria-hidden className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-brand px-6 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl sm:text-5xl">¡Haz tu primera cita hoy!</h2>
          <p className="mt-3 text-lg text-white/90">Un pequeño gesto puede cambiar el mundo.</p>
          <Link href="/registro" className={buttonClass("inverse", "mt-7 !px-8")}>
            Dona ahora y salva vidas
          </Link>
        </div>
      </section>

      {/* Espacio para que la barra fija no tape el pie en móvil. */}
      <div aria-hidden className="h-20 lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-3 backdrop-blur lg:hidden">
        <Link href="/agendar" className={buttonClass("primary", "w-full")}>
          Agendar mi cita
        </Link>
      </div>
    </>
  );
}
