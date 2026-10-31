import { handler, ok } from "@/server/http";
import { endSession } from "@/server/session";

export const POST = handler(async () => {
  await endSession();
  return ok(undefined, "Sesión cerrada.");
});
