# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Red de Vida: plataforma de donación de sangre con citas, historial y gamificación. La interfaz, los mensajes y la documentación están en español.

- `red-de-vida/`: la aplicación activa (Next.js 16 con MongoDB). Todo el trabajo nuevo va aquí.
- `c23-91-webapp-main/`: sistema original (HTML + Express). Es solo referencia: no modificar.

Antes de cambiar reglas, leer `red-de-vida/docs/reglas-de-negocio.md`. Las decisiones de migración, los cambios de contrato y lo pendiente están en `red-de-vida/docs/migracion.md`, y las de diseño en `red-de-vida/docs/diseno.md`.

## Comandos

Ejecutar dentro de `red-de-vida/`.

```bash
npm run dev                       # usa MONGO_URI_DEV
npm run build
npm run lint
npm run typecheck
npm test                          # dominio y servicios
npm run test:smoke                # permisos por HTTP, con la app corriendo
npx vitest run tests/rules.test.ts              # un archivo
npx vitest run -t "respeta la capacidad diaria" # un test por nombre
npm run db:memory                 # MongoDB efímero en :27017 (esta máquina no tiene mongod)
npm run db:seed                   # idempotente; imprime ADMIN_USER_IDS
npm run db:indexes                # `-- --prod` para producción
```

`npm test` levanta su propio MongoDB en memoria; no necesita `.env.local`.

## Next.js 16

Esta versión difiere de lo habitual. Antes de usar una API de Next, leer su guía en `red-de-vida/node_modules/next/dist/docs/`. Lo que más afecta aquí:

- `cacheComponents` está activo. Leer cookies o datos de sesión exige un `<Suspense>`: cada página protegida es un shell síncrono que envuelve un `Content` asíncrono. `new Date()` en render rompe el build; las validaciones que dependen de la fecha van en eventos, no en render.
- `src/proxy.ts` reemplaza a `middleware`. Solo redirige por comodidad; nunca es la barrera de autorización.
- `error.tsx` recibe `retry`, no `reset`.

## Arquitectura

```text
src/domain/    Reglas puras y esquemas Zod. Sin Next ni Mongo; las usan cliente y servidor.
src/server/    Solo servidor.
  models/      Mongoose. Importar siempre desde models/index.ts.
  services/    Lógica de negocio con BD. Lanzan DomainError(status, mensaje).
  dal.ts       Lectura para Server Components: valida sesión y devuelve vistas planas.
  session.ts   Cookie de sesión y guardas requireSession/requireAdmin/requireSelfOrAdmin.
  http.ts      handler(), que convierte todo error en el sobre JSON.
src/app/       Páginas y Route Handlers, delgados: validan, autorizan y delegan.
src/components/
```

Flujo de datos:

- **Lecturas:** Server Component → `dal.ts` → modelos o servicios.
- **Escrituras:** Client Component → `lib/api.ts` → Route Handler → servicio → `router.refresh()`. No se usan Server Actions: la API REST mantiene las rutas del sistema original.
- **Disponibilidad de turnos:** el cliente pide la agenda (`/api/institutions/:id/appointments`) y calcula con las mismas funciones de `domain/rules.ts` que usa el servidor, que vuelve a validar al crear la cita.

## Invariantes

- **El esquema es el de la base del sistema original y debe seguir compatible.** No renombrar colecciones, campos ni enums (los valores siguen en inglés: `Pending`, `Male`), ni agregar campos obligatorios. Un cambio de esquema necesita aprobación explícita.
- **Las fechas de cita son "hora de pared en UTC":** las 09:00 locales se guardan como `09:00Z`. Usar siempre `toDateKey`, `toTimeKey`, `slotToDate` y `lib/format.ts`; nunca `getHours()` ni `toLocaleString` sin `timeZone: "UTC"`. "Hoy" sale de `todayKey()`.
- **Cada Route Handler verifica permisos**, con el usuario tomado de la sesión y nunca del cuerpo.
- **El hash nunca sale:** `password` es `select: false`, y solo el login lo pide. Las actualizaciones pasan por un esquema Zod con lista cerrada; `findByIdAndUpdate` no ejecuta el hook de hash.
- **Las transiciones de cita son atómicas:** `findOneAndUpdate` con `status: "Pending"` en el filtro, sin leer y luego escribir. Los puntos usan `$inc`.
- **Los administradores van por `_id` en `ADMIN_USER_IDS`,** no por email: los emails no se verifican.
- **Datos legacy incompletos:** `saturday` y `sunday` pueden faltar, y `institutionId` poblado puede ser `null`.
- **En producción los índices no se crean solos** (`autoIndex: false`): se aplican con `npm run db:indexes -- --prod`.
- **`public/logo.svg` es blanco:** necesita fondo de marca u oscuro.

## Pruebas

`npm test` cubre dominio y servicios. Los permisos de la API se prueban con `npm run test:smoke`, que necesita la app corriendo con `db:memory`, `db:seed` y `ADMIN_USER_IDS` configurado (`BASE_URL` cambia el destino; por defecto, `http://localhost:3000`). Las pantallas no tienen tests automáticos: al tocarlas, recorrerlas en el navegador contra un build real. `next build` detecta errores de prerender que `tsc` y `vitest` no ven.
