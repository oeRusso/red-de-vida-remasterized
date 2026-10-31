import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  type AppointmentStatus,
  bookingWindow,
  type BloodType,
  type Gender,
  type OperatingHours,
  todayKey,
} from "@/domain/rules";
import { connectDB } from "./db";
import { Appointment, Donation, User } from "./models";
import { expireOverdueAppointments, lastDonationDate, listAppointments } from "./services/appointments";
import { listInstitutions } from "./services/institutions";
import { getSession } from "./session";

/*
 * Lectura para Server Components: valida la sesión y devuelve objetos planos y
 * acotados. Nada de lo que sale de aquí debe contener _id de Mongoose ni el hash.
 */

type PopulatedInstitution = { name: string; address: string; institutionType: string } | null;

export type ProfileView = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender;
  bloodType: BloodType;
  birthday: string;
  diseases: string[];
  totalPoints: number;
  donationCount: number;
};

const loadCurrentUser = cache(async (): Promise<{ profile: ProfileView; isAdmin: boolean } | null> => {
  const session = await getSession();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.userId).lean();
  if (!user) return null;
  return {
    isAdmin: session.isAdmin,
    profile: {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender as Gender,
      bloodType: user.bloodType as BloodType,
      birthday: user.birthday.toISOString(),
      diseases: user.diseases.map((disease) => disease.name),
      totalPoints: user.totalPoints ?? 0,
      donationCount: user.donations.length,
    },
  };
});

export const getOptionalUser = loadCurrentUser;

/** Cubre también la sesión válida de un usuario ya borrado. */
export async function requireUser() {
  const current = await loadCurrentUser();
  if (!current) redirect("/login");
  return current;
}

export async function requireAdminUser() {
  const current = await requireUser();
  if (!current.isAdmin) redirect("/premios");
  return current;
}

export type AppointmentView = {
  id: string;
  date: string;
  status: AppointmentStatus;
  notes: string;
  institutionName: string;
  institutionAddress: string;
};

export type DonationView = {
  id: string;
  number: number;
  date: string;
  institutionName: string;
  institutionAddress: string;
};

/** Instituciones borradas por el legacy dejan la referencia colgando: se muestran sin romper la página. */
const institutionLabel = (institution: PopulatedInstitution) => ({
  institutionName: institution?.name ?? "Institución no disponible",
  institutionAddress: institution?.address ?? "",
});

export async function getDonorHistory(userId: string) {
  await expireOverdueAppointments();
  const [donations, lastAppointment] = await Promise.all([
    Donation.find({ userId }).sort({ donationDate: 1 }).populate("institutionId", "name address").lean(),
    Appointment.findOne({ userId }).sort({ _id: -1 }).populate("institutionId", "name address").lean(),
  ]);

  const donationViews: DonationView[] = donations.map((donation, index) => ({
    id: String(donation._id),
    number: index + 1,
    date: donation.donationDate.toISOString(),
    ...institutionLabel(donation.institutionId as unknown as PopulatedInstitution),
  }));

  const appointment: AppointmentView | null = lastAppointment && {
    id: String(lastAppointment._id),
    date: lastAppointment.appointmentDate.toISOString(),
    status: (lastAppointment.status ?? "Pending") as AppointmentStatus,
    notes: lastAppointment.notes ?? "",
    ...institutionLabel(lastAppointment.institutionId as unknown as PopulatedInstitution),
  };

  return { donations: donationViews.reverse(), lastAppointment: appointment };
}

export async function getBookingContext(profile: ProfileView) {
  await expireOverdueAppointments();
  const today = todayKey();
  const lastDonation = await lastDonationDate(profile.id);
  const window = bookingWindow(profile.gender, lastDonation, today);
  return {
    hasPending: Boolean(await Appointment.exists({ userId: profile.id, status: "Pending" })),
    window,
    mustWait: window.from > today,
  };
}

export type InstitutionOption = {
  id: string;
  name: string;
  type: string;
  address: string;
  operatingHours: OperatingHours;
};

export async function getInstitutionOptions(): Promise<InstitutionOption[]> {
  const institutions = await listInstitutions();
  return institutions.map((institution) => ({
    id: String(institution._id),
    name: institution.name,
    type: institution.institutionType,
    address: institution.address,
    operatingHours: institution.operatingHours as OperatingHours,
  }));
}

export async function getPendingAppointments() {
  const appointments = await listAppointments({ status: "Pending" });
  return appointments.map((appointment) => {
    const donor = appointment.userId as unknown as { firstName: string; lastName: string; email: string; bloodType: string } | null;
    return {
      id: String(appointment._id),
      date: appointment.appointmentDate.toISOString(),
      donorName: donor ? `${donor.firstName} ${donor.lastName}` : "Usuario no disponible",
      donorEmail: donor?.email ?? "",
      bloodType: donor?.bloodType ?? "",
      notes: appointment.notes ?? "",
      ...institutionLabel(appointment.institutionId as unknown as PopulatedInstitution),
    };
  });
}
