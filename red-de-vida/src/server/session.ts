import "server-only";
import { cookies } from "next/headers";
import { DomainError } from "./errors";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, type SessionClaims, signSession, verifySession } from "./jwt";

export type Session = SessionClaims & { isAdmin: boolean };

/**
 * El esquema de User no tiene roles y la BD no se toca, así que los administradores
 * se listan por _id en el entorno. Es por _id y no por email porque los emails
 * no se verifican: cualquiera podría registrar un email de la lista.
 */
const isAdminId = (userId: string) =>
  (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .includes(userId);

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const claims = await verifySession(store.get(SESSION_COOKIE)?.value);
  return claims && { ...claims, isAdmin: isAdminId(claims.userId) };
}

export async function startSession(claims: SessionClaims) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(claims), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new DomainError(401, "Debes iniciar sesión.");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!session.isAdmin) throw new DomainError(403, "No tienes permisos para esta acción.");
  return session;
}

export async function requireSelfOrAdmin(userId: string): Promise<Session> {
  const session = await requireSession();
  if (session.userId !== userId && !session.isAdmin) {
    throw new DomainError(403, "No tienes permisos para esta acción.");
  }
  return session;
}
