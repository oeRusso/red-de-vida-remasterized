"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MEDALS, POINTS_PER_DONATION } from "@/domain/rules";
import { Button } from "./ui";

const REVEAL_DELAY_MS = 700;

const storageKey = (userId: string) => `red-de-vida:puntos-vistos:${userId}`;

function readSeenPoints(key: string) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? null : Number(stored);
  } catch {
    return null;
  }
}

function saveSeenPoints(key: string, points: number) {
  try {
    localStorage.setItem(key, String(points));
  } catch {
    // Sin almacenamiento no hay aviso: las medallas siguen visibles en la pantalla.
  }
}

/**
 * Quien confirma la cita es un administrador, así que el donante se entera de su
 * medalla al volver. El esquema no guarda qué medallas ya vio: se compara con los
 * puntos de la visita anterior en este dispositivo. La primera visita solo los
 * anota, para no celebrar medallas antiguas.
 */
export function MedalReveal({ userId, points }: { userId: string; points: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [medal, setMedal] = useState<(typeof MEDALS)[number] | null>(null);

  useEffect(() => {
    // Se espera a que el panel se asiente; si la persona se va antes, el aviso queda para la próxima visita.
    const timer = setTimeout(() => {
      const key = storageKey(userId);
      const seen = readSeenPoints(key);
      saveSeenPoints(key, points);
      if (seen === null) return;
      const earned = MEDALS.findLast((candidate) => seen < candidate.pointsRequired && points >= candidate.pointsRequired);
      if (earned) setMedal(earned);
    }, REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [userId, points]);

  useEffect(() => {
    if (medal) dialog.current?.showModal();
  }, [medal]);

  if (!medal) return null;

  return (
    <dialog ref={dialog} aria-labelledby="medalla-nueva" className="m-auto w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-3xl bg-surface p-8 text-center text-ink shadow-xl">
      <span className="relative mx-auto grid size-36 place-items-center">
        <span aria-hidden className="absolute inset-0 animate-heartbeat rounded-full bg-blush-soft" />
        <span aria-hidden className="absolute inset-4 animate-heartbeat rounded-full bg-blush [animation-delay:0.12s]" />
        <Image src={`/medals/medal${medal.level}.svg`} alt="" width={96} height={96} className="relative size-24 animate-pop object-contain [animation-delay:0.15s]" />
      </span>
      <p className="mt-6 text-xs font-bold tracking-[0.14em] text-brand-deep uppercase">Nueva medalla</p>
      <h2 id="medalla-nueva" className="mt-2 text-3xl">
        {medal.name}
      </h2>
      <p className="mt-2 text-muted">
        Llegaste a {medal.pointsRequired} puntos con {medal.pointsRequired / POINTS_PER_DONATION === 1 ? "tu primera donación" : `${medal.pointsRequired / POINTS_PER_DONATION} donaciones`}. Gracias por donar.
      </p>
      <Button className="mt-6 w-full" onClick={() => dialog.current?.close()}>
        Continuar
      </Button>
    </dialog>
  );
}
