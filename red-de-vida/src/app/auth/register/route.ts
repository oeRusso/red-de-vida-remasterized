import { registerSchema } from "@/domain/schemas";
import { handler, ok, readJson } from "@/server/http";
import { registerUser } from "@/server/services/users";

export const POST = handler(async (request) => {
  const user = await registerUser(registerSchema.parse(await readJson(request)));
  return ok({ id: user._id, email: user.email }, "Usuario registrado.", 201);
});
