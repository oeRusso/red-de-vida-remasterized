import { jwtVerify, SignJWT } from "jose";

/* Módulo aparte de session.ts porque también lo usa src/proxy.ts. */
export const SESSION_COOKIE = "rdv_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export type SessionClaims = { userId: string; email: string };

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("Falta la variable de entorno JWT_SECRET");
  return new TextEncoder().encode(value);
};

export const signSession = (claims: SessionClaims) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret());

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return typeof payload.userId === "string" && typeof payload.email === "string"
      ? { userId: payload.userId, email: payload.email }
      : null;
  } catch {
    return null;
  }
}
