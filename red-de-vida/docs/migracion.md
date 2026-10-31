# Migración desde el sistema original

El sistema original (`../c23-91-webapp-main`) era un frontend de HTML y Bootstrap en Netlify más una API Express en Render. Ahora todo es una sola aplicación Next.js. El original queda intacto como referencia.

## Compatibilidad con la base de datos

No hace falta migrar datos. Se conservan las colecciones (`users`, `appointments`, `donations`, `institutions`, `awards`), los campos, los enums, el formato de fechas y el hash de contraseñas: los usuarios actuales entran con su contraseña de siempre.

Lo único nuevo son dos índices únicos parciales en `appointments`, que no se crean solos en producción. Evitan que dos reservas simultáneas tomen el mismo turno y que un usuario tenga dos citas pendientes.

## Pasos para pasar a producción

1. Configurar las variables de `.env.example`. `MONGO_URI_PROD` y `JWT_SECRET` pueden ser las mismas de Render.
2. Crear los índices: `npm run db:indexes -- --prod`. Si falla, hay duplicados previos (por ejemplo, un usuario con dos citas `Pending`) que hay que resolver a mano; el comando indica cuáles colecciones fallaron y no borra nada.
3. Crear los premios que falten: `npm run db:seed -- --prod`. Solo inserta; nunca modifica documentos existentes.
4. Poner en `ADMIN_USER_IDS` el `_id` de quienes confirmarán citas.
5. Desplegar sobre HTTPS: la cookie de sesión es `Secure` en producción.

El dominio cambia al dejar Netlify y Render, y las sesiones abiertas no se migran: cada usuario inicia sesión una vez más.

## API

Mismas rutas y mismo sobre JSON (`{ status, message, payload }`). Lo que cambia son los permisos: en el original **ninguna ruta exigía autenticación**, porque el middleware estaba comentado.

| Ruta | Antes | Ahora |
| --- | --- | --- |
| `POST /auth/register`, `POST /auth/login` | Público | Público |
| `POST /auth/logout` | No existía | Nuevo |
| `GET /api/institutions` | Público, con citas de todos | Público, sin citas ni donaciones |
| `GET /api/institutions/:id/appointments` | Público, con notas y usuarios | Con sesión. Devuelve horario, capacidad y `occupied` (solo fechas) |
| `POST, PUT, DELETE /api/institutions[/:id]` | Público | Administrador |
| `GET, PUT, DELETE /api/users/:id`, `GET /api/users/:id/details` | Público | El propio usuario o un administrador |
| `GET, POST /api/users` | Público | Administrador |
| `GET /api/appointments`, `GET /api/donations` | Público | Administrador |
| `POST /api/appointments` | Público | Con sesión. Se ignora `userId` del cuerpo |
| `PUT /api/appointments/:id/cancel` | Público | Dueño de la cita o administrador |
| `PUT /api/appointments/:id/confirm` | Público | Administrador |

Otros cambios de contrato:

- El login responde con una cookie `httpOnly` en lugar de un token en el cuerpo. Cualquier cliente externo (Postman incluido) debe conservar esa cookie.
- `PUT /api/users/:id` acepta solo `firstName`, `lastName`, `email`, `bloodType` y `diseases`.
- Los conflictos de negocio responden 409 y las reglas incumplidas 422; antes muchos eran 400.
- La sesión dura 8 horas. El token original duraba 1, aunque nadie lo verificaba.

## Errores corregidos

### Seguridad

| Problema en el original | Consecuencia |
| --- | --- |
| API sin autenticación | Cualquiera podía leer, editar o borrar cualquier cuenta. |
| `GET /api/users` y `GET /api/donations` devolvían documentos completos | Exponían los hashes de contraseña. |
| `PUT /api/users/:id` aceptaba el cuerpo completo | Permitía fijar `totalPoints` a voluntad. Una `password` se guardaba **en texto plano** y además dejaba a la persona sin poder entrar. |
| `PUT /appointments/:id/confirm` era público | Cualquiera podía regalarse puntos, sin que importara si había donado. |
| `userId` venía del cliente | Se podía reservar a nombre de otra persona. |
| Token en `localStorage` | Lo podía leer cualquier script de la página. |
| Instituciones públicas con citas pobladas | Exponían notas y datos de los donantes. |

