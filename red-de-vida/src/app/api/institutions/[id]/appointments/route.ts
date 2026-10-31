import { handler, ok } from "@/server/http";
import { institutionSchedule } from "@/server/services/institutions";
import { requireSession } from "@/server/session";

export const GET = handler<{ id: string }>(async (_request, { id }) => {
  await requireSession();
  return ok(await institutionSchedule(id));
});
