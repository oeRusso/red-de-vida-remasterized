# Reglas de negocio — Red de Vida

Red de Vida es una red de sedes de donación de sangre: el donante se registra, agenda una cita en una sede, dona y gana puntos y medallas. La organización y sus sedes son ficticias: es un proyecto demostrativo, no reserva turnos en centros reales y no enlaza a sitios de terceros. En el código y la base, cada sede sigue siendo una `Institution`.

Cada regla indica dónde vivía en el sistema original y dónde vive ahora. El código de referencia es `src/domain/rules.ts` (reglas puras) y `src/server/services/` (las que necesitan la base de datos). El servidor es siempre quien decide: lo que hace el cliente es solo feedback anticipado.

## Actores

| Actor | Puede |
| --- | --- |
| Visitante | Ver la landing, registrarse, iniciar sesión. |
| Donante | Gestionar su perfil, agendar y cancelar sus citas, ver su historial y medallas, eliminar su cuenta. |
| Administrador | Todo lo anterior sobre cualquier usuario, confirmar citas y gestionar instituciones. |

El esquema de `User` no tiene roles y la base de datos no se modifica, así que los administradores se listan por `_id` en `ADMIN_USER_IDS`. Se usa el `_id` y no el email porque los emails no se verifican: cualquiera podría registrar un email de la lista.

## Registro y perfil

- Son obligatorios nombre, apellido, fecha de nacimiento, género, tipo de sangre, email y contraseña. El formulario original decía que género y tipo de sangre eran opcionales, pero la API y el esquema siempre los exigieron.
- Edad entre 18 y 75 años. El original solo comprobaba el mínimo y solo en el navegador; el máximo aparecía únicamente como texto en la landing.
- Contraseña: mínimo 8 caracteres con mayúscula, minúscula y número. Se aceptan símbolos.
- Nombre y apellido empiezan con mayúscula y no llevan números. Se aceptan acentos, ñ y partículas (`De la Cruz`).
- El email es único sin distinguir mayúsculas. Los nuevos se guardan en minúsculas.
- Enfermedades del catálogo: Diabetes, Hipertensión, Asma, Artritis y Cáncer. **Tener alguna registrada impide agendar.** El dato lo declara la propia persona y puede editarlo desde su perfil.
- Género y fecha de nacimiento no se editan después del registro, porque determinan el intervalo entre donaciones y la edad.

## Agendar una cita

Una cita se acepta solo si se cumple todo lo siguiente, en este orden:

1. El usuario existe.
2. No tiene otra cita `Pending` (máximo una).
3. Tiene entre 18 y 75 años.
4. No tiene enfermedades registradas.
5. Pasó el intervalo desde su última donación: **3 meses para hombres, 4 para mujeres**.
6. La fecha cae dentro de la ventana de reserva: desde hoy (o la próxima fecha habilitada, si es posterior) y hasta 90 días después.
7. La institución existe.
8. El turno existe en su horario, no está ocupado, no pasó y no se superó la capacidad diaria.

### Horarios y turnos

- Turnos de 30 minutos. El último debe terminar antes del cierre: de 08:00 a 09:45 salen 08:00, 08:30 y 09:00.
- Horario según el día: lunes a viernes, sábado o domingo. Si un día no tiene horario, la institución está cerrada ese día.
- Una cita ocupa turno mientras no esté `Cancelled`.
- `dailyDonorCapacity` limita las citas por día, aunque queden turnos libres.

### Intervalo entre donaciones

Se calcula desde la donación más reciente de la colección `donations`, no desde la última cita. Sumar meses no desborda: 30/11 + 3 meses es 28/02.

### Turno más cercano

El paso de reserva puede buscar el primer turno libre sin elegir institución. No agrega reglas: usa la misma ventana de reserva y el mismo cálculo de turnos, y muestra hasta `NEAREST_SLOTS_LIMIT` (3) opciones, una por institución, de la más cercana a la más lejana. Si hay empate de fecha y hora, gana el orden alfabético.

Elegir una opción solo completa el formulario. La cita se valida entera al confirmarla, porque el turno pudo ocuparse entretanto.

## Estados de una cita

```text
             cancelar (donante o admin)
Pending ──────────────────────────────────► Cancelled
   │
   │ confirmar (solo admin)
   ▼
Completed ──► crea Donation, suma puntos, otorga medallas
```

Una cita `Pending` caduca sola cuando termina el día siguiente al de la cita: pasa a `Cancelled`, libera el turno y deja de bloquear nuevas reservas. Ese día de gracia (`PENDING_GRACE_DAYS`) permite confirmar una donación ya hecha. El esquema no tiene un estado propio para esto, así que en pantalla figura como cancelada. No hay proceso programado: la caducidad se aplica cada vez que se leen o se deciden citas.

Los estados `Completed` y `Cancelled` son finales. Las transiciones son atómicas: dos confirmaciones simultáneas no pueden sumar puntos dos veces.

## Confirmar una cita

Confirmar significa que el donante asistió y donó. En ese momento:

