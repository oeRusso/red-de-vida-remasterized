"use client";

import { type ComponentProps, useRef, useState } from "react";
import { errorMessage } from "@/lib/api";
import { Alert, Button } from "./ui";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void>;
  trigger: Omit<ComponentProps<typeof Button>, "onClick">;
};

export function ConfirmDialog({ title, description, confirmLabel, cancelLabel = "Volver", onConfirm, trigger }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      dialog.current?.close();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button {...trigger} onClick={() => dialog.current?.showModal()} />
      <dialog ref={dialog} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-6 text-ink shadow-xl">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={pending} onClick={() => dialog.current?.close()}>
            {cancelLabel}
          </Button>
          <Button disabled={pending} onClick={confirm}>
            {pending ? "Procesando…" : confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
