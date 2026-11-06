/** Archivo .ics con hora local "flotante": 10:00 se ve como 10:00 en cualquier calendario. */
export function appointmentIcs(input: { dateKey: string; time: string; title: string; location: string }) {
  const start = `${input.dateKey.replaceAll("-", "")}T${input.time.replace(":", "")}00`;
  const [hours, minutes] = input.time.split(":").map(Number);
  // Una donación promedio toma hasta una hora.
  const end = `${input.dateKey.replaceAll("-", "")}T${String(hours + 1).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
  const escape = (text: string) => text.replace(/([,;\\])/g, "\\$1");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Red de Vida//Citas//ES",
    "BEGIN:VEVENT",
    `UID:${start}-${crypto.randomUUID()}@reddevida`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, "")}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escape(input.title)}`,
    `LOCATION:${escape(input.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
