import "server-only";
import type { z } from "zod";
import {
  type AppointmentStatus,
  availableSlots,
  bookingWindow,
  DONATION_INTERVAL_MONTHS,
  type Gender,
  isDonorAge,
  MAX_DONOR_AGE,
  MIN_DONOR_AGE,
  type OperatingHours,
  pendingCutoff,
  POINTS_PER_DONATION,
  toDateKey,
  todayKey,
  toTimeKey,
} from "@/domain/rules";
import type { appointmentCreateSchema } from "@/domain/schemas";
import { connectDB } from "../db";
import { DomainError, isDuplicateKey } from "../errors";
import { Appointment, Award, Donation, Institution, User } from "../models";

const PENDING_EXISTS = "Tienes una cita pendiente: complétala o cancélala antes de agendar otra.";
const SLOT_TAKEN = "Ese horario ya no está disponible. Elige otro.";
const DISEASES_BLOCK_BOOKING = "No puedes agendar una cita mientras tengas enfermedades registradas en tu perfil.";

/**
 * Caducidad perezosa: se aplica antes de leer o decidir sobre citas, en lugar de
 * con un proceso programado, y así funciona igual en cualquier hosting. Usa el
 * estado Cancelled, que además libera el turno, porque el esquema no se toca.
 */
export async function expireOverdueAppointments() {
  await connectDB();
  await Appointment.updateMany(
    { status: "Pending", appointmentDate: { $lt: pendingCutoff() } },
    { status: "Cancelled" },
  );
}

export async function listAppointments(filter: { status?: AppointmentStatus } = {}) {
  await expireOverdueAppointments();
  return Appointment.find(filter)
    .sort({ appointmentDate: 1 })
    .populate({ path: "userId", select: "firstName lastName email bloodType" })
    .populate({ path: "institutionId", select: "name institutionType address" })
    .lean();
}

export async function lastDonationDate(userId: string): Promise<Date | null> {
  await connectDB();
  const last = await Donation.findOne({ userId }).sort({ donationDate: -1 }).select("donationDate").lean();
  return last?.donationDate ?? null;
}

/** Fechas ocupadas: citas no canceladas (el legacy dejaba bloqueados para siempre los turnos cancelados). */
export async function occupiedDates(institutionId: string, from?: string) {
  await connectDB();
  const appointments = await Appointment.find({
    institutionId,
    status: { $ne: "Cancelled" },
    ...(from && { appointmentDate: { $gte: new Date(`${from}T00:00:00.000Z`) } }),
  })
    .select("appointmentDate")
    .lean();
  return appointments.map((appointment) => appointment.appointmentDate.toISOString());
}

export async function createAppointment(userId: string, input: z.output<typeof appointmentCreateSchema>) {
  await expireOverdueAppointments();
  const appointmentDate = new Date(input.appointmentDate);

  const user = await User.findById(userId).lean();
  if (!user) throw new DomainError(404, "Usuario no encontrado.");

  if (await Appointment.exists({ userId, status: "Pending" })) throw new DomainError(409, PENDING_EXISTS);

  const today = todayKey();
  if (!isDonorAge(user.birthday, today)) {
    throw new DomainError(422, `Para donar debes tener entre ${MIN_DONOR_AGE} y ${MAX_DONOR_AGE} años.`);
  }

  if (user.diseases.length > 0) throw new DomainError(422, DISEASES_BLOCK_BOOKING);

  const gender = user.gender as Gender;
  const dateKey = toDateKey(appointmentDate);
  const window = bookingWindow(gender, await lastDonationDate(userId), today);
  if (dateKey < window.from) {
    throw new DomainError(422, `Debes esperar ${DONATION_INTERVAL_MONTHS[gender]} meses entre donaciones. Podrás agendar desde el ${window.from}.`);
  }
  if (dateKey > window.to) throw new DomainError(422, `Solo puedes agendar hasta el ${window.to}.`);

  const institution = await Institution.findById(input.institutionId).lean();
  if (!institution) throw new DomainError(404, "Institución no encontrada.");

  const schedule = {
    operatingHours: institution.operatingHours as OperatingHours,
    dailyDonorCapacity: institution.dailyDonorCapacity,
    occupied: await occupiedDates(input.institutionId, dateKey),
  };
  if (!availableSlots(schedule, dateKey).includes(toTimeKey(appointmentDate))) {
    throw new DomainError(409, SLOT_TAKEN);
  }

  let appointment;
  try {
    appointment = await Appointment.create({
      userId,
      institutionId: input.institutionId,
      appointmentDate,
      notes: input.notes,
      status: "Pending",
    });
  } catch (error) {
    if (isDuplicateKey(error)) {
      const byUser = (error as { keyPattern?: Record<string, number> }).keyPattern?.institutionId === undefined;
      throw new DomainError(409, byUser ? PENDING_EXISTS : SLOT_TAKEN);
    }
    throw error;
  }

  await Promise.all([
    User.updateOne({ _id: userId }, { $push: { appointments: appointment._id } }),
    Institution.updateOne({ _id: input.institutionId }, { $push: { appointments: appointment._id } }),
  ]);
  return appointment;
}

