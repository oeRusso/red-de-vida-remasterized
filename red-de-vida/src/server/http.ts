import "server-only";
import mongoose from "mongoose";
import { unstable_rethrow } from "next/navigation";
import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { fieldErrors } from "@/domain/schemas";
import { DomainError, isDuplicateKey } from "./errors";

/* Mismo sobre JSON que la API Express: { status, message?, payload? }. */
export const ok = (payload?: unknown, message?: string, status = 200) =>
  NextResponse.json({ status: "success", message, payload }, { status });

const fail = (status: number, message: string, errors?: Record<string, string>) =>
  NextResponse.json({ status: "error", message, errors }, { status });

function toResponse(error: unknown) {
  if (error instanceof DomainError) return fail(error.status, error.message);
  if (error instanceof z.ZodError) return fail(400, "Revisa los datos ingresados.", fieldErrors(error));
  if (error instanceof mongoose.Error.CastError) return fail(400, "Identificador inválido.");
  if (error instanceof mongoose.Error.ValidationError) return fail(400, "Revisa los datos ingresados.");
  if (isDuplicateKey(error)) return fail(409, "El registro ya existe.");
  console.error("Error no controlado en la API:", error);
  return fail(500, "Error interno del servidor.");
}

type Context<Params> = { params: Promise<Params> };

/** Envuelve un Route Handler para que todo error acabe en el sobre JSON. */
export function handler<Params = object>(run: (request: Request, params: Params) => Promise<Response>) {
  return async (request: Request, context: Context<Params>) => {
    // Con Cache Components un GET sin cookies se prerenderiza en el build y serviría datos congelados.
    await connection();
    try {
      return await run(request, await context.params);
    } catch (error) {
      unstable_rethrow(error); // señales internas de Next, no errores
      return toResponse(error);
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new DomainError(400, "El cuerpo de la petición no es JSON válido.");
  }
}
