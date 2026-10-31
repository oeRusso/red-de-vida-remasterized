import { handler, ok } from "@/server/http";
import { findUserDetails } from "@/server/services/users";
import { requireSelfOrAdmin } from "@/server/session";

export const GET = handler<{ id: string }>(async (_request, { id }) => {
  await requireSelfOrAdmin(id);
  return ok(await findUserDetails(id));
});
