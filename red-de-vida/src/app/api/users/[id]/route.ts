import { profileUpdateSchema } from "@/domain/schemas";
import { handler, ok, readJson } from "@/server/http";
import { deleteUser, findUserWithLastAppointment, updateUser } from "@/server/services/users";
import { endSession, requireSelfOrAdmin } from "@/server/session";

type Params = { id: string };

export const GET = handler<Params>(async (_request, { id }) => {
  await requireSelfOrAdmin(id);
  return ok(await findUserWithLastAppointment(id));
});

export const PUT = handler<Params>(async (request, { id }) => {
  await requireSelfOrAdmin(id);
  const user = await updateUser(id, profileUpdateSchema.parse(await readJson(request)));
  return ok(user, "Datos actualizados.");
});

export const DELETE = handler<Params>(async (_request, { id }) => {
  const session = await requireSelfOrAdmin(id);
  await deleteUser(id);
  if (session.userId === id) await endSession();
  return ok(undefined, "Cuenta eliminada.");
});
