"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { BLOOD_TYPES } from "@/domain/rules";
import { fieldErrors, profileUpdateSchema } from "@/domain/schemas";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { ProfileView } from "@/server/dal";
import { DiseasePicker } from "./disease-picker";
import { Alert, Button, Field, inputClass } from "./ui";

type Props = {
  profile: ProfileView;
  /** Avisa si hay cambios sin guardar: el asistente de cita no deja avanzar con datos a medias. */
  onDirtyChange?: (dirty: boolean) => void;
};

const sameItems = (a: string[], b: string[]) => a.length === b.length && a.every((item) => b.includes(item));

export function ProfileForm({ profile, onDirtyChange }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(profile);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [bloodType, setBloodType] = useState<string>(profile.bloodType);
  const [diseases, setDiseases] = useState(profile.diseases);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const dirty =
    firstName !== saved.firstName ||
    lastName !== saved.lastName ||
    email !== saved.email ||
    bloodType !== saved.bloodType ||
    !sameItems(diseases, saved.diseases);

  const report = (next: boolean) => onDirtyChange?.(next);
  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setMessage(null);
    report(true);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = { firstName, lastName, email, bloodType, diseases: diseases.map((name) => ({ name, diagnosedDate: null, notes: "" })) };
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setPending(true);
    setErrors({});
    try {
      await api(`/api/users/${profile.id}`, { method: "PUT", body });
      setSaved({ ...saved, firstName, lastName, email, bloodType: parsed.data.bloodType, diseases });
      setMessage({ tone: "success", text: "Tus datos se actualizaron." });
      report(false);
      router.refresh();
    } catch (caught) {
      setMessage({ tone: "error", text: errorMessage(caught) });
      if (caught instanceof ApiError) setErrors(caught.fields);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="firstName" label="Nombres" error={errors.firstName}>
          <input id="firstName" value={firstName} onChange={(e) => edit(setFirstName)(e.target.value)} className={inputClass(Boolean(errors.firstName))} />
        </Field>
        <Field id="lastName" label="Apellidos" error={errors.lastName}>
          <input id="lastName" value={lastName} onChange={(e) => edit(setLastName)(e.target.value)} className={inputClass(Boolean(errors.lastName))} />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" type="email" value={email} onChange={(e) => edit(setEmail)(e.target.value)} className={inputClass(Boolean(errors.email))} />
        </Field>
        <Field id="bloodType" label="Tipo de sangre" error={errors.bloodType}>
          <select id="bloodType" value={bloodType} onChange={(e) => edit(setBloodType)(e.target.value)} className={inputClass(Boolean(errors.bloodType))}>
            {BLOOD_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
      </div>
      <DiseasePicker value={diseases} onChange={edit(setDiseases)} />
      <div>
        <Button type="submit" variant="secondary" disabled={!dirty || pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
