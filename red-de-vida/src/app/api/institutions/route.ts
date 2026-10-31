import { institutionSchema } from "@/domain/schemas";
import { handler, ok, readJson } from "@/server/http";
import { createInstitution, listInstitutions } from "@/server/services/institutions";
import { requireAdmin } from "@/server/session";

export const GET = handler(async () => ok(await listInstitutions()));

export const POST = handler(async (request) => {
  await requireAdmin();
  const institution = await createInstitution(institutionSchema.parse(await readJson(request)));
  return ok(institution, "Institución creada.", 201);
});
