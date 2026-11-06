# Hoja de ruta

Ideas evaluadas que todavía no se hicieron, según lo que exigen. El proyecto hoy es una demo de portfolio: "Antes de publicar" no bloquea la demo, pero sí un uso con personas reales.

## Sin cambiar el esquema

| Idea | Valor | Punto de partida |
| --- | --- | --- |
| Cuenta regresiva hasta la próxima donación | Da un motivo para volver | `nextEligibleDate` en `domain/rules.ts` |
| A quién ayuda tu sangre | Convierte el tipo de sangre en algo concreto | Tabla de compatibilidad nueva en `domain/rules.ts` |
| Línea de tiempo del donante | Hace visible la historia personal | `getDonorHistory` en `server/dal.ts` |
| Métricas de administración | Donaciones por semana, ocupación por sede, tipos de sangre | Colecciones `donations` y `appointments`. Las inasistencias no se pueden medir: una cita vencida y una cancelada son el mismo estado |
| Búsqueda, filtros y CSV en `/admin` | Hoy solo hay una lista completa, sin paginar | `listAppointments` |
| Gestión de instituciones en la interfaz | Hoy solo se puede por API | Rutas de `/api/institutions` |
| Constancia imprimible | Comprobante de la donación | `Donation` y estilos de impresión |
| Imagen para compartir un logro | Difusión. No debe mostrar tipo de sangre ni datos de salud | Guía de `next/og` |
| Modo oscuro | Preferencia del usuario | Los tokens de `@theme` ya centralizan el color, pero hay muchos `text-white` y `bg-white/10` |
| Botón "Probar la demo" en el acceso | Quien evalúa el portfolio entra sin registrarse | `db:seed` ya crea `demo@reddevida.test` |

## Con aprobación de esquema

| Idea | Qué agregaría | Depende de |
| --- | --- | --- |
| Recuperar contraseña y verificar email | Colección de tokens de un solo uso | Proveedor de email |
| Recordatorios de cita | Registro de envíos, para no repetirlos | Proveedor de email y tarea programada: hoy no hay ninguna |
| Campañas de necesidad | Colección nueva: institución, tipo de sangre y fecha límite. Resuelve los banners descartados en `diseno.md`, porque el dato lo declara la institución | Pantalla de administración |
| Personal por institución | Rol que confirma solo las citas de su sede. Resuelve una duda abierta de `reglas-de-negocio.md` | Cambio en las guardas de sesión |

## Antes de publicar

- **Límite de intentos de login.** Ya figura como pendiente en `migracion.md`.
- **Consistencia de `confirmAppointment`.** Son varias escrituras sin transacción: si el proceso cae a mitad de camino, la cita queda `Completed` sin donación o sin puntos.
- **Consentimiento y datos de salud.** Revisar qué exige la ley aplicable; en Argentina, la Ley 25.326.
- **Índices restantes.** `donations.userId`, `appointments.userId` sin filtro parcial y la agenda por institución siguen recorriendo la colección.
- **Arreglos sin límite.** `institutions.appointments` y `institutions.donations` crecen con cada cita y ya no se leen en la app, pero siguen ocupando el documento, limitado a 16 MB. Quitarlos exige dejar de escribirlos, y eso rompe la compatibilidad con el esquema original.