1. La cita pasa a `Completed`.
2. Se crea una `Donation` con el tipo de sangre del usuario, la fecha de la cita y sus notas (o `Donación completada exitosamente`).
3. La donación se enlaza al usuario y a la institución.
4. El usuario suma **30 puntos**.
5. Recibe todas las medallas cuyo umbral alcanzó.

## Puntos, niveles y medallas

- Cada donación vale 30 puntos.
- Nivel = `puntos / 90`, redondeado hacia abajo. Se empieza en nivel 0: con 3 donaciones se llega al nivel 1.

| Medalla | Puntos | Donaciones |
| --- | --- | --- |
| 1 | 30 | 1 |
| 2 | 120 | 4 |
| 3 | 210 | 7 |
| 4 | 300 | 10 |
| 5 | 390 | 13 |
| 6 | 480 | 16 |

La colección `awards` puede estar vacía: no había endpoint ni seed para poblarla. Por eso la pantalla calcula las medallas desde los puntos, igual que el original, mientras que `users.awards` solo se llena si existen esos documentos (`npm run db:seed`).

El aviso de medalla nueva no vive en la base: quien confirma es un administrador, y el esquema no guarda qué medallas vio el donante. Se comparan los puntos con los de la visita anterior, guardados en `localStorage`, así que el aviso es por dispositivo: la primera visita en cada uno solo anota el valor.

## Baja de cuenta

Eliminar la cuenta borra de forma permanente al usuario, sus citas y sus donaciones, y retira las referencias en las instituciones. El original solo borraba el documento del usuario, aunque la pantalla prometía borrarlo todo.

## Instituciones

- Tipos: Hospital, Clínica o Banco de Sangre.
- Una institución con citas o donaciones no se puede eliminar (409): dejaría historial apuntando a nada.
- Las sedes de ejemplo están en `src/domain/institution-directory.ts`. El único servicio externo es el mapa integrado de Google Maps, que recibe la dirección de la sede.

## Fechas: "hora de pared en UTC"

**Es la regla más fácil de romper.** El sistema original guarda la hora elegida directamente en los campos UTC: las 09:00 de Buenos Aires se guardan como `09:00:00.000Z`, no como `12:00:00.000Z`. Hay datos reales en ese formato, así que se conserva.

- Leer y escribir `appointmentDate` y `donationDate` siempre con métodos UTC (`toDateKey`, `toTimeKey`, `slotToDate`).
- Mostrarlas con `src/lib/format.ts`, que formatea en UTC.
- "Hoy" y "ahora" se calculan en `America/Argentina/Buenos_Aires` (`todayKey`, `nowAsWallClock`).

## Información para el donante

`src/lib/donation-guide.ts` reúne lo que la app le cuenta al donante sobre la visita, los estudios y los cuidados. Es informativo: no cambia ninguna regla de reserva. "¿Puedo donar?" también es orientativo y no bloquea nada.

Fuentes, revisadas en noviembre de 2026:

- [Cómo donar sangre](https://www.argentina.gob.ar/salud/donarsangre/como) y [Quiénes pueden donar](https://www.argentina.gob.ar/salud/donarsangre/quienes), del Ministerio de Salud: preparación, pasos, estudios obligatorios, cuidados y exclusiones.
- [Centro Regional de Hemodonación de Murcia](https://www.murciasalud.es/web/centro-regional-de-hemodonacion/que-es-la-sangre) y [HHS](https://www.hhs.gov/givingequalsliving/sites/default/files/2022-09/HHS-OIDP-Tipos_de_donacio%CC%81n_sangre.pdf): conservación de componentes. No hay fuente argentina; el plazo exacto depende de cada centro.
- La duración total de "hasta 1 hora" viene del [Manual MSD](https://www.msdmanuals.com/es/hogar/trastornos-de-la-sangre/transfusión-de-sangre/proceso-de-donación-de-sangre): la guía del Ministerio solo da la duración de la extracción.

## Dudas abiertas

Reglas que el sistema original no define. Hoy se comportan como se indica, pero son decisiones del negocio.

| Tema | Comportamiento actual | Por qué importa |
| --- | --- | --- |
| Requisitos médicos sin dato | Peso (50 kg) y epilepsia, tuberculosis o cardiopatías son solo texto en la landing: no están en el catálogo de enfermedades. | Quien las padezca no puede declararlas, así que no se le bloquea la cita. |
| Edad para donar | La app exige de 18 a 75 años. El Ministerio de Salud admite desde los 16 con autorización y, desde los 65, pide certificado médico. | La regla viene del sistema original. Cambiarla necesita decisión del negocio. |
| Tatuajes y embarazo | Solo se preguntan en "¿Puedo donar?". | No hay dato en el esquema, así que no bloquean la reserva: el centro lo evalúa en la entrevista. |
| Confirmar antes de la fecha | Se permite, como en el original. | Un administrador podría registrar una donación futura por error. |
| Personal de las instituciones | Un solo rol de administrador global. | Si cada institución debe confirmar sus citas, hará falta un rol nuevo, y eso sí exige cambiar el esquema. |
