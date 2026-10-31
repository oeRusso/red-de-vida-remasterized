import { registerSchema } from "@/domain/schemas";
import { handler, ok, readJson } from "@/server/http";
import { listUsers, registerUser } from "@/server/services/users";
import { requireAdmin } from "@/server/session";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await listUsers());
});

export const POST = handler(async (request) => {
  await requireAdmin();
  const user = await registerUser(registerSchema.parse(await readJson(request)));
  return ok({ id: user._id, email: user.email }, "Usuario creado.", 201);
});
