import { handler, ok } from "@/server/http";
import { cancelAppointment } from "@/server/services/appointments";
import { requireSession } from "@/server/session";

export const PUT = handler<{ id: string }>(async (_request, { id }) => {
  const session = await requireSession();
  const appointment = await cancelAppointment(id, session.isAdmin ? undefined : session.userId);
  return ok(appointment, "Cita cancelada.");
});
