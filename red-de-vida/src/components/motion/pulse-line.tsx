import { cn } from "../ui";

const WIDTH = 900;
const HEIGHT = 56;
const BEAT_WIDTH = 80;
/** Un latido de electrocardiograma: sube y baja en total 0 y avanza BEAT_WIDTH. */
const BEAT = "l10 -5 l10 5 l8 0 l5 5 l9 -24 l9 30 l7 -11 l12 -6 l10 6";

/** Reparte los latidos para que cada uno quede centrado en su tramo. */
function pulsePath(beats: number) {
  const edge = (WIDTH - BEAT_WIDTH * beats) / (beats * 2);
  const line = Array<string>(beats).fill(BEAT).join(` h${edge * 2} `);
  return `M0 ${HEIGHT / 2} h${edge} ${line} h${edge}`;
}

type Props = {
  beats?: number;
  /** `scroll` se dibuja al bajar; `loop` deja un pulso recorriendo la línea. */
  mode: "scroll" | "loop";
  strokeWidth?: number;
  className?: string;
  traceClassName?: string;
};

/** Sello visual de la marca. Decorativa: sin soporte o sin movimiento se ve la línea completa. */
export function PulseLine({ beats = 3, mode, strokeWidth = 2, className, traceClassName }: Props) {
  const path = pulsePath(beats);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      strokeWidth={strokeWidth}
      className={cn("pulse-line", className)}
    >
      <path d={path} />
      <path d={path} pathLength={1} className={cn(mode === "scroll" ? "pulse-trace" : "pulse-travel", traceClassName)} />
    </svg>
  );
}
