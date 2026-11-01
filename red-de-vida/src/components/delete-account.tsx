"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ConfirmDialog } from "./confirm-dialog";

export function DeleteAccount({ userId }: { userId: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      title="Eliminar mi cuenta"
      description="Se borrarán de forma permanente tus datos, donaciones, citas y medallas. Esta acción no se puede deshacer."
      confirmLabel="Eliminar definitivamente"
      cancelLabel="Conservar mi cuenta"
      onConfirm={async () => {
        await api(`/api/users/${userId}`, { method: "DELETE" });
        router.push("/");
        router.refresh();
      }}
      trigger={{ children: "Eliminar mi cuenta", variant: "danger", size: "sm" }}
    />
  );
}
