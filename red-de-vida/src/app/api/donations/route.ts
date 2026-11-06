import { handler, ok } from "@/server/http";
import { listDonations } from "@/server/services/donations";
import { requireAdmin } from "@/server/session";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await listDonations());
});
