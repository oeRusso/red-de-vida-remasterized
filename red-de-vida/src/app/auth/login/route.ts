import { loginSchema } from "@/domain/schemas";
import { handler, ok, readJson } from "@/server/http";
import { authenticate } from "@/server/services/users";
import { startSession } from "@/server/session";

export const POST = handler(async (request) => {
  const user = await authenticate(loginSchema.parse(await readJson(request)));
  await startSession({ userId: user.id, email: user.email });
  return ok({ user }, "Sesión iniciada.");
});
