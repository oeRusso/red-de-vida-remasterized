/**
 * Reglas de negocio puras. Sin dependencias de Next ni de Mongo: las usan tanto
 * el servidor (que es quien decide) como el cliente (que solo anticipa el
 * resultado para dar feedback). Detalle en docs/reglas-de-negocio.md.
 */

export const POINTS_PER_DONATION = 30;
export const POINTS_PER_LEVEL = 90;
export const SLOT_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 90;
export const MIN_DONOR_AGE = 18;
export const MAX_DONOR_AGE = 75;
export const DONATIONS_PER_PAGE = 8;
/** Días tras la cita en los que un administrador aún puede confirmarla antes de que caduque. */
export const PENDING_GRACE_DAYS = 1;

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const GENDERS = ["Male", "Female"] as const;
export const APPOINTMENT_STATUSES = ["Pending", "Completed", "Cancelled"] as const;
export const INSTITUTION_TYPES = ["Hospital", "Clínica", "Banco de Sangre"] as const;
export const DISEASES = ["Diabetes", "Hipertensión", "Asma", "Artritis", "Cáncer"] as const;

export type BloodType = (typeof BLOOD_TYPES)[number];
export type Gender = (typeof GENDERS)[number];
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

export const GENDER_LABELS: Record<Gender, string> = { Male: "Hombre", Female: "Mujer" };

export const DONATION_INTERVAL_MONTHS: Record<Gender, number> = { Male: 3, Female: 4 };

export const MEDALS = [
  { level: 1, name: "Medalla 1", pointsRequired: 30 },
  { level: 2, name: "Medalla 2", pointsRequired: 120 },
  { level: 3, name: "Medalla 3", pointsRequired: 210 },
  { level: 4, name: "Medalla 4", pointsRequired: 300 },
  { level: 5, name: "Medalla 5", pointsRequired: 390 },
  { level: 6, name: "Medalla 6", pointsRequired: 480 },
] as const;

export function levelProgress(points: number) {
  const intoLevel = points % POINTS_PER_LEVEL;
  return {
    level: Math.floor(points / POINTS_PER_LEVEL),
    percent: Math.round((intoLevel / POINTS_PER_LEVEL) * 100),
    pointsToNext: POINTS_PER_LEVEL - intoLevel,
  };
}

/*
 * Fechas de cita: "hora de pared en UTC".
 * El sistema legacy guarda la hora elegida tal cual en los campos UTC: las 09:00
 * en Buenos Aires quedan como 09:00Z, no como 12:00Z. Hay datos reales con ese
 * formato, así que se conserva: leer y escribir SIEMPRE con métodos UTC.
 */
export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha y hora actuales en la zona de la app, expresadas como hora de pared en UTC. */
export function nowAsWallClock(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return new Date(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:00.000Z`);
}

export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
export const toTimeKey = (date: Date) => `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
export const todayKey = (now: Date = new Date()) => toDateKey(nowAsWallClock(now));
export const slotToDate = (dateKey: string, time: string) => new Date(`${dateKey}T${time}:00.000Z`);

export function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

/** Suma meses sin desbordar: 30/11 + 3 meses es 28/02, no 02/03. */
export function addMonths(dateKey: string, months: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return toDateKey(target);
}

/** Una cita Pending anterior a esta fecha ya caducó: el día de la cita más el de gracia terminaron. */
export const pendingCutoff = (now: Date = new Date()) =>
  new Date(`${addDays(todayKey(now), -PENDING_GRACE_DAYS)}T00:00:00.000Z`);

export function ageOn(birthday: Date | string, today: string): number {
  const [birthYear, birthMonth, birthDay] = toDateKey(new Date(birthday)).split("-").map(Number);
  const [year, month, day] = today.split("-").map(Number);
  const hadBirthday = month > birthMonth || (month === birthMonth && day >= birthDay);
  return year - birthYear - (hadBirthday ? 0 : 1);
}

export const isDonorAge = (birthday: Date | string, today: string) => {
  const age = ageOn(birthday, today);
  return age >= MIN_DONOR_AGE && age <= MAX_DONOR_AGE;
};

/** Primera fecha en la que se puede volver a donar, o null si nunca donó. */
export function nextEligibleDate(gender: Gender, lastDonation: Date | string | null | undefined) {
  if (!lastDonation) return null;
  return addMonths(toDateKey(new Date(lastDonation)), DONATION_INTERVAL_MONTHS[gender]);
}

/** Ventana reservable: desde hoy o la próxima fecha habilitada, y 90 días más. */
export function bookingWindow(gender: Gender, lastDonation: Date | string | null | undefined, today: string) {
  const eligible = nextEligibleDate(gender, lastDonation);
  const from = eligible && eligible > today ? eligible : today;
  return { from, to: addDays(from, BOOKING_WINDOW_DAYS) };
}

export type DayHours = { open?: string | null; close?: string | null };
export type OperatingHours = {
  mondayToFriday: DayHours;
  saturday?: DayHours | null;
  sunday?: DayHours | null;
};

const toMinutes = (time: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

/** Turnos de 30 minutos; el último debe terminar antes del cierre. */
export function generateSlots(hours: DayHours | null | undefined): string[] {
  const start = hours?.open ? toMinutes(hours.open) : null;
  const end = hours?.close ? toMinutes(hours.close) : null;
  if (start === null || end === null) return [];
  const slots: string[] = [];
  for (let minute = start; minute + SLOT_MINUTES <= end; minute += SLOT_MINUTES) {
    slots.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
  }
  return slots;
}

export function slotsForDate(hours: OperatingHours, dateKey: string): string[] {
  const weekday = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  if (weekday === 0) return generateSlots(hours.sunday);
  if (weekday === 6) return generateSlots(hours.saturday);
  return generateSlots(hours.mondayToFriday);
}

export type InstitutionSchedule = {
  operatingHours: OperatingHours;
  dailyDonorCapacity: number;
  /** Fechas ISO de citas que ocupan turno (todas menos las canceladas). */
  occupied: string[];
};

export type DayState = "closed" | "full" | "available";

export function availableSlots(schedule: InstitutionSchedule, dateKey: string, now: Date = new Date()): string[] {
  const occupied = schedule.occupied.map((iso) => new Date(iso)).filter((date) => toDateKey(date) === dateKey);
  if (occupied.length >= schedule.dailyDonorCapacity) return [];
  const taken = new Set(occupied.map(toTimeKey));
  const wallNow = nowAsWallClock(now);
  return slotsForDate(schedule.operatingHours, dateKey).filter(
    (time) => !taken.has(time) && slotToDate(dateKey, time) > wallNow,
  );
}

/** Primer día reservable de la ventana, o null si no queda ninguno. */
export function firstAvailableDay(schedule: InstitutionSchedule, from: string, to: string, now: Date = new Date()) {
  for (let day = from; day <= to; day = addDays(day, 1)) {
    if (dayState(schedule, day, now) === "available") return day;
  }
  return null;
}

export function dayState(schedule: InstitutionSchedule, dateKey: string, now: Date = new Date()): DayState {
  if (slotsForDate(schedule.operatingHours, dateKey).length === 0) return "closed";
  return availableSlots(schedule, dateKey, now).length > 0 ? "available" : "full";
}
