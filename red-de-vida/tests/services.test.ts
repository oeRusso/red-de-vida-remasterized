import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { addDays, MEDALS, slotToDate, todayKey } from "@/domain/rules";
import { connectDB } from "@/server/db";
import { DomainError } from "@/server/errors";
import { Appointment, Award, Donation, Institution, User } from "@/server/models";
import {
  cancelAppointment,
  confirmAppointment,
  createAppointment,
  expireOverdueAppointments,
  occupiedDates,
} from "@/server/services/appointments";
import { deleteInstitution, institutionSchedule } from "@/server/services/institutions";
import { authenticate, deleteUser, findUserDetails, registerUser, updateUser } from "@/server/services/users";

/** Hash generado con bcryptjs 2.4.3, la versión del backend Express, para "Legacy1234". */
const LEGACY_HASH = "$2a$10$/hj8TwQ5XZTmUdXlIU.q3.3OJv9FmhUmtXfRrTAT3IoVGUFCT8/AG";

let server: MongoMemoryServer;

const baseUser = {
  firstName: "Ana",
  lastName: "Paz",
  birthday: "1990-01-01",
  gender: "Female" as const,
  bloodType: "O+" as const,
  email: "ana@mail.com",
  password: "Segura123",
  diseases: [],
};

async function makeUser(overrides: Partial<typeof baseUser> = {}) {
  const user = await registerUser({ ...baseUser, ...overrides });
  return String(user._id);
}

async function makeInstitution(overrides: Record<string, unknown> = {}) {
  const institution = await Institution.create({
    name: "Hospital Test",
    institutionType: "Hospital",
    address: "Calle 123",
    email: `h${Math.random()}@mail.com`,
    operatingHours: {
      mondayToFriday: { open: "08:00", close: "16:00" },
      saturday: { open: "08:00", close: "16:00" },
      sunday: { open: "08:00", close: "16:00" },
    },
    dailyDonorCapacity: 100,
    ...overrides,
  });
  return String(institution._id);
}

const inDays = (days: number, time = "10:00") => slotToDate(addDays(todayKey(), days), time).toISOString();

const expectError = async (promise: Promise<unknown>, status: number) => {
  const error = (await promise.catch((caught) => caught)) as DomainError;
  expect(error).toBeInstanceOf(DomainError);
  expect(error.status).toBe(status);
};

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  await connectDB(server.getUri("reddevida"));
  await Promise.all([User.init(), Appointment.init(), Institution.init(), Award.init()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await server.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Appointment.deleteMany({}),
    Donation.deleteMany({}),
    Institution.deleteMany({}),
    Award.deleteMany({}),
  ]);
  await Award.insertMany([...MEDALS]);
});

describe("compatibilidad con la base existente", () => {
  it("usa los mismos nombres de colección", () => {
    expect([User, Appointment, Donation, Institution, Award].map((m) => m.collection.name)).toEqual([
      "users",
      "appointments",
      "donations",
      "institutions",
      "awards",
    ]);
  });

  it("autentica con un hash creado por el backend Express", async () => {
    await User.collection.insertOne({
      firstName: "Vieja",
      lastName: "Cuenta",
      birthday: new Date("1990-01-01"),
      gender: "Male",
      bloodType: "A+",
      email: "Vieja@Mail.com",
      password: LEGACY_HASH,
      diseases: [],
      donations: [],
      appointments: [],
      awards: [],
      totalPoints: 0,
    });
    const user = await authenticate({ email: "vieja@mail.com", password: "Legacy1234" });
    expect(user.firstName).toBe("Vieja");
    await expectError(authenticate({ email: "vieja@mail.com", password: "mala" }), 401);
  });

  it("lee las citas guardadas por el legacy sin campos nuevos", async () => {
    const userId = await makeUser();
    const institutionId = await makeInstitution();
    await Appointment.collection.insertOne({
      userId: new mongoose.Types.ObjectId(userId),
      institutionId: new mongoose.Types.ObjectId(institutionId),
      appointmentDate: new Date(inDays(1)),
      status: "Cancelled",
    });
    expect(await occupiedDates(institutionId)).toEqual([]);
  });
});