### Reglas que no se cumplían

| Problema en el original | Ahora |
| --- | --- |
| Intervalo y cita pendiente solo se validaban en el navegador. | Los valida el servidor. |
| Cancelar una cita posterior eliminaba la espera entre donaciones, porque solo se miraba la última cita. | Se calcula desde la última donación real. |
| El aviso decía siempre "3 meses", también a las mujeres (que esperan 4). | Muestra el intervalo que corresponde. |
| Un turno cancelado quedaba ocupado para siempre. | Se libera. |
| Se podía reservar en el pasado, fuera de horario o en una institución inexistente. | Se rechaza. |
| `dailyDonorCapacity` no se usaba. | Limita las citas diarias. |
| Dos reservas o confirmaciones simultáneas podían duplicar turnos o puntos. | Índices únicos y transiciones atómicas. |
| La baja dejaba citas y donaciones huérfanas, y mostraba éxito aunque fallara. | Borrado completo; los errores se muestran. |
| No había forma de confirmar citas desde la interfaz. | Panel en `/admin`. |

### Interfaz

| Problema en el original | Ahora |
| --- | --- |
| Nombres y placeholders inválidos: `José María` y `Contr43s3nh4+` no pasaban su propio formulario. | Se aceptan acentos, ñ y símbolos. |
| Fecha de nacimiento un día antes en Argentina y mes desplazado en el perfil. | Se formatea en UTC. |
| Una institución sin horario de sábado rompía la carga de la agenda. | Ese día figura cerrado. |
| Una institución fuera de la lista fija de hospitales dejaba de pintar la página. | Se muestra sin enlace, y el mapa sale de la dirección. |
| El calendario no se actualizaba al elegir institución y usaba rojo para dos significados. | Se repinta y usa estados distintos también sin color. |
| Se podía enviar la cita sin elegir hora. | El botón queda deshabilitado. |
| Racha "2 🔥" fija en el HTML, estado "Pending" en inglés, enlace muerto "Configuración". | Datos reales, en español, enlace retirado. |

## Comportamiento que cambia para datos existentes

Conviene revisarlo antes de publicar:

- **Domingos:** el original los pintaba en rojo aunque dejaba reservarlos. Ahora se respeta el horario guardado: si una institución tiene horario de domingo, ese día se ofrece.
- **Capacidad:** una institución con `dailyDonorCapacity` menor que su cantidad de turnos ofrecerá menos reservas que antes, y con 0 no ofrecerá ninguna.
- **Mayores de 75:** ya registrados, conservan su cuenta pero no pueden agendar.
- **Citas vencidas:** las citas `Pending` con más de un día de vencidas pasan solas a `Cancelled`.
- **Enfermedades:** quien tenga alguna registrada no puede agendar hasta quitarla de su perfil.
- **Medalla 6:** ahora exige 480 puntos en lugar de 420. La colección `awards` no se actualiza sola: en una base existente hay que cambiar ese documento a mano, y `users.awards` conserva las ya otorgadas.

## Retirado de la interfaz

- Teléfono y email del pie (`nombreApp@mail.com`, `+(12) 34-56-78-910`): eran datos de relleno. Hay que agregar los reales.
- Banner "Cómo funciona": prometía avatares que no existen. Se reemplazó por pasos en HTML.
- Dependencias sin uso: `passport`, `body-parser`, `bcrypt`, `helmet`, `winston`, `cors`, `bootstrap`, `sass`, flatpickr y FullCalendar.

## Pendiente

- **Sin límite de intentos en el login.** Conviene agregarlo antes de publicar, en el proveedor de hosting o con un almacén compartido; un contador en memoria no sirve con varias instancias.
- **Sin verificación de email ni recuperación de contraseña.** Tampoco existían en el original.
- **Instituciones desde la interfaz:** se administran por API. `/admin` solo gestiona citas.
- **Consentimiento y datos de salud:** la app guarda enfermedades de las personas. Revisa qué exige la ley aplicable (en Argentina, la Ley 25.326) antes de publicar.
