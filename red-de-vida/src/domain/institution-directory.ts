/**
 * El esquema de Institution no tiene campo `website`: el legacy resolvía la web
 * por nombre con esta misma lista. Una institución fuera de ella simplemente no
 * muestra enlace (el legacy lanzaba TypeError y dejaba de pintar la página).
 */
export const INSTITUTION_DIRECTORY = [
  { name: "Hospital El Cruce", type: "Hospital", address: "Av. Calchaquí 5401, B1888 Florencio Varela, Provincia de Buenos Aires", website: "https://www.hospitalelcruce.org/" },
  { name: "Clínica del Sol", type: "Clínica", address: "Av. Coronel Díaz 2211, C1425 Cdad. Autónoma de Buenos Aires", website: "https://www.cdelsol.com.ar/cdelsol/" },
  { name: "Banco de Sangre de Buenos Aires", type: "Banco de Sangre", address: "Av. Díaz Vélez 3973, Cdad. Autónoma de Buenos Aires", website: "https://www.hemocentro.org/" },
  { name: "Hospital de Clínicas 'Dr. Alberto de Zara'", type: "Hospital", address: "Av. Córdoba 2351, C1120 Cdad. Autónoma de Buenos Aires", website: "https://portal.hospitaldeclinicas.uba.ar/" },
  { name: "Hospital Italiano de Buenos Aires", type: "Hospital", address: "Perón 4190, Almagro, Cdad. Autónoma de Buenos Aires", website: "https://www.hospitalitaliano.org.ar/" },
  { name: "Clínica Zabala", type: "Clínica", address: "Av. Cabildo 1295, C1426AAM Cdad. Autónoma de Buenos Aires", website: "https://www.swissmedical.com.ar/clinewsite/zabala/" },
  { name: "Hospital de Niños 'Ricardo Gutiérrez'", type: "Hospital", address: "Gallo 1330, Recoleta, Cdad. Autónoma de Buenos Aires", website: "https://buenosaires.gob.ar/salud/hospitales-y-establecimientos-de-salud/hospital-de-ninos-dr-ricardo-gutierrez" },
  { name: "Instituto del Cáncer de la Fundación Favaloro", type: "Clínica", address: "Av. Belgrano 1746, Cdad. Autónoma de Buenos Aires", website: "https://www.fundacionfavaloro.org/" },
  { name: "Banco Central de Sangre", type: "Banco de Sangre", address: "Av. Díaz Vélez 3973, Cdad. Autónoma de Buenos Aires", website: "https://www.hemocentro.org/" },
  { name: "Hospital Militar Central 'Cirujano Mayor Dr. Cosme Argerich'", type: "Hospital", address: "Av. Luis María Campos 726-800, Cdad. Autónoma de Buenos Aires", website: "https://www2.hmc.mil.ar/" },
  { name: "Hospital Central", type: "Hospital", address: "L. N. Alem &, M5502 Salta, Mendoza", website: "https://www.facebook.com/people/Hospital-Central-de-Mendoza/100068122383336/" },
  { name: "Clínica Norte", type: "Clínica", address: "25 de Mayo 138 - 4200 Santiago del Estero", website: "https://sanatorionorte.com/" },
] as const;

export const institutionWebsite = (name: string) =>
  INSTITUTION_DIRECTORY.find((entry) => entry.name === name)?.website ?? null;

export const mapEmbedUrl = (address: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