describe("usuarios", () => {
  it("hashea la contraseña y no la devuelve en consultas normales", async () => {
    const id = await makeUser();
    expect((await User.findById(id).lean())?.password).toBeUndefined();
    const stored = await User.findById(id).select("+password").lean();
    expect(stored?.password).toMatch(/^\$2[aby]\$/);
  });

  it("rechaza emails repetidos aunque cambien las mayúsculas", async () => {
    await User.collection.insertOne({ email: "Ana@Mail.com" });
    await expectError(makeUser(), 409);
  });

  it("no deja tomar el email de otro usuario", async () => {
    await makeUser();
    const other = await makeUser({ email: "otra@mail.com" });
    await expectError(
      updateUser(other, { firstName: "Otra", lastName: "Paz", email: "ana@mail.com", bloodType: "A+", diseases: [] }),
      409,
    );
  });

  it("al darse de baja borra citas, donaciones y referencias", async () => {
    const userId = await makeUser();
    const other = await makeUser({ email: "otra@mail.com" });
    const institutionId = await makeInstitution();

    const done = await createAppointment(userId, { institutionId, appointmentDate: inDays(1) });
    await confirmAppointment(String(done._id));
    await createAppointment(userId, { institutionId, appointmentDate: inDays(130) });
    const kept = await createAppointment(other, { institutionId, appointmentDate: inDays(2) });

    await deleteUser(userId);

    expect(await User.exists({ _id: userId })).toBeNull();
    expect(await Appointment.countDocuments({ userId })).toBe(0);
    expect(await Donation.countDocuments({ userId })).toBe(0);
    const institution = await Institution.findById(institutionId).lean();
    expect(institution?.donations).toHaveLength(0);
    expect(institution?.appointments.map(String)).toEqual([String(kept._id)]);
  });
});

