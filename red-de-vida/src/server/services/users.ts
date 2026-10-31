import "server-only";
import bcrypt from "bcryptjs";
import type { z } from "zod";
import type { loginSchema, profileUpdateSchema, registerSchema } from "@/domain/schemas";
import { connectDB } from "../db";
import { DomainError, isDuplicateKey } from "../errors";
import { Appointment, Donation, Institution, User } from "../models";
import { expireOverdueAppointments } from "./appointments";

/* Los emails nuevos se guardan en minúsculas, pero los legacy pueden tener mayúsculas: se compara sin distinguirlas. */
const CASE_INSENSITIVE = { locale: "en", strength: 2 };

const EMAIL_TAKEN = "Este email ya está registrado.";

export async function registerUser(input: z.output<typeof registerSchema>) {
  await connectDB();
  if (await User.exists({ email: input.email }).collation(CASE_INSENSITIVE)) throw new DomainError(409, EMAIL_TAKEN);
  try {
    return await User.create({ ...input, birthday: new Date(input.birthday) });
  } catch (error) {
    if (isDuplicateKey(error)) throw new DomainError(409, EMAIL_TAKEN);
    throw error;
  }
}

export async function authenticate(input: z.output<typeof loginSchema>) {
  await connectDB();
  const user = await User.findOne({ email: input.email }).collation(CASE_INSENSITIVE).select("+password");
  const valid = user && (await bcrypt.compare(input.password, user.password));
  if (!valid) throw new DomainError(401, "El email o la contraseña son incorrectos.");
  return { id: String(user._id), email: user.email, firstName: user.firstName, lastName: user.lastName };
}

export async function listUsers() {
  await connectDB();
  return User.find().populate("awards").lean();
}

export async function findUser(id: string) {
  await expireOverdueAppointments();
  const user = await User.findById(id).populate("appointments").populate("donations").populate("awards").lean();
  if (!user) throw new DomainError(404, "Usuario no encontrado.");
  return user;
}

/** Última cita creada, en el mismo formato que devolvía GET /api/users/:id. */
export async function findUserWithLastAppointment(id: string) {
  const user = await findUser(id);
  const appointments = user.appointments as unknown as { status: string; appointmentDate: Date }[];
  const last = appointments.at(-1);
  return {
    user,
    lastAppointment: last
      ? { status: last.status, donationDate: last.status === "Completed" ? last.appointmentDate : null }
      : null,
  };
}

export async function findUserDetails(id: string) {
  await expireOverdueAppointments();
  const institutionFields = "name address institutionType email dailyDonorCapacity";
  const user = await User.findById(id)
    .populate({ path: "donations", populate: { path: "institutionId", select: institutionFields } })
    .populate({ path: "appointments", populate: { path: "institutionId", select: institutionFields } })
    .populate("awards")
    .lean();
  if (!user) throw new DomainError(404, "Usuario no encontrado.");
  const { donations, appointments, awards, totalPoints } = user;
  return { donations, appointments, awards, totalPoints };
}

export async function updateUser(id: string, input: z.output<typeof profileUpdateSchema>) {
  await connectDB();
  const clash = await User.exists({ email: input.email, _id: { $ne: id } }).collation(CASE_INSENSITIVE);
  if (clash) throw new DomainError(409, EMAIL_TAKEN);
  const user = await User.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true }).lean();
  if (!user) throw new DomainError(404, "Usuario no encontrado.");
  return user;
}

/** Borra también citas, donaciones y sus referencias, como promete la pantalla de baja. */
export async function deleteUser(id: string) {
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user) throw new DomainError(404, "Usuario no encontrado.");
  await Promise.all([
    Institution.updateMany(
      { $or: [{ donations: { $in: user.donations } }, { appointments: { $in: user.appointments } }] },
      { $pull: { donations: { $in: user.donations }, appointments: { $in: user.appointments } } },
    ),
    Donation.deleteMany({ userId: id }),
    Appointment.deleteMany({ userId: id }),
  ]);
  await User.deleteOne({ _id: id });
}
