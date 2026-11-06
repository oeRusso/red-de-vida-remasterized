# Red de Vida

Plataforma web de una red de sedes de donación de sangre: agenda de citas, historial de donaciones y gamificación con puntos y medallas. Red de Vida y sus sedes son ficticias: es un proyecto demostrativo.

Hecha con Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, MongoDB y Mongoose.

- [Reglas de negocio](docs/reglas-de-negocio.md)
- [Migración desde el sistema original](docs/migracion.md)
- [Decisiones de diseño](docs/diseno.md)
- [Despliegue](docs/despliegue.md): <https://reddevida.esteban-russo.com>

## Puesta en marcha

Probado con Node.js 24.

```bash
npm install
cp .env.example .env.local   # completa JWT_SECRET: openssl rand -base64 32
```

Con una base MongoDB propia, pon su URI en `MONGO_URI_DEV`. Si no tienes Mongo instalado, deja el valor del ejemplo y levanta una base efímera en otra terminal (los datos se pierden al cerrarla):

```bash
npm run db:memory
```

Después:

```bash
npm run db:seed   # premios, instituciones y cuentas demo; imprime el ADMIN_USER_IDS
npm run dev
```

Pega en `.env.local` la línea `ADMIN_USER_IDS` que imprimió el seed y reinicia el servidor. La app queda en <http://localhost:3000>.

| Cuenta demo | Email | Contraseña |
| --- | --- | --- |
| Donante | `demo@reddevida.test` | `Demo1234` |
| Administrador | `admin@reddevida.test` | `Admin1234` |

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. Usa `MONGO_URI_DEV`. |
| `npm run build` / `npm start` | Build y servidor de producción. Usa `MONGO_URI_PROD`. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Comprobación de tipos. |
| `npm test` | Tests de dominio y servicios con un MongoDB real en memoria. |
| `npm run test:smoke` | Permisos y flujo completo por HTTP, contra la app en marcha con los datos del seed. |
| `npm run db:seed` | Inserta lo que falte. Con `-- --prod`, solo premios en producción; con `-- --prod --demo`, también sedes y cuentas demo, con la clave del admin tomada de `SEED_ADMIN_PASSWORD`. |
| `npm run db:indexes` | Crea los índices. Con `-- --prod`, en producción. |
| `npm run db:memory` | MongoDB efímero en el puerto 27017. |
