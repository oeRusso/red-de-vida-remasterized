"use client";

import { useRouter } from "next/navigation";
import { POINTS_PER_DONATION } from "@/domain/rules";
import { api } from "@/lib/api";
import { ConfirmDialog } from "./confirm-dialog";

export function CancelAppointmentButton({ id, compact }: { id: string; compact?: boolean }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      title="Cancelar cita"
      description="¿Seguro que deseas cancelar esta cita? El horario quedará libre para otra persona."
      confirmLabel="Cancelar cita"
      cancelLabel="Conservar cita"
      onConfirm={async () => {
        await api(`/api/appointments/${id}/cancel`, { method: "PUT" });
        router.refresh();
      }}
      trigger={{ children: "Cancelar", variant: "danger", size: compact ? "sm" : "md" }}
    />
  );
}

export function ConfirmAppointmentButton({ id, donor }: { id: string; donor: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      title="Confirmar donación"
      description={`Registrarás que ${donor} asistió y donó. Se creará la donación y sumará ${POINTS_PER_DONATION} puntos. Esta acción no se puede deshacer.`}
      confirmLabel="Confirmar donación"
      onConfirm={async () => {
        await api(`/api/appointments/${id}/confirm`, { method: "PUT" });
        router.refresh();
      }}
      trigger={{ children: "Confirmar", size: "sm" }}
    />
  );
}
