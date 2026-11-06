import "server-only";
import type { z } from "zod";
import { type OperatingHours, todayKey } from "@/domain/rules";
import type { institutionSchema } from "@/domain/schemas";
import { connectDB } from "../db";
import { DomainError, isDuplicateKey } from "../errors";
import { Appointment, Donation, Institution } from "../models";
import { occupiedDates } from "./appointments";

const NOT_FOUND = "Institución no encontrada.";
const EMAIL_TAKEN = "Ya existe una institución con ese email.";

/* Sin populate: el listado era público y exponía citas y notas de todos los donantes. */
export async function listInstitutions() {
  await connectDB();
  return Institution.find().select("-donations -appointments").sort({ name: 1 }).lean();
}

/** Agenda sin datos personales: solo lo necesario para calcular turnos libres. */
export async function institutionSchedule(id: string) {
  await connectDB();
  const institution = await Institution.findById(id).select("operatingHours dailyDonorCapacity").lean();
  if (!institution) throw new DomainError(404, NOT_FOUND);
  return {
    institutionId: id,
    operatingHours: institution.operatingHours as OperatingHours,
    dailyDonorCapacity: institution.dailyDonorCapacity,
    occupied: await occupiedDates(id, todayKey()),
  };
}

export async function createInstitution(input: z.output<typeof institutionSchema>) {
  await connectDB();
  try {
    return await Institution.create(input);
  } catch (error) {
    if (isDuplicateKey(error)) throw new DomainError(409, EMAIL_TAKEN);
    throw error;
  }
}

export async function updateInstitution(id: string, input: Partial<z.output<typeof institutionSchema>>) {
  await connectDB();
  try {
    const institution = await Institution.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true })
      .select("-donations -appointments")
      .lean();
    if (!institution) throw new DomainError(404, NOT_FOUND);
    return institution;
  } catch (error) {
    if (isDuplicateKey(error)) throw new DomainError(409, EMAIL_TAKEN);
    throw error;
  }
}

/** Con historial no se borra: dejaría citas y donaciones apuntando a una institución inexistente. */
export async function deleteInstitution(id: string) {
  await connectDB();
  const inUse =
    (await Appointment.exists({ institutionId: id })) || (await Donation.exists({ institutionId: id }));
  if (inUse) throw new DomainError(409, "La institución tiene citas o donaciones asociadas y no se puede eliminar.");
  const deleted = await Institution.findByIdAndDelete(id);
  if (!deleted) throw new DomainError(404, NOT_FOUND);
}
