import { appointmentCreateSchema } from "@/domain/schemas";
import { handler, ok, readJson } from "@/server/http";
import { createAppointment, listAppointments } from "@/server/services/appointments";
import { requireAdmin, requireSession } from "@/server/session";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await listAppointments());
});

/* El usuario sale de la sesión: un `userId` en el cuerpo permitiría reservar a nombre de otro. */
export const POST = handler(async (request) => {
  const session = await requireSession();
  const input = appointmentCreateSchema.parse(await readJson(request));
  return ok(await createAppointment(session.userId, input), "Cita agendada.", 201);
});
