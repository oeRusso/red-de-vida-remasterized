"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 900;

/**
 * Cuenta hasta `value` cuando entra en pantalla. El HTML ya trae el valor final,
 * de modo que sin JavaScript o con movimiento reducido se ve el número correcto,
 * y los lectores de pantalla nunca oyen la cuenta. `.count-up` lo oculta hasta
 * hidratar: si no, se vería el valor final y luego caería a 0 para empezar a contar.
 */
export function CountUp({ value }: { value: number }) {
  const number = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = number.current;
    if (!node) return;
    node.dataset.ready = "";
    if (value === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    node.textContent = "0";
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (time: number) => {
        const progress = Math.min((time - start) / DURATION_MS, 1);
        node.textContent = String(Math.round(value * (1 - (1 - progress) ** 3)));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      node.textContent = String(value);
    };
  }, [value]);

  return (
    <span className="tabular-nums">
      <span ref={number} aria-hidden className="count-up">
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
