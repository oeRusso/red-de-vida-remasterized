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
import type { CSSProperties } from "react";
import { EligibilityCheck } from "@/components/eligibility-check";
import { PulseLine } from "@/components/motion/pulse-line";
import { PageTransition } from "@/components/motion/transitions";
import { PreparationList } from "@/components/preparation-list";
import { buttonClass, Eyebrow, SectionHeading } from "@/components/ui";
import {
  BOOKING_WINDOW_DAYS,
  DONATION_INTERVAL_MONTHS,
  MEDALS,
  PENDING_GRACE_DAYS,
  POINTS_PER_DONATION,
} from "@/domain/rules";
import { AFTER_DONATING, BLOOD_COMPONENTS, BLOOD_TESTS, DONATION_DAY } from "@/lib/donation-guide";

const FACTS = [
  { value: "Hasta 3", label: "vidas por cada donación" },
  { value: "450 ml", label: "de sangre en cada extracción" },
  { value: "7 a 10 min", label: "dura la extracción" },
  { value: "Hasta 1 hora", label: "dura toda la visita" },
];

const REASONS = [
  { icon: Timer, title: "Es rápido y seguro", text: "Una donación promedio no toma más de una hora." },
  { icon: Droplets, title: "Tu cuerpo se regenera", text: "Donar sangre ayuda a renovar tus células sanguíneas." },
  { icon: HeartPulse, title: "Salva vidas", text: "Tu sangre puede marcar la diferencia en emergencias médicas, tratamientos de cáncer, cirugías y más." },
];

const STEPS = [
  { icon: UserRoundPlus, title: "Crea tu cuenta", text: "Regístrate o inicia sesión en un minuto." },
  { icon: CalendarCheck, title: "Agenda tu cita", text: "Elige sede, fecha y hora disponibles." },
  { icon: Droplets, title: "Dona sangre", text: "Asiste a tu cita y completa la donación." },
  { icon: Medal, title: "Gana puntos", text: "Suma puntos, sube de nivel y desbloquea medallas." },
];

