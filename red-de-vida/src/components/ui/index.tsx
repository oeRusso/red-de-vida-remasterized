import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-sm hover:-translate-y-px hover:bg-brand-deep hover:shadow-md",
  secondary: "border border-line bg-surface text-ink hover:-translate-y-px hover:border-brand hover:text-brand",
  ghost: "text-brand hover:bg-blush-soft",
  danger: "border border-brand/60 text-brand-deep hover:bg-brand hover:text-white",
  inverse: "bg-white text-wine hover:bg-blush",
};

/* `md` es el tamaño normal. `sm` va dentro de tarjetas y filas; `lg`, solo en la acción principal del hero. */
const SIZES = {
  sm: "min-h-9 px-4 py-1.5",
  md: "min-h-10 px-5 py-2",
  lg: "min-h-12 px-7 py-3",
};

type Size = keyof typeof SIZES;

export const buttonClass = (variant: Variant = "primary", className?: string, size: Size = "md") =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all active:scale-[0.98]",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:active:scale-100",
    SIZES[size],
    VARIANTS[variant],
    className,
  );

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, className, size)} {...props} />;
}

const ALERTS = {
  error: { icon: CircleAlert, style: "bg-blush-soft text-brand-deep border-blush" },
  success: { icon: CircleCheck, style: "bg-success-soft text-success border-success/20" },
  info: { icon: Info, style: "bg-info-soft text-info border-info/20" },
};

export function Alert({ tone, children, className }: { tone: keyof typeof ALERTS; children: ReactNode; className?: string }) {
  const { icon: Icon, style } = ALERTS[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", style, className)}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-7", className)} {...props} />;
}

export const inputClass = (invalid?: boolean) =>
  cn(
    "min-h-12 w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted/70",
    "transition-colors focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15",
    invalid ? "border-brand" : "border-line hover:border-muted/40",
  );

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-brand-deep">
          {error}
        </p>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("shimmer rounded-3xl bg-line/60", className)} />;
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Cargando" className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-56 lg:col-span-2" />
        <Skeleton className="h-56" />
      </div>
      <Skeleton className="h-28" />
      <Skeleton className="h-64" />
    </div>
  );
}

export function PageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-lg text-muted">{description}</p>}
    </header>
  );
}

export function Eyebrow({ children, onDark }: { children: ReactNode; onDark?: boolean }) {
  return <p className={cn("text-xs font-bold tracking-[0.14em] uppercase", onDark ? "text-blush" : "text-brand-deep")}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-3xl sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-lg text-muted">{description}</p>}
    </div>
  );
}
