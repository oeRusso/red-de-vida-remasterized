import { handler, ok } from "@/server/http";
import { confirmAppointment } from "@/server/services/appointments";
import { requireAdmin } from "@/server/session";

export const PUT = handler<{ id: string }>(async (_request, { id }) => {
  await requireAdmin();
  return ok(await confirmAppointment(id), "Cita confirmada y donación registrada.");
});
