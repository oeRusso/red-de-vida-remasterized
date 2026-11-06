import { describe, expect, it } from "vitest";
import {
  addMonths,
  ageOn,
  availableSlots,
  bookingWindow,
  dayState,
  earliestSlot,
  firstAvailableDay,
  generateSlots,
  levelProgress,
  MEDALS,
  nextEligibleDate,
  nowAsWallClock,
  pendingCutoff,
  slotToDate,
  todayKey,
  toTimeKey,
} from "@/domain/rules";
import { profileUpdateSchema, registerSchema } from "@/domain/schemas";

const hours = {
  mondayToFriday: { open: "08:00", close: "10:00" },
  saturday: { open: "08:00", close: "09:00" },
};
// 2030-03-04 es lunes; `now` queda muy por detrás para que ningún turno sea pasado.
const monday = "2030-03-04";
const now = new Date("2030-01-01T12:00:00Z");
const schedule = { operatingHours: hours, dailyDonorCapacity: 10, occupied: [] as string[] };

describe("nivel y puntos", () => {
  it("sube de nivel cada 90 puntos, desde el nivel 0", () => {
    expect(levelProgress(0)).toMatchObject({ level: 0, percent: 0, pointsToNext: 90 });
    expect(levelProgress(60)).toMatchObject({ level: 0, percent: 67 });
    expect(levelProgress(90)).toMatchObject({ level: 1, percent: 0 });
  });
});

describe("medallas", () => {
  it("cada umbral sube 90 puntos desde la primera", () => {
    const steps = MEDALS.slice(1).map((medal, index) => medal.pointsRequired - MEDALS[index].pointsRequired);
    expect(new Set(steps)).toEqual(new Set([90]));
  });
});

describe("caducidad", () => {
  it("corta al terminar el día siguiente al de la cita", () => {
    // 10/03 a las 12:00 en Buenos Aires: todo lo anterior al 09/03 ya caducó.
    expect(pendingCutoff(new Date("2025-03-10T15:00:00Z")).toISOString()).toBe("2025-03-09T00:00:00.000Z");
  });
});

describe("intervalo entre donaciones", () => {
  it("espera 3 meses los hombres y 4 las mujeres", () => {
    expect(nextEligibleDate("Male", "2025-01-15T09:00:00Z")).toBe("2025-04-15");
    expect(nextEligibleDate("Female", "2025-01-15T09:00:00Z")).toBe("2025-05-15");
    expect(nextEligibleDate("Male", null)).toBeNull();
  });

  it("no desborda a fin de mes", () => {
    expect(addMonths("2024-11-30", 3)).toBe("2025-02-28");
  });

  it("abre la ventana hoy si ya pasó el intervalo", () => {
    expect(bookingWindow("Male", "2020-01-01T09:00:00Z", "2025-06-01")).toEqual({ from: "2025-06-01", to: "2025-08-30" });
  });

  it("abre la ventana en la próxima fecha habilitada si aún no pasó", () => {
    expect(bookingWindow("Female", "2025-05-01T09:00:00Z", "2025-06-01").from).toBe("2025-09-01");
  });
});

describe("edad", () => {
  it("no cuenta el año hasta cumplirlos", () => {
    expect(ageOn("2000-06-15", "2018-06-14")).toBe(17);
    expect(ageOn("2000-06-15", "2018-06-15")).toBe(18);
  });
});

