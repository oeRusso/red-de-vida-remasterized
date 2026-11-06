# Despliegue

Red de Vida corre en el VPS compartido de Contabo, junto al portfolio, en
<https://reddevida.esteban-russo.com>. Las reglas generales del servidor (costo cero, sin
puertos abiertos, secretos y `sudo` a cargo de Esteban) están en
`PORTAFOLIO2.0/docs/VPS-COMPARTIDO.md`; esta guía cubre solo lo propio del proyecto.

## Qué corre

`compose.yaml`, en la raíz del repositorio, levanta tres contenedores en `~/reddevida`:

| Servicio | Qué es | Notas |
| --- | --- | --- |
| `mongo` | MongoDB 8 | Volumen `mongo-data`, caché de WiredTiger de 0,25 GB, `mem_limit` 768 MB. Sin puerto publicado. |
| `web` | Next.js standalone en `:3000` | `mem_limit` 512 MB. El healthcheck pide `/api/institutions`, que también prueba la base. |
| `tunnel` | `cloudflared` | Túnel `reddevida`; su ruta apunta a `http://web:3000`. |

Hay un cuarto servicio, `tools`, que solo se usa a mano (`docker compose run --rm tools …`)
para crear índices y correr el seed. Tiene el código fuente y todas las dependencias.

HTTPS lo termina Cloudflare. La cookie de sesión es `Secure` y funciona porque el visitante
entra por HTTPS.

## Variables

Viven en `~/reddevida/.env` (permisos 600). La plantilla es `.env.production.example`.

| Variable | Quién la carga |
| --- | --- |
| `MONGO_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD` | Se generan en el VPS con `openssl rand -hex 32`, sin mostrarlas. |
| `ADMIN_USER_IDS` | La imprime el seed. |
| `TUNNEL_TOKEN` | Esteban, sin que se vea en pantalla. |

`MONGO_PASSWORD` solo vale la primera vez que arranca `mongo`, con el volumen vacío.
Cambiarla después exige cambiarla también dentro de la base.

## Primera instalación

```bash
git clone -b main https://github.com/oeRusso/red-de-vida-remasterized.git ~/reddevida
cd ~/reddevida
# .env desde la plantilla, con las contraseñas generadas y TUNNEL_TOKEN cargado
docker compose up -d mongo
docker compose run --rm tools npm run db:indexes -- --prod
docker compose run --rm tools npm run db:seed -- --prod --demo   # imprime ADMIN_USER_IDS
# pegar ADMIN_USER_IDS en .env
docker compose up -d --build
docker compose ps   # todo healthy
```

El seed de producción con `--demo` crea las sedes ficticias y las cuentas de demostración. La
cuenta donante usa la contraseña pública del README. La cuenta `admin@reddevida.test` usa
`SEED_ADMIN_PASSWORD`: la del README es pública y daría acceso al panel a cualquiera. Para
verla: `grep SEED_ADMIN_PASSWORD ~/reddevida/.env`.

Los smoke tests pueden correr contra producción desde la PC. Ojo: crean y borran usuarios de
prueba y confirman una cita.

```bash
BASE_URL=https://reddevida.esteban-russo.com SMOKE_ADMIN_PASSWORD=<la del .env> npm run test:smoke
```

## Actualizar

```bash
cd ~/reddevida
git pull --ff-only
docker compose up -d --build && docker image prune -f
```

Si el cambio agrega índices: `docker compose run --rm tools npm run db:indexes -- --prod`.

## Si algo falla

| Síntoma | Qué mirar |
| --- | --- |
| Error 1033 de Cloudflare | `docker compose logs tunnel`: el túnel no conecta. |
| Error 502 | `docker compose logs web`: la app no responde en `web:3000`. |
| `web` queda `unhealthy` | Casi siempre es la base: `docker compose logs mongo`, y revisar `MONGO_PASSWORD`. |