describe("agendar cita", () => {
  it("crea la cita y la enlaza a usuario e institución", async () => {
    const userId = await makeUser();
    const institutionId = await makeInstitution();
    const appointment = await createAppointment(userId, { institutionId, appointmentDate: inDays(1), notes: "Nota" });

    expect(appointment.status).toBe("Pending");
    expect((await User.findById(userId).lean())?.appointments.map(String)).toEqual([String(appointment._id)]);
    expect((await Institution.findById(institutionId).lean())?.appointments.map(String)).toEqual([String(appointment._id)]);
  });

  it("no admite dos citas pendientes del mismo usuario", async () => {
    const userId = await makeUser();
    const institutionId = await makeInstitution();
    await createAppointment(userId, { institutionId, appointmentDate: inDays(1) });
    await expectError(createAppointment(userId, { institutionId, appointmentDate: inDays(2) }), 409);
  });

  it("no admite dos usuarios en el mismo turno", async () => {
    const institutionId = await makeInstitution();
    await createAppointment(await makeUser(), { institutionId, appointmentDate: inDays(1) });
    const other = await makeUser({ email: "otra@mail.com" });
    await expectError(createAppointment(other, { institutionId, appointmentDate: inDays(1) }), 409);
  });

  it("resuelve reservas simultáneas dejando una sola", async () => {
    const institutionId = await makeInstitution();
    const a = await makeUser();
    const b = await makeUser({ email: "otra@mail.com" });
    const results = await Promise.allSettled(
      [a, b].map((id) => createAppointment(id, { institutionId, appointmentDate: inDays(1) })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await Appointment.countDocuments({ institutionId })).toBe(1);
  });

  it("libera el turno cuando la cita se cancela", async () => {
    const institutionId = await makeInstitution();
    const first = await createAppointment(await makeUser(), { institutionId, appointmentDate: inDays(1) });
    await cancelAppointment(String(first._id));
    const other = await makeUser({ email: "otra@mail.com" });
    await expect(createAppointment(other, { institutionId, appointmentDate: inDays(1) })).resolves.toBeDefined();
  });

  it.each([
    ["en el pasado", () => inDays(-1)],
    ["más allá de los 90 días", () => inDays(91)],
    ["fuera de horario", () => inDays(1, "20:00")],
    ["en minutos no múltiplos de 30", () => inDays(1, "10:15")],
  ])("rechaza una cita %s", async (_label, date) => {
    const userId = await makeUser();
    const institutionId = await makeInstitution();
    await expect(createAppointment(userId, { institutionId, appointmentDate: date() })).rejects.toBeInstanceOf(DomainError);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  it("rechaza una institución inexistente", async () => {
    const institutionId = String(new mongoose.Types.ObjectId());
    await expectError(createAppointment(await makeUser(), { institutionId, appointmentDate: inDays(1) }), 404);
  });

  it("respeta la capacidad diaria", async () => {
    const institutionId = await makeInstitution({ dailyDonorCapacity: 1 });
    await createAppointment(await makeUser(), { institutionId, appointmentDate: inDays(1, "10:00") });
    const other = await makeUser({ email: "otra@mail.com" });
    await expectError(createAppointment(other, { institutionId, appointmentDate: inDays(1, "11:00") }), 409);
  });

  it("respeta el intervalo entre donaciones aunque luego haya una cita cancelada", async () => {
    const userId = await makeUser();
    const institutionId = await makeInstitution();
    const done = await createAppointment(userId, { institutionId, appointmentDate: inDays(1) });
    await confirmAppointment(String(done._id));

    // En el legacy cancelar una cita posterior borraba la restricción.
    const later = await createAppointment(userId, { institutionId, appointmentDate: inDays(125) });
    await cancelAppointment(String(later._id));

    await expectError(createAppointment(userId, { institutionId, appointmentDate: inDays(30) }), 422);
  });

  it("no deja reservar con enfermedades registradas", async () => {
    const institutionId = await makeInstitution();
    const userId = await makeUser();
    await User.updateOne({ _id: userId }, { diseases: [{ name: "Asma" }] });
    await expectError(createAppointment(userId, { institutionId, appointmentDate: inDays(1) }), 422);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  it("deja reservar al quitar las enfermedades del perfil", async () => {
    const institutionId = await makeInstitution();
    const userId = await makeUser();
    await User.updateOne({ _id: userId }, { diseases: [{ name: "Asma" }] });
    await updateUser(userId, { firstName: "Ana", lastName: "Paz", email: baseUser.email, bloodType: "O+", diseases: [] });
    await expect(createAppointment(userId, { institutionId, appointmentDate: inDays(1) })).resolves.toBeDefined();
  });

  it("no deja reservar fuera de la edad permitida", async () => {
    const institutionId = await makeInstitution();
    const userId = await makeUser();
    await User.updateOne({ _id: userId }, { birthday: new Date("1940-01-01") });
    await expectError(createAppointment(userId, { institutionId, appointmentDate: inDays(1) }), 422);
  });
});

describe("confirmar cita", () => {
  async function pending() {
    const userId = await makeUser();
    const institutionId = await makeInstitution();
    const appointment = await createAppointment(userId, { institutionId, appointmentDate: inDays(1), notes: "Ayuno" });
    return { userId, institutionId, id: String(appointment._id) };
  }

  it("genera la donación, suma 30 puntos y otorga la primera medalla", async () => {
    const { userId, institutionId, id } = await pending();
    const result = await confirmAppointment(id);

    expect(result?.totalPoints).toBe(30);
    expect(result?.newAward?.level).toBe(1);
    expect(result?.donation.bloodType).toBe("O+");
    expect(result?.donation.notes).toBe("Ayuno");

    const details = await findUserDetails(userId);
    expect(details.donations).toHaveLength(1);
    expect(details.awards).toHaveLength(1);
    expect((await Institution.findById(institutionId).lean())?.donations).toHaveLength(1);
  });

  it("no informa medalla nueva si ya la tenía", async () => {
    const { userId, id } = await pending();
    await confirmAppointment(id);
    await User.updateOne({ _id: userId }, { $set: { totalPoints: 30 } });
    await Appointment.updateOne({ _id: id }, { status: "Pending" });
    expect((await confirmAppointment(id))?.newAward).toBeNull();
  });

  it("no suma dos veces si se confirma en paralelo", async () => {
    const { userId, id } = await pending();
    const results = await Promise.allSettled([confirmAppointment(id), confirmAppointment(id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await User.findById(userId).lean())?.totalPoints).toBe(30);
    expect(await Donation.countDocuments({ userId })).toBe(1);
  });

  it("no confirma una cita cancelada", async () => {
    const { id } = await pending();
    await cancelAppointment(id);
    await expectError(confirmAppointment(id), 409);
  });

  it("devuelve 404 si la cita no existe", async () => {
    await expectError(confirmAppointment(String(new mongoose.Types.ObjectId())), 404);
  });
});

describe("caducidad de citas", () => {
  async function overdue(daysAgo: number) {
    const userId = await makeUser();
    const institutionId = await makeInstitution();
    const appointment = await Appointment.create({
      userId,
      institutionId,
      appointmentDate: inDays(-daysAgo),
      status: "Pending",
    });
    return { userId, institutionId, id: String(appointment._id) };
  }

  it("una cita vencida deja de bloquear nuevas reservas", async () => {
    const { userId, institutionId, id } = await overdue(2);
    await expect(createAppointment(userId, { institutionId, appointmentDate: inDays(1) })).resolves.toBeDefined();
    expect((await Appointment.findById(id).lean())?.status).toBe("Cancelled");
  });

  it("una cita vencida ya no se puede confirmar ni suma puntos", async () => {
    const { userId, id } = await overdue(2);
    await expectError(confirmAppointment(id), 409);
    expect((await User.findById(userId).lean())?.totalPoints).toBe(0);
  });

  it("el administrador aún puede confirmar el día siguiente a la cita", async () => {
    const { id } = await overdue(1);
    expect((await confirmAppointment(id))?.totalPoints).toBe(30);
  });

  it("caduca sin que nadie reserve, al consultar el historial", async () => {
    const { userId, id } = await overdue(2);
    await findUserDetails(userId);
    expect((await Appointment.findById(id).lean())?.status).toBe("Cancelled");
  });

  it("no toca citas futuras ni completadas", async () => {
    const institutionId = await makeInstitution();
    const future = await createAppointment(await makeUser(), { institutionId, appointmentDate: inDays(1) });
    const other = await makeUser({ email: "otra@mail.com" });
    const past = await Appointment.create({ userId: other, institutionId, appointmentDate: inDays(-5), status: "Completed" });
    await expireOverdueAppointments();
    expect((await Appointment.findById(future._id).lean())?.status).toBe("Pending");
    expect((await Appointment.findById(past._id).lean())?.status).toBe("Completed");
  });
});

describe("cancelar cita", () => {
  it("impide cancelar la cita de otro usuario", async () => {
    const institutionId = await makeInstitution();
    const appointment = await createAppointment(await makeUser(), { institutionId, appointmentDate: inDays(1) });
    const other = await makeUser({ email: "otra@mail.com" });
    await expectError(cancelAppointment(String(appointment._id), other), 403);
    expect((await Appointment.findById(appointment._id).lean())?.status).toBe("Pending");
  });
});

describe("instituciones", () => {
  it("la agenda no expone datos de los donantes", async () => {
    const institutionId = await makeInstitution();
    await createAppointment(await makeUser(), { institutionId, appointmentDate: inDays(1), notes: "Privado" });
    const schedule = await institutionSchedule(institutionId);
    expect(schedule.occupied).toHaveLength(1);
    expect(JSON.stringify(schedule)).not.toContain("Privado");
    expect(schedule).not.toHaveProperty("appointments");
  });

  it("no borra una institución con historial", async () => {
    const institutionId = await makeInstitution();
    await createAppointment(await makeUser(), { institutionId, appointmentDate: inDays(1) });
    await expectError(deleteInstitution(institutionId), 409);
  });

  it("borra una institución sin historial", async () => {
    const institutionId = await makeInstitution();
    await deleteInstitution(institutionId);
    expect(await Institution.exists({ _id: institutionId })).toBeNull();
  });
});
