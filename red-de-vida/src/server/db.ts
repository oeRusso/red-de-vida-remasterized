import mongoose from "mongoose";

type ConnectionCache = { promise: Promise<typeof mongoose> | null };

// En dev el HMR re-evalúa los módulos; sin esto cada recarga abriría otra conexión.
const globalCache = globalThis as typeof globalThis & { __mongoose?: ConnectionCache };
const cache: ConnectionCache = (globalCache.__mongoose ??= { promise: null });

/** Mismas variables y misma selección que el backend Express. */
export function mongoUri(env: "development" | "production" = currentEnv()): string {
  const name = env === "development" ? "MONGO_URI_DEV" : "MONGO_URI_PROD";
  const uri = process.env[name];
  if (!uri) throw new Error(`Falta la variable de entorno ${name}`);
  return uri;
}

const currentEnv = () => (process.env.NODE_ENV === "development" ? "development" : "production");

export async function connectDB(uri?: string) {
  cache.promise ??= mongoose
    .connect(uri ?? mongoUri(), {
      // En producción los índices nuevos se crean a mano con `npm run db:indexes`,
      // para que un deploy nunca toque la base por su cuenta.
      autoIndex: process.env.NODE_ENV !== "production",
    })
    .catch((error) => {
      cache.promise = null;
      throw error;
    });
  return cache.promise;
}
