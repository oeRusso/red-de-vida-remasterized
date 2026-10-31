/* Las fechas viajan como "hora de pared en UTC" (ver domain/rules.ts): formatear en UTC es lo correcto. */
const formatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", ...options });

const long = formatter({ day: "numeric", month: "long", year: "numeric" });
const weekday = formatter({ weekday: "long", day: "numeric", month: "long" });
const time = formatter({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const short = formatter({ day: "2-digit", month: "2-digit", year: "numeric" });
const month = formatter({ month: "long", year: "numeric" });

const dateOf = (value: string) => new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);

export const formatLongDate = (value: string) => long.format(dateOf(value));
export const formatWeekday = (value: string) => weekday.format(dateOf(value));
export const formatTime = (value: string) => time.format(dateOf(value));
export const formatShortDate = (value: string) => short.format(dateOf(value));
export const formatMonth = (value: string) => month.format(dateOf(value));
