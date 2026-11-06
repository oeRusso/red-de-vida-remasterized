// Prueba HTTP contra la app en marcha: permisos, fuga de datos y flujo completo.
// Necesita los datos de `npm run db:seed` y ADMIN_USER_IDS configurado. Ver README.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
// Contra producción, la clave del admin es SEED_ADMIN_PASSWORD (ver docs/despliegue.md).
let pass = 0, fail = 0;
const check = (name, ok, extra = "") => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} ${ok ? "" : extra}`);
};

function client() {
  let cookie = "";
  return async (path, { method = "GET", body } = {}) => {
    const res = await fetch(BASE + path, {
      method,
      redirect: "manual",
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, text, headers: res.headers, setCookie: set };
  };
}

const anon = client();
const donor = client();
const other = client();
const admin = client();

const stamp = Date.now();
const reg = (email) => ({ firstName: "José", lastName: "Núñez", birthday: "1990-02-03", gender: "Male", bloodType: "A+", email, password: "Clave+123", diseases: [] });

// Sin sesión
for (const [method, path] of [["GET", "/api/users"], ["GET", "/api/appointments"], ["GET", "/api/donations"]]) {
  const r = await anon(path, { method });
  check(`anónimo ${method} ${path} → 401`, r.status === 401, `${r.status}`);
}
const fakeId = "507f1f77bcf86cd799439011";
check("anónimo PUT confirm → 401", (await anon(`/api/appointments/${fakeId}/confirm`, { method: "PUT" })).status === 401);
check("anónimo DELETE usuario → 401", (await anon(`/api/users/${fakeId}`, { method: "DELETE" })).status === 401);
check("anónimo POST institución → 401", (await anon("/api/institutions", { method: "POST", body: {} })).status === 401);

const page = await anon("/premios");
check("/premios sin sesión redirige a login", page.status === 307 && page.headers.get("location")?.includes("/login?next=%2Fpremios"), `${page.status} ${page.headers.get("location")}`);

// Registro y login
const bad = await anon("/auth/register", { method: "POST", body: { ...reg("x@y.com"), birthday: "2015-01-01" } });
check("registro menor de edad → 400 con error de campo", bad.status === 400 && bad.json.errors?.birthday, JSON.stringify(bad.json));
const r1 = await anon("/auth/register", { method: "POST", body: reg(`donor${stamp}@mail.com`) });
check("registro → 201", r1.status === 201, r1.text);
check("registro no devuelve hash", !r1.text.includes("$2"));
const r2 = await anon("/auth/register", { method: "POST", body: reg(`other${stamp}@mail.com`) });
check("email repetido → 409", (await anon("/auth/register", { method: "POST", body: reg(`DONOR${stamp}@mail.com`) })).status === 409);

check("login mal → 401", (await donor("/auth/login", { method: "POST", body: { email: `donor${stamp}@mail.com`, password: "nope" } })).status === 401);
const login = await donor("/auth/login", { method: "POST", body: { email: `donor${stamp}@mail.com`, password: "Clave+123" } });
check("login → 200", login.status === 200, login.text);
check("cookie httpOnly y SameSite", /HttpOnly/i.test(login.setCookie) && /SameSite=lax/i.test(login.setCookie), login.setCookie);
check("el token no viaja en el cuerpo", !("token" in login.json.payload));
await other("/auth/login", { method: "POST", body: { email: `other${stamp}@mail.com`, password: "Clave+123" } });
const adminLogin = await admin("/auth/login", { method: "POST", body: { email: "admin@reddevida.test", password: process.env.SMOKE_ADMIN_PASSWORD ?? "Admin1234" } });
check("login admin", adminLogin.status === 200);

const donorId = login.json.payload.user.id;
const otherId = r2.json.payload.id;

// Aislamiento entre usuarios
check("donante no lee a otro → 403", (await donor(`/api/users/${otherId}`)).status === 403);
check("donante no borra a otro → 403", (await donor(`/api/users/${otherId}`, { method: "DELETE" })).status === 403);
check("donante no lista usuarios → 403", (await donor("/api/users")).status === 403);
check("donante no confirma → 403", (await donor(`/api/appointments/${fakeId}/confirm`, { method: "PUT" })).status === 403);
const me = await donor(`/api/users/${donorId}`);
check("lee su perfil sin hash", me.status === 200 && !me.text.includes("password"), me.text.slice(0, 200));
const list = await admin("/api/users");
check("admin lista usuarios sin hash", list.status === 200 && !list.text.includes("password"));

// Asignación masiva
const put = await donor(`/api/users/${donorId}`, { method: "PUT", body: { firstName: "José", lastName: "Núñez", email: `donor${stamp}@mail.com`, bloodType: "O-", diseases: [{ name: "Asma" }], totalPoints: 9999, password: "x" } });
check("PUT ignora totalPoints", put.status === 200 && put.json.payload.totalPoints === 0, put.text);
check("la contraseña sigue funcionando", (await client()("/auth/login", { method: "POST", body: { email: `donor${stamp}@mail.com`, password: "Clave+123" } })).status === 200);

// Instituciones públicas sin datos internos
const asma = await donor(`/api/users/${donorId}`);
check("el perfil guarda la enfermedad", asma.json.payload.user.diseases.length === 1, asma.text.slice(0, 200));
const inst = await anon("/api/institutions");
check("instituciones públicas sin citas", inst.status === 200 && inst.json.payload.length === 12 && !("appointments" in inst.json.payload[0]));
const institutionId = inst.json.payload[0]._id;
check("agenda requiere sesión", (await anon(`/api/institutions/${institutionId}/appointments`)).status === 401);
check("turno más cercano requiere sesión", (await anon("/api/appointments/nearest")).status === 401);

// Flujo de cita: elegimos un día hábil dentro de la ventana
const day = new Date(Date.now() + 3 * 86400000);
while ([0, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
const date = `${day.toISOString().slice(0, 10)}T1${stamp % 4}:00:00.000Z`;
const sick = await donor("/api/appointments", { method: "POST", body: { institutionId, appointmentDate: date } });
check("con enfermedades no agenda → 422", sick.status === 422, sick.text);
await donor(`/api/users/${donorId}`, { method: "PUT", body: { firstName: "José", lastName: "Núñez", email: `donor${stamp}@mail.com`, bloodType: "O-", diseases: [] } });
const book = await donor("/api/appointments", { method: "POST", body: { institutionId, appointmentDate: date, notes: "Nota privada", userId: otherId } });
check("agenda → 201", book.status === 201, book.text);
check("ignora userId del cuerpo", book.json.payload.userId === donorId, book.text);
const apptId = book.json.payload._id;
check("segunda pendiente → 409", (await donor("/api/appointments", { method: "POST", body: { institutionId, appointmentDate: date.replace(":00:00", ":30:00") } })).status === 409);
check("turno ocupado → 409", (await other("/api/appointments", { method: "POST", body: { institutionId, appointmentDate: date } })).status === 409);
const sched = await other(`/api/institutions/${institutionId}/appointments`);
check("agenda sin datos ajenos", sched.status === 200 && sched.json.payload.occupied.includes(date) && !sched.text.includes("Nota privada"));
const nearest = await other("/api/appointments/nearest");
check(
  "turno más cercano sin datos ajenos",
  nearest.status === 200 && nearest.json.payload.length === 3 && !nearest.text.includes("Nota privada") && !nearest.text.includes("occupied") && !nearest.text.includes("userId"),
  nearest.text,
);
check("otro no cancela mi cita → 403", (await other(`/api/appointments/${apptId}/cancel`, { method: "PUT" })).status === 403);
const conf = await admin(`/api/appointments/${apptId}/confirm`, { method: "PUT" });
check("admin confirma: 30 puntos y medalla 1", conf.status === 200 && conf.json.payload.totalPoints === 30 && conf.json.payload.newAward?.level === 1, conf.text);
check("reconfirmar → 409", (await admin(`/api/appointments/${apptId}/confirm`, { method: "PUT" })).status === 409);
const again = await donor("/api/appointments", { method: "POST", body: { institutionId, appointmentDate: date.replace(":00:00", ":30:00") } });
check("intervalo de 3 meses → 422", again.status === 422, again.text);
check("id inválido → 400", (await admin("/api/appointments/nope/confirm", { method: "PUT" })).status === 400);
check("JSON inválido → 400", (await fetch(BASE + "/auth/login", { method: "POST", body: "{" })).status === 400);
const donations = await admin("/api/donations");
check("admin lista donaciones sin hash", donations.status === 200 && !donations.text.includes("password"));

// Páginas con sesión
const premios = await donor("/premios");
check("/premios con sesión → 200", premios.status === 200, `${premios.status}`);
const blocked = await donor("/admin");
check("/admin de donante no muestra citas", !blocked.text.includes("Citas pendientes</h1>") || blocked.text.includes("/premios"), blocked.text.slice(0, 100));

// Cabeceras
const home = await anon("/");
check("cabeceras de seguridad", home.headers.get("x-content-type-options") === "nosniff" && home.headers.get("content-security-policy")?.includes("frame-ancestors"));
check("sin x-powered-by", !home.headers.get("x-powered-by"));

// Baja
const del = await donor(`/api/users/${donorId}`, { method: "DELETE" });
check("baja propia → 200", del.status === 200, del.text);
check("borra sus donaciones", !(await admin("/api/donations")).text.includes(donorId));
check("login tras baja → 401", (await client()("/auth/login", { method: "POST", body: { email: `donor${stamp}@mail.com`, password: "Clave+123" } })).status === 401);

console.log(`\n${pass} ok, ${fail} fallidas`);
process.exit(fail ? 1 : 0);
