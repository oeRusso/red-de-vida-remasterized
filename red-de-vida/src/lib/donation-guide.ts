/*
 * Información para el donante. Sale de la guía del Ministerio de Salud de la Nación
 * (argentina.gob.ar/salud/donarsangre) salvo la conservación de componentes; las fuentes
 * están en docs/reglas-de-negocio.md. Es orientativa: no cambia ninguna regla de reserva.
 */

export const BEFORE_DONATING = [
  "Lleva tu DNI: te lo pedirán al llegar.",
  "Duerme al menos 6 horas la noche anterior.",
  "Desayuna o almuerza como siempre: no tienes que ir en ayunas.",
  "Toma abundante líquido, sin alcohol.",
  "Si tienes fiebre, resfrío, tos o malestar, cancela y agenda para otro día.",
];

export const DONATION_DAY = [
  { title: "Recepción", text: "Presentas tu DNI y te explican qué estudios se le hacen a la sangre." },
  { title: "Entrevista", text: "El personal de salud conversa contigo para ver si puedes donar. Lo que cuentes es confidencial." },
  { title: "Control", text: "Se verifican peso, temperatura, pulso y presión, y se toma una muestra para revisar tus glóbulos rojos." },
  { title: "Extracción", text: "Dura entre 7 y 10 minutos. Se extraen unos 450 ml, siempre con material descartable." },
  { title: "Refrigerio", text: "Recuperas líquidos y azúcar antes de irte, y recibes tu certificado de donación." },
];

export const AFTER_DONATING = [
  "No hagas esfuerzos ni cargues peso con ese brazo durante 6 horas.",
  "Evita el alcohol por 6 horas y no fumes, sobre todo en las primeras 2.",
  "Bebe abundante líquido, como agua, jugo o leche.",
  "Si en la semana siguiente tienes fiebre, diarrea o vómitos, avisa a la sede donde donaste.",
];

export const BLOOD_TESTS = ["Hepatitis B", "Hepatitis C", "VIH/sida", "Chagas", "Sífilis", "HTLV", "Brucelosis"];

export const BLOOD_COMPONENTS = [
  { name: "Glóbulos rojos", storage: "Refrigerados a 4 °C", duration: "Hasta 42 días" },
  { name: "Plaquetas", storage: "A 22 °C y en agitación", duration: "Alrededor de 5 días" },
  { name: "Plasma", storage: "Congelado", duration: "1 año o más" },
];