describe("turnos", () => {
  it("genera turnos de 30 minutos que terminan antes del cierre", () => {
    expect(generateSlots({ open: "08:00", close: "09:45" })).toEqual(["08:00", "08:30", "09:00"]);
  });

  it("trata como cerrado un horario ausente (el legacy lanzaba TypeError)", () => {
    expect(generateSlots(undefined)).toEqual([]);
    expect(generateSlots({ open: "", close: "" })).toEqual([]);
    expect(dayState(schedule, "2030-03-10", now)).toBe("closed"); // domingo
  });

  it("usa el horario del sábado", () => {
    expect(availableSlots(schedule, "2030-03-09", now)).toEqual(["08:00", "08:30"]);
  });

  it("excluye los turnos ocupados de ese día", () => {
    const occupied = [slotToDate(monday, "08:30").toISOString()];
    expect(availableSlots({ ...schedule, occupied }, monday, now)).toEqual(["08:00", "09:00", "09:30"]);
  });

  it("marca el día completo al ocupar todos los turnos", () => {
    const occupied = ["08:00", "08:30", "09:00", "09:30"].map((t) => slotToDate(monday, t).toISOString());
    expect(dayState({ ...schedule, occupied }, monday, now)).toBe("full");
  });

  it("respeta la capacidad diaria aunque queden turnos libres", () => {
    const occupied = [slotToDate(monday, "08:00").toISOString()];
    expect(availableSlots({ ...schedule, occupied, dailyDonorCapacity: 1 }, monday, now)).toEqual([]);
  });

  it("encuentra el primer día reservable saltando cerrados y pasados", () => {
    // Sábado por la tarde: hoy ya no quedan turnos y el domingo está cerrado.
    const saturdayEvening = new Date("2030-03-09T20:00:00Z");
    expect(firstAvailableDay(schedule, "2030-03-09", "2030-06-07", saturdayEvening)).toBe("2030-03-11");
  });

  it("devuelve null si no queda ningún día", () => {
    const closed = { ...schedule, dailyDonorCapacity: 0 };
    expect(firstAvailableDay(closed, "2030-03-04", "2030-03-08", now)).toBeNull();
  });

  it("elige el primer turno libre del primer día reservable", () => {
    const occupied = [slotToDate(monday, "08:00").toISOString()];
    expect(earliestSlot({ ...schedule, occupied }, monday, "2030-03-08", now)).toEqual({ date: monday, time: "08:30" });
  });

  it("salta los días completos y los que agotaron su capacidad", () => {
    const full = ["08:00", "08:30", "09:00", "09:30"].map((t) => slotToDate(monday, t).toISOString());
    expect(earliestSlot({ ...schedule, occupied: full }, monday, "2030-03-08", now)).toEqual({ date: "2030-03-05", time: "08:00" });

    const occupied = [slotToDate(monday, "08:00").toISOString()];
    expect(earliestSlot({ ...schedule, occupied, dailyDonorCapacity: 1 }, monday, "2030-03-08", now)).toEqual({ date: "2030-03-05", time: "08:00" });
  });

  it("no ofrece un turno ya pasado ni fuera de la ventana", () => {
    // Lunes a las 09:15 en Buenos Aires (UTC-3)
    const lateMorning = new Date(`${monday}T12:15:00Z`);
    expect(earliestSlot(schedule, monday, "2030-03-08", lateMorning)).toEqual({ date: monday, time: "09:30" });
    // Domingo, único día de la ventana: está cerrado.
    expect(earliestSlot(schedule, "2030-03-10", "2030-03-10", now)).toBeNull();
  });

  it("no ofrece turnos ya pasados del día en curso", () => {
    // 08:45 en Buenos Aires (UTC-3)
    const morning = new Date(`${monday}T11:45:00Z`);
    expect(availableSlots(schedule, monday, morning)).toEqual(["09:00", "09:30"]);
  });
});

describe("hora de pared", () => {
  it("guarda la hora elegida en los campos UTC, como el legacy", () => {
    const date = slotToDate("2025-03-10", "09:30");
    expect(date.toISOString()).toBe("2025-03-10T09:30:00.000Z");
    expect(toTimeKey(date)).toBe("09:30");
  });

  it("calcula hoy en la zona de la app, no en UTC", () => {
    const lateAtNight = new Date("2025-03-11T01:00:00Z"); // 22:00 del día 10 en Buenos Aires
    expect(todayKey(lateAtNight)).toBe("2025-03-10");
    expect(nowAsWallClock(lateAtNight).toISOString()).toBe("2025-03-10T22:00:00.000Z");
  });
});

describe("validación de formularios", () => {
  const valid = {
    firstName: "José María",
    lastName: "Núñez",
    birthday: "1990-01-01",
    gender: "Male",
    bloodType: "O+",
    email: "JOSE@Mail.com",
    password: "Contr43s3nh4+",
  };

  it("acepta acentos, ñ y símbolos, que el legacy rechazaba", () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe("jose@mail.com");
    expect(parsed.diseases).toEqual([]);
  });

  it("acepta partículas en minúscula dentro del nombre", () => {
    expect(registerSchema.safeParse({ ...valid, lastName: "De la Cruz" }).success).toBe(true);
  });

  it("exige mayúscula inicial y rechaza números", () => {
    expect(registerSchema.safeParse({ ...valid, firstName: "jose" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, firstName: "Jose2" }).success).toBe(false);
  });

  it("rechaza menores de edad y mayores de 75", () => {
    expect(registerSchema.safeParse({ ...valid, birthday: "2020-01-01" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, birthday: "1900-01-01" }).success).toBe(false);
  });

  it("reporta una fecha vacía o inválida como error de campo, sin lanzar", () => {
    for (const birthday of ["", "no-es-fecha", "2024-13-45"]) {
      const result = registerSchema.safeParse({ ...valid, birthday });
      expect(result.success).toBe(false);
    }
  });

  it("descarta campos no permitidos al actualizar el perfil", () => {
    const parsed = profileUpdateSchema.parse({
      firstName: "Ana",
      lastName: "Paz",
      email: "ana@mail.com",
      bloodType: "A+",
      diseases: [],
      totalPoints: 9999,
      password: "hackeada",
    });
    expect(parsed).not.toHaveProperty("totalPoints");
    expect(parsed).not.toHaveProperty("password");
  });
});
