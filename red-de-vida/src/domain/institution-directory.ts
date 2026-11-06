/**
 * Sedes de la red. Son ficticias: Red de Vida es una organización inventada para esta
 * demo, no reserva turnos en centros reales y no enlaza a sitios de terceros.
 * `db:seed` las crea por nombre; `INSTITUTION_TYPES` no se amplía porque es parte del esquema.
 */
export const INSTITUTION_DIRECTORY = [
  { name: "Red de Vida Florencio Varela", type: "Clínica", address: "Av. San Martín 2500, Florencio Varela, Provincia de Buenos Aires" },
  { name: "Red de Vida Palermo", type: "Clínica", address: "Av. Santa Fe 3800, Palermo, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida Caballito", type: "Banco de Sangre", address: "Av. Rivadavia 5200, Caballito, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida Recoleta", type: "Hospital", address: "Av. Las Heras 2100, Recoleta, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida Belgrano", type: "Clínica", address: "Av. Cabildo 2000, Belgrano, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida Núñez", type: "Banco de Sangre", address: "Av. del Libertador 7500, Núñez, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida Flores", type: "Banco de Sangre", address: "Av. Rivadavia 7000, Flores, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida San Telmo", type: "Clínica", address: "Av. San Juan 800, San Telmo, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida Almagro", type: "Banco de Sangre", address: "Av. Corrientes 4200, Almagro, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida Liniers", type: "Banco de Sangre", address: "Av. Rivadavia 11000, Liniers, Cdad. Autónoma de Buenos Aires" },
  { name: "Red de Vida Mendoza", type: "Hospital", address: "Av. San Martín 1200, Mendoza" },
  { name: "Red de Vida Santiago del Estero", type: "Banco de Sangre", address: "Av. Belgrano Sur 500, Santiago del Estero" },
] as const;

export const mapEmbedUrl = (address: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
