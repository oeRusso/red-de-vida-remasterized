import { type ReactNode, Suspense, ViewTransition } from "react";

/**
 * Fundido entre páginas. Va en cada página y no en el layout, porque los layouts
 * persisten entre navegaciones y `enter`/`exit` nunca se disparan ahí.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}

/** `Suspense` que pasa del esqueleto al contenido con un fundido. */
export function SuspenseReveal({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="skeleton" default="none">
          {fallback}
        </ViewTransition>
      }
    >
      <ViewTransition enter="reveal-content" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  );
}
