"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MAX_DONOR_AGE, MIN_DONOR_AGE } from "@/domain/rules";
import { Alert, buttonClass, cn } from "./ui";

/* Orientativo: repite los requisitos de la landing. La validación real está en el servidor. */
const QUESTIONS = [
  { id: "edad", text: `¿Tienes entre ${MIN_DONOR_AGE} y ${MAX_DONOR_AGE} años?`, expected: "si" },
  { id: "peso", text: "¿Pesas 50 kg o más?", expected: "si" },
  { id: "salud", text: "¿Padeces epilepsia, tuberculosis o alguna enfermedad del corazón?", expected: "no" },
] as const;

type Answer = "si" | "no";

export function EligibilityCheck() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const complete = QUESTIONS.every((question) => answers[question.id]);
  const eligible = QUESTIONS.every((question) => answers[question.id] === question.expected);

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-lift sm:p-8">
      <h3 className="text-2xl">Compruébalo en 30 segundos</h3>
      <div className="mt-5 grid gap-5">
        {QUESTIONS.map((question) => (
          <fieldset key={question.id}>
            <legend className="font-medium">{question.text}</legend>
            <div className="mt-2 flex gap-2">
              {(["si", "no"] as const).map((option) => (
                <label
                  key={option}
                  className={cn(
                    "flex min-h-11 min-w-20 cursor-pointer items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors",
                    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand",
                    answers[question.id] === option ? "border-brand bg-blush-soft text-brand-deep" : "border-line hover:border-brand",
                  )}
                >
                  <input
                    type="radio"
                    name={question.id}
                    className="sr-only"
                    checked={answers[question.id] === option}
                    onChange={() => setAnswers({ ...answers, [question.id]: option })}
                  />
                  {option === "si" ? "Sí" : "No"}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {complete && (
        <div className="mt-6 animate-rise">
          {eligible ? (
            <Alert tone="success">
              <strong>Cumples los requisitos básicos.</strong> Ya puedes elegir hospital, fecha y hora.
              <Link href="/agendar" className={buttonClass("primary", "mt-3 flex w-fit")}>
                Agendar mi cita
              </Link>
            </Alert>
          ) : (
            <Alert tone="info">
              Por ahora <strong>no cumples alguno de los requisitos</strong> para donar. Tu interés ya importa: compartir esta
              información también ayuda.
            </Alert>
          )}
          <button
            type="button"
            onClick={() => setAnswers({})}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Volver a empezar
          </button>
        </div>
      )}
      <p className="mt-5 text-xs text-muted">Es una guía orientativa y no reemplaza la evaluación del equipo de salud.</p>
    </div>
  );
}