const FAQS = [
  {
    question: "¿Cuánto tiempo toma donar?",
    answer: "La extracción dura entre 7 y 10 minutos. Con la entrevista, los controles y el refrigerio, la visita completa no suele tomar más de una hora.",
  },
  {
    question: "¿Tengo que ir en ayunas?",
    answer: "No. Desayuna o almuerza como siempre y toma abundante líquido, sin alcohol.",
  },
  {
    question: "¿Reservar una cita garantiza que pueda donar?",
    answer: "No. La cita te guarda el lugar, pero el equipo de salud decide ese día, después de la entrevista y los controles. Si tienes dudas, también puedes elegir no donar.",
  },
  {
    question: "¿Me hice un tatuaje, puedo donar?",
    answer: "Debe haber pasado un año desde tu último tatuaje o piercing. Durante el embarazo tampoco se puede donar.",
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
      <div className="absolute inset-[6%] animate-heartbeat rounded-full bg-blush/70" />
      <div className="absolute inset-[18%] animate-heartbeat rounded-full bg-blush [animation-delay:0.14s]" />
      <Image
        src="/heroes.png"
        alt=""
        width={512}
        height={512}
        priority
        className="absolute inset-[20%] size-[60%] animate-float object-contain"
      />
      <div className="absolute top-[8%] left-0 w-56 animate-rise [animation-delay:0.45s]">
        <div className="animate-float-slow rounded-2xl border border-line bg-surface p-4 shadow-lift">
          <p className="flex items-center gap-2 text-xs font-semibold text-muted">
            <CalendarDays className="size-4 text-brand" />
            Tu próxima cita
          </p>
          <p className="mt-1 font-display text-lg font-semibold">Lunes, 10:30 h</p>
          <p className="text-xs text-muted">La sede que elijas</p>
        </div>
      </div>
      <div className="absolute right-0 bottom-[10%] animate-rise [animation-delay:0.65s]">
        <div className="flex animate-float-slow items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lift [animation-delay:-3s]">
          <span className="grid size-11 place-items-center rounded-full bg-blush-soft text-brand">
            <Award />
          </span>
          <div>
            <p className="text-sm font-bold">¡Medalla desbloqueada!</p>
            <p className="text-xs text-muted">+{POINTS_PER_DONATION} puntos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const step = (index: number) => ({ "--reveal-step": index }) as CSSProperties;

export default function HomePage() {
  return (
    <PageTransition>
      <section className="relative overflow-hidden bg-linear-to-b from-blush-soft to-canvas">
        <PulseLine beats={5} mode="loop" strokeWidth={1.5} className="absolute inset-x-0 bottom-4 h-14 w-full text-brand/10" traceClassName="text-brand/50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <div className="animate-rise">
              <Eyebrow>Donación de sangre</Eyebrow>
            </div>
            <h1 className="mt-4 animate-rise text-5xl leading-[1.05] [animation-delay:0.08s] sm:text-6xl lg:text-7xl">
              Sé el héroe que <span className="text-brand italic">alguien necesita</span> hoy
            </h1>
            <p className="mt-6 max-w-xl animate-rise text-lg text-muted [animation-delay:0.16s]">
              Juntos podemos marcar la diferencia. Cada donación de sangre puede salvar hasta tres vidas, y agendarla te toma
              solo unos minutos.
            </p>
            <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:0.24s]">
              <Link id="hero-cta" href="/agendar" className={buttonClass("primary", undefined, "lg")}>
                Agendar mi cita
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="#requisitos" className={buttonClass("secondary", undefined, "lg")}>
                ¿Puedo donar?
              </Link>
            </div>
            <ul className="mt-8 flex animate-rise flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted [animation-delay:0.32s]">
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
          {FACTS.map((fact, index) => (
            <div key={fact.label} style={step(index)} className="reveal">
              <dd className="font-display text-3xl font-semibold text-brand">{fact.value}</dd>
              <dt className="mt-1 text-sm text-muted">{fact.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="reveal">
          <SectionHeading eyebrow="Por qué donar" title="Un gesto pequeño con un impacto enorme" />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {REASONS.map(({ icon: Icon, title, text }, index) => (
            <div key={title} style={step(index)} className="reveal">
              <article className="group h-full rounded-3xl border border-line bg-surface p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="grid size-13 place-items-center rounded-2xl bg-blush-soft text-brand transition-all duration-300 group-hover:scale-105 group-hover:bg-brand group-hover:text-white">
                  <Icon aria-hidden />
                </span>
                <h3 className="mt-5 text-xl">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="bg-wine text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="reveal max-w-2xl">
            <Eyebrow onDark>Cómo funciona</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl">De tu registro a tu primera medalla</h2>
          </div>
          <ol className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* De centro a centro del primer y el último paso: 75 % del ancho más el reparto de los huecos de la grilla. */}
            <PulseLine
              mode="scroll"
              className="absolute top-0 left-7 hidden h-14 w-[calc(75%+30px)] text-white/15 lg:block"
              traceClassName="text-blush"
            />
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} style={step(index)} className="reveal relative">
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

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="reveal">
          <SectionHeading
            eyebrow="El día de tu donación"
            title="Qué pasa cuando llegas a la sede"
            description="Reservar te guarda el lugar. Antes de donar, el equipo de salud comprueba que puedas hacerlo sin riesgo."
          />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <ol className="grid gap-6">
            {DONATION_DAY.map(({ title, text }, index) => (
              <li key={title} style={step(index)} className="reveal flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-soft text-sm font-bold text-brand-deep">{index + 1}</span>
                <div>
                  <h3 className="text-lg">{title}</h3>
                  <p className="mt-1 text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="grid content-start gap-6">
            <div style={step(1)} className="reveal rounded-3xl border border-line bg-surface p-6 shadow-card">
              <h3 className="text-xl">Antes de ir</h3>
              <div className="mt-4">
                <PreparationList />
              </div>
            </div>
            <div style={step(2)} className="reveal rounded-3xl bg-blush-soft p-6">
              <h3 className="text-xl">Después de donar</h3>
              <ul className="mt-4 grid list-disc gap-2 pl-4 text-sm text-muted">
                {AFTER_DONATING.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="reveal">
            <SectionHeading
              eyebrow="Después de la extracción"
              title="Qué pasa con tu sangre"
              description="Nunca se transfunde directamente. Primero se estudia y se separa, y por eso una sola donación puede ayudar a hasta tres personas."
            />
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.5fr]">
            <div className="reveal">
              <h3 className="text-xl">Estudios obligatorios</h3>
              <p className="mt-2 text-muted">En cada donación se clasifica el grupo y factor, y se buscan estas infecciones:</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {BLOOD_TESTS.map((test) => (
                  <li key={test} className="rounded-full bg-blush-soft px-3 py-1 text-sm font-medium text-brand-deep">
                    {test}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">Si algo saliera fuera de lo normal, nos comunicamos contigo.</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-3">
              {BLOOD_COMPONENTS.map(({ name, storage, duration }, index) => (
                <li key={name} style={step(index)} className="reveal rounded-3xl border border-line p-5">
                  <Droplets aria-hidden className="size-5 text-brand" />
                  <h3 className="mt-3 text-lg">{name}</h3>
                  <p className="mt-2 text-sm text-muted">{storage}</p>
                  <p className="mt-1 text-sm font-semibold">{duration}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="requisitos" className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
        <div className="reveal">
          <SectionHeading
            eyebrow="Requisitos"
            title="¿Puedo donar?"
            description="Responde estas preguntas para saber si cumples los requisitos básicos antes de agendar."
          />
          <div className="mt-6 rounded-3xl bg-blush-soft p-6">
            <h3 className="text-xl">Sobre nosotros</h3>
            <p className="mt-2 text-muted">
              Red de Vida es una red de sedes dedicadas a la donación de sangre. Desde 2016 trabajamos para que donar sea simple y
              seguro: una sola cuenta, tu historial en un solo lugar y la sede que te quede más cómoda.
            </p>
          </div>
        </div>
        <div style={step(1)} className="reveal">
          <EligibilityCheck />
        </div>
      </section>

      <section id="preguntas" className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1fr_1.6fr]">
          <div className="reveal">
            <SectionHeading eyebrow="Preguntas frecuentes" title="Lo que necesitas saber" />
            <Link href="/instituciones" className={buttonClass("secondary", "mt-6")}>
              Ver dónde donar
            </Link>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQS.map((faq) => (
              <details key={faq.question} className="accordion group">
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
    </PageTransition>
  );
}
