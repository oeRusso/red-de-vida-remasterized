import { institutionSchema } from "@/domain/schemas";
import { handler, ok, readJson } from "@/server/http";
import { deleteInstitution, updateInstitution } from "@/server/services/institutions";
import { requireAdmin } from "@/server/session";

type Params = { id: string };

export const PUT = handler<Params>(async (request, { id }) => {
  await requireAdmin();
  const input = institutionSchema.partial().parse(await readJson(request));
  return ok(await updateInstitution(id, input), "Institución actualizada.");
});

export const DELETE = handler<Params>(async (_request, { id }) => {
  await requireAdmin();
  await deleteInstitution(id);
  return ok(undefined, "Institución eliminada.");
});
