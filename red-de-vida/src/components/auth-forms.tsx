"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type FormEvent, useState } from "react";
import { BLOOD_TYPES, GENDER_LABELS, GENDERS, MAX_DONOR_AGE, MIN_DONOR_AGE } from "@/domain/rules";
import { fieldErrors, registerSchema } from "@/domain/schemas";
import { api, ApiError, errorMessage } from "@/lib/api";
import { DiseasePicker } from "./disease-picker";
import { Alert, Button, Field, inputClass } from "./ui";

function PasswordInput({ invalid, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${inputClass(invalid)} pr-12`} aria-invalid={invalid} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-brand"
      >
        {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  );
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/auth/login", { method: "POST", body: { email, password } });
      router.replace(next);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setPassword("");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && <Alert tone="error">{error}</Alert>}
      <Field id="email" label="Email">
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass()}
        />
      </Field>
      <Field id="password" label="Contraseña">
        <PasswordInput
          id="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </Button>
      <p className="text-center text-sm text-muted">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-brand">
          Regístrate
        </Link>
      </p>
    </form>
  );
}

const EMPTY_REGISTER = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  birthday: "",
  gender: "",
  bloodType: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_REGISTER);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Se valida en eventos, no al renderizar: la edad depende de la fecha actual.
  function validate(candidate: typeof values) {
    const body = { ...candidate, diseases: diseases.map((name) => ({ name, diagnosedDate: null, notes: "" })) };
    const result = registerSchema.safeParse(body);
    setClientErrors(result.success ? {} : fieldErrors(result.error));
    return { body, valid: result.success };
  }

  const errorFor = (name: keyof typeof EMPTY_REGISTER) => serverErrors[name] || (touched[name] ? clientErrors[name] : undefined);

  const fieldProps = (name: keyof typeof EMPTY_REGISTER) => ({
    id: name,
    name,
    value: values[name],
    "aria-invalid": Boolean(errorFor(name)),
    "aria-describedby": errorFor(name) ? `${name}-error` : undefined,
    onBlur: () => {
      setTouched((current) => ({ ...current, [name]: true }));
      validate(values);
    },
    onChange: (event: { target: { value: string } }) => {
      const next = { ...values, [name]: event.target.value };
      setValues(next);
      validate(next);
      setServerErrors((current) => ({ ...current, [name]: "" }));
    },
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(Object.fromEntries(Object.keys(EMPTY_REGISTER).map((key) => [key, true])));
    const { body, valid } = validate(values);
    if (!valid) return;
    setPending(true);
    setError(null);
    try {
      await api("/auth/register", { method: "POST", body });
      router.push("/login?registrado=1");
    } catch (caught) {
      setError(errorMessage(caught));
      if (caught instanceof ApiError) setServerErrors(caught.fields);
      setPending(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="firstName" label="Nombres" error={errorFor("firstName")}>
          <input {...fieldProps("firstName")} autoComplete="given-name" placeholder="José María" className={inputClass(Boolean(errorFor("firstName")))} />
        </Field>
        <Field id="lastName" label="Apellidos" error={errorFor("lastName")}>
          <input {...fieldProps("lastName")} autoComplete="family-name" placeholder="Méndez Hernández" className={inputClass(Boolean(errorFor("lastName")))} />
        </Field>
        <Field id="email" label="Email" error={errorFor("email")}>
          <input {...fieldProps("email")} type="email" autoComplete="email" placeholder="tu@mail.com" className={inputClass(Boolean(errorFor("email")))} />
        </Field>
        <Field id="password" label="Contraseña" error={errorFor("password")} hint="Mínimo 8 caracteres, con mayúscula, minúscula y número.">
          <PasswordInput {...fieldProps("password")} autoComplete="new-password" invalid={Boolean(errorFor("password"))} />
        </Field>
        <Field id="birthday" label="Fecha de nacimiento" error={errorFor("birthday")} hint={`Debes tener entre ${MIN_DONOR_AGE} y ${MAX_DONOR_AGE} años.`}>
          <input {...fieldProps("birthday")} type="date" autoComplete="bday" className={inputClass(Boolean(errorFor("birthday")))} />
        </Field>
        <Field id="gender" label="Género" error={errorFor("gender")} hint="Define el tiempo de espera entre donaciones.">
          <select {...fieldProps("gender")} className={inputClass(Boolean(errorFor("gender")))}>
            <option value="" disabled>
              Selecciona uno
            </option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {GENDER_LABELS[gender]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="bloodType" label="Tipo de sangre" error={errorFor("bloodType")}>
          <select {...fieldProps("bloodType")} className={inputClass(Boolean(errorFor("bloodType")))}>
            <option value="" disabled>
              Selecciona uno
            </option>
            {BLOOD_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
      </div>
      <DiseasePicker value={diseases} onChange={setDiseases} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creando tu cuenta…" : "Registrarme"}
      </Button>
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
