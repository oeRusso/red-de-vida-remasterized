import { z } from "zod";
import { ageOn, BLOOD_TYPES, GENDERS, INSTITUTION_TYPES, MAX_DONOR_AGE, MIN_DONOR_AGE, todayKey } from "./rules";

/* Las regex de nombre y contraseña son más amplias que las del legacy, a propósito:
   aquellas rechazaban "José", "Núñez" y cualquier símbolo. Todo lo válido antes sigue siéndolo. */
const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, "Campo requerido")
    .max(80, "Demasiado largo")
    .regex(/^\p{Lu}[\p{L}'’-]*(?:\s[\p{L}'’-]+)*$/u, `${label} debe comenzar con mayúscula y no contener números`);

const email = z.string().trim().toLowerCase().pipe(z.email("El correo no es válido"));

const disease = z.object({
  name: z.string().trim().min(1).max(100),
  diagnosedDate: z.iso.date().nullish(),
  notes: z.string().max(500).optional(),
});

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Identificador inválido");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Campo requerido"),
});

export const registerSchema = z.object({
  firstName: personName("El nombre"),
  lastName: personName("El apellido"),
  birthday: z.iso.date("Campo requerido").refine(
    (value) => {
      // Zod ejecuta el refine aunque falle el formato; ese error ya lo reporta z.iso.date.
      if (Number.isNaN(Date.parse(value))) return true;
      const age = ageOn(value, todayKey());
      return age >= MIN_DONOR_AGE && age <= MAX_DONOR_AGE;
    },
    `Debes tener entre ${MIN_DONOR_AGE} y ${MAX_DONOR_AGE} años para registrarte`,
  ),
  gender: z.enum(GENDERS, "Selecciona una opción"),
  bloodType: z.enum(BLOOD_TYPES, "Selecciona una opción"),
  email,
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres")
    .regex(/[A-Z]/, "Debe incluir una mayúscula")
    .regex(/[a-z]/, "Debe incluir una minúscula")
    .regex(/\d/, "Debe incluir un número"),
  diseases: z.array(disease).default([]),
});

/** Lista cerrada: el legacy aceptaba cualquier campo, incluidos totalPoints y password en claro. */
export const profileUpdateSchema = z.object({
  firstName: personName("El nombre"),
  lastName: personName("El apellido"),
  email,
  bloodType: z.enum(BLOOD_TYPES, "Selecciona una opción"),
  diseases: z.array(disease),
});

export const appointmentCreateSchema = z.object({
  institutionId: objectId,
  appointmentDate: z.iso.datetime("Selecciona fecha y hora"),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

const time = z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm");
const optionalHours = z.object({ open: time.optional(), close: time.optional() });

export const institutionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  institutionType: z.enum(INSTITUTION_TYPES),
  address: z.string().trim().min(1).max(250),
  email,
  operatingHours: z.object({
    mondayToFriday: z.object({ open: time, close: time }),
    saturday: optionalHours.optional(),
    sunday: optionalHours.optional(),
  }),
  dailyDonorCapacity: z.number().int().min(0).max(1000),
});

export type RegisterInput = z.input<typeof registerSchema>;
export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;

/** Convierte un error de Zod en { campo: primer mensaje } para pintar en el formulario. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}