async function assertExists(id: string, message: string) {
  if (await Appointment.exists({ _id: id })) throw new DomainError(409, message);
  throw new DomainError(404, "Cita no encontrada.");
}

/**
 * Confirmar = el donante asistió: genera la donación y suma puntos y medallas.
 * El paso de Pending a Completed es atómico, de modo que dos confirmaciones
 * simultáneas no pueden sumar puntos dos veces.
 */
export async function confirmAppointment(id: string) {
  await expireOverdueAppointments();
  const appointment = await Appointment.findOneAndUpdate(
    { _id: id, status: "Pending" },
    { status: "Completed" },
    { returnDocument: "after" },
  );
  if (!appointment) return assertExists(id, "La cita ya fue completada o cancelada.");

  const { userId, institutionId, appointmentDate, notes } = appointment;
  const user = await User.findById(userId).lean();
  if (!user) {
    await Appointment.updateOne({ _id: id }, { status: "Pending" });
    throw new DomainError(404, "Usuario no encontrado.");
  }

  const donation = await Donation.create({
    userId,
    institutionId,
    bloodType: user.bloodType,
    notes: notes || "Donación completada exitosamente",
    donationDate: appointmentDate,
  });
  await Institution.updateOne({ _id: institutionId }, { $push: { donations: donation._id } });

  const updated = await User.findByIdAndUpdate(
    userId,
    { $push: { donations: donation._id }, $inc: { totalPoints: POINTS_PER_DONATION } },
    { returnDocument: "after" },
  ).lean();
  const totalPoints = updated?.totalPoints ?? 0;

  const earned = await Award.find({ pointsRequired: { $lte: totalPoints } }).sort({ pointsRequired: -1 }).lean();
  await User.updateOne({ _id: userId }, { $addToSet: { awards: { $each: earned.map((award) => award._id) } } });

  const alreadyHad = new Set(user.awards.map(String));
  return {
    updatedAppointment: appointment,
    donation,
    totalPoints,
    newAward: earned.find((award) => !alreadyHad.has(String(award._id))) ?? null,
  };
}

/** Sin `ownerId` actúa un administrador; con él, solo se puede cancelar la cita propia. */
export async function cancelAppointment(id: string, ownerId?: string) {
  await connectDB();
  const appointment = await Appointment.findOneAndUpdate(
    { _id: id, status: "Pending", ...(ownerId && { userId: ownerId }) },
    { status: "Cancelled" },
    { returnDocument: "after" },
  );
  if (appointment) return appointment;

  const existing = await Appointment.findById(id).select("userId").lean();
  if (!existing) throw new DomainError(404, "Cita no encontrada.");
  if (ownerId && String(existing.userId) !== ownerId) {
    throw new DomainError(403, "No tienes permisos para esta acción.");
  }
  throw new DomainError(409, "La cita ya fue completada o cancelada.");
}
