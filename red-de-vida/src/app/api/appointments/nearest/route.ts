import { handler, ok } from "@/server/http";
import { nearestSlots } from "@/server/services/appointments";
import { requireSession } from "@/server/session";

/* La ventana depende de la última donación: el usuario sale de la sesión, nunca de la consulta. */
export const GET = handler(async () => {
  const session = await requireSession();
  return ok(await nearestSlots(session.userId));
});
