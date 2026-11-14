import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import request from "supertest";
import bcrypt from "bcryptjs";
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith("_test"))
  throw new Error(
    "TEST_DATABASE_URL debe apuntar a una base desechable cuyo nombre termine en _test.",
  );
process.env.DATABASE_URL = testUrl;
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET ||=
  "integration-test-secret-with-more-than-32-characters";
const { app, sessionStore } = await import("../src/app.js");
const { sequelize, Event, User, Favorite } = await import(
  "../src/models/index.js"
);
const { migrator } = await import("../scripts/migrate.js");
const { demoEvents, traditions } = await import("../seeders/events.js");
const { calendarFile } = await import("../src/services/calendar.js");
let admin, adminCsrf, member, memberCsrf;
const password = "A-strong-test-password-2026";
async function csrf(agent) {
  return (await agent.get("/api/auth/session").expect(200)).body.csrfToken;
}
async function signIn(agent, email) {
  const token = await csrf(agent);
  return agent
    .post("/api/auth/login")
    .set("x-csrf-token", token)
    .send({ email, password })
    .expect(200);
}
before(async () => {
  await migrator.up();
  await sequelize.query(
    'TRUNCATE "Favorites", "Events", "Users", "Sessions" CASCADE',
  );
  await Event.bulkCreate([...demoEvents, ...traditions]);
  await User.create({
    name: "Administración de prueba",
    email: "admin@example.test",
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
  });
  admin = request.agent(app);
  adminCsrf = (await signIn(admin, "admin@example.test")).body.csrfToken;
  member = request.agent(app);
  const token = await csrf(member);
  const result = await member
    .post("/api/auth/register")
    .set("x-csrf-token", token)
    .send({
      name: "Exploradora",
      email: "member@example.test",
      password,
      role: "admin",
    })
    .expect(201);
  memberCsrf = result.body.csrfToken;
});
after(async () => {
  sessionStore.stopExpiringSessions();
  await sequelize.close();
});
test("registro: hash seguro, cookie HttpOnly, sin elevación de privilegios", async () => {
  const user = await User.unscoped().findOne({
    where: { email: "member@example.test" },
  });
  assert.equal(user.role, "user");
  assert.notEqual(user.passwordHash, password);
  assert.ok(await bcrypt.compare(password, user.passwordHash));
  const agent = request.agent(app),
    response = await agent.get("/api/auth/session").expect(200);
  assert.match(response.headers["set-cookie"][0], /HttpOnly/);
  assert.match(response.headers["set-cookie"][0], /SameSite=Lax/);
  const info = await member.get("/api/auth/session").expect(200);
  assert.equal(info.body.user.passwordHash, undefined);
});
test("filtros de texto, país, categoría y rango se combinan con AND", async () => {
  const result = await request(app)
    .get("/api/events")
    .query({
      q: "sabores",
      country: "Guatemala",
      category: "Gastronomía",
      from: "2026-11-22",
      to: "2026-11-22",
    })
    .expect(200);
  assert.equal(result.body.total, 1);
  assert.equal(result.body.events[0].title, "Sabores que cuentan historias");
  assert.equal(
    (
      await request(app)
        .get("/api/events")
        .query({ q: "sabores", country: "Japón" })
    ).body.total,
    0,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/events")
        .query({ from: "2026-11-23", to: "2026-11-23" })
    ).body.total,
    0,
  );
});
test("paginación estable y validación de fechas y consultas", async () => {
  const a = (await request(app).get("/api/events?limit=2&page=1").expect(200))
    .body;
  const b = (await request(app).get("/api/events?limit=2&page=2").expect(200))
    .body;
  assert.equal(a.events.length, 2);
  assert.equal(a.total, 13);
  assert.equal(a.pages, 7);
  assert.ok(!a.events.some((e) => b.events.some((x) => x.id === e.id)));
  await request(app).get("/api/events?from=2027-02-30").expect(400);
  await request(app)
    .get("/api/events?from=2027-03-02&to=2027-03-01")
    .expect(400);
  await request(app).get("/api/events?page=-1").expect(400);
  await request(app).get("/api/events?category=no-existe").expect(400);
  await request(app).get("/api/events/no-es-uuid").expect(400);
});
test("las mutaciones requieren CSRF, origen permitido y rol en el backend", async () => {
  await member.put(`/api/favorites/${demoEvents[0].id}`).expect(403);
  await member
    .put(`/api/favorites/${demoEvents[0].id}`)
    .set("x-csrf-token", memberCsrf)
    .set("Origin", "https://otro-sitio.test")
    .expect(403);
  await request(app).get("/api/admin/events").expect(401);
  await member.get("/api/admin/events").expect(403);
  await member
    .post("/api/admin/events")
    .set("x-csrf-token", memberCsrf)
    .send(demoEvents[0])
    .expect(403);
  await member
    .post("/api/admin/withdraw-demo")
    .set("x-csrf-token", memberCsrf)
    .expect(403);
});
test("favoritos persisten en PostgreSQL después de cerrar y abrir sesión", async () => {
  const id = demoEvents[0].id;
  await member
    .put(`/api/favorites/${id}`)
    .set("x-csrf-token", memberCsrf)
    .expect(201);
  await member
    .put(`/api/favorites/${id}`)
    .set("x-csrf-token", memberCsrf)
    .expect(201);
  assert.equal(await Favorite.count(), 1);
  await member
    .post("/api/auth/logout")
    .set("x-csrf-token", memberCsrf)
    .expect(200);
  await member.get("/api/favorites").expect(401);
  member = request.agent(app);
  memberCsrf = (await signIn(member, "member@example.test")).body.csrfToken;
  assert.equal(
    (await member.get("/api/favorites").expect(200)).body.events[0].id,
    id,
  );
  await member
    .delete(`/api/favorites/${id}`)
    .set("x-csrf-token", memberCsrf)
    .expect(200);
  assert.equal(
    (await member.get("/api/favorites").expect(200)).body.events.length,
    0,
  );
});
test("una propuesta es privada hasta su aprobación y desaparece al retirarla", async () => {
  const body = {
    ...demoEvents[0],
    title: "Propuesta privada de integración",
    isDemo: false,
    status: "published",
    dateConfirmed: true,
  };
  const result = await member
    .post("/api/proposals")
    .set("x-csrf-token", memberCsrf)
    .send(body)
    .expect(201);
  const id = result.body.event.id;
  assert.equal(result.body.event.status, "pending");
  assert.equal(result.body.event.dateConfirmed, false);
  await request(app).get(`/api/events/${id}`).expect(404);
  await request(app).get(`/api/events/${id}/calendar`).expect(404);
  assert.equal(
    (await request(app).get("/api/events?q=Propuesta%20privada")).body.total,
    0,
  );
  assert.ok(
    (await member.get("/api/proposals")).body.events.some((e) => e.id === id),
  );
  await member
    .patch(`/api/admin/events/${id}/status`)
    .set("x-csrf-token", memberCsrf)
    .send({ status: "published" })
    .expect(403);
  await admin
    .patch(`/api/admin/events/${id}/status`)
    .set("x-csrf-token", adminCsrf)
    .send({ status: "published", moderationNote: "Revisado para la prueba" })
    .expect(200);
  const pub = await request(app).get(`/api/events/${id}`).expect(200);
  assert.equal(pub.body.event.moderationNote, undefined);
  assert.equal(
    (await request(app).get("/api/events?q=Propuesta%20privada")).body.total,
    1,
  );
  await member
    .put(`/api/favorites/${id}`)
    .set("x-csrf-token", memberCsrf)
    .expect(201);
  await admin
    .patch(`/api/admin/events/${id}/status`)
    .set("x-csrf-token", adminCsrf)
    .send({ status: "withdrawn" })
    .expect(200);
  await request(app).get(`/api/events/${id}`).expect(404);
  assert.equal((await member.get("/api/favorites")).body.events.length, 0);
});
test("administrador crea, edita y rechaza; usuarios solo ven sus propuestas", async () => {
  const proposed = await member
    .post("/api/proposals")
    .set("x-csrf-token", memberCsrf)
    .send({ ...demoEvents[1], title: "Propuesta rechazada de prueba" })
    .expect(201);
  await admin
    .patch(`/api/admin/events/${proposed.body.event.id}/status`)
    .set("x-csrf-token", adminCsrf)
    .send({ status: "rejected", moderationNote: "Falta una fuente oficial." })
    .expect(200);
  const mine = (await member.get("/api/proposals")).body.events.find(
    (e) => e.id === proposed.body.event.id,
  );
  assert.equal(mine.status, "rejected");
  assert.equal(mine.moderationNote, "Falta una fuente oficial.");
  assert.equal((await admin.get("/api/proposals")).body.events.length, 0);
  const created = await admin
    .post("/api/admin/events")
    .set("x-csrf-token", adminCsrf)
    .send({ ...demoEvents[2], title: "Contenido creado por administración" })
    .expect(201);
  const updated = await admin
    .put(`/api/admin/events/${created.body.event.id}`)
    .set("x-csrf-token", adminCsrf)
    .send({
      ...created.body.event,
      title: "Contenido editado por administración",
    })
    .expect(200);
  assert.equal(
    updated.body.event.title,
    "Contenido editado por administración",
  );
});
test("se rechazan ediciones con fechas inválidas, URLs peligrosas y horarios incompletos", async () => {
  for (const patch of [
    { endDate: "2026-01-01" },
    { sourceUrl: "javascript:alert(1)" },
    { startTime: "14:00", endTime: "15:00", timezone: "" },
    { kind: "tradition" },
    { startDate: "2026-02-30" },
    { startDate: null },
  ]) {
    await member
      .post("/api/proposals")
      .set("x-csrf-token", memberCsrf)
      .send({ ...demoEvents[0], ...patch })
      .expect(400);
  }
});
test("calendario ICS: fin exclusivo, UTF-8, estado tentativo y zona horaria", async () => {
  const result = await request(app)
    .get(`/api/events/${demoEvents[0].id}/calendar`)
    .expect(200);
  assert.match(result.headers["content-type"], /text\/calendar/);
  assert.match(result.text, /DTSTART;VALUE=DATE:20261121/);
  assert.match(result.text, /DTEND;VALUE=DATE:20261123/);
  assert.match(result.text, /STATUS:TENTATIVE/);
  assert.match(result.text, /\[EJEMPLO\]/);
  for (const line of result.text.split("\r\n"))
    assert.ok(Buffer.byteLength(line) <= 75);
  const timed = calendarFile(
    {
      ...demoEvents[0],
      startTime: "18:00",
      endTime: "19:00",
      timezone: "America/Guatemala",
    },
    "https://example.test",
  );
  assert.match(timed, /DTSTART:20261122T000000Z/);
  await request(app)
    .get(`/api/events/${traditions[0].id}/calendar`)
    .expect(404);
});
test("retirar ejemplos conserva la tradición documentada y excluye ejemplos del azar", async () => {
  const response = await admin
    .post("/api/admin/withdraw-demo")
    .set("x-csrf-token", adminCsrf)
    .expect(200);
  assert.ok(response.body.count >= 12);
  const events = (await request(app).get("/api/events")).body.events;
  assert.ok(events.every((e) => !e.isDemo));
  assert.ok(events.some((e) => e.id === traditions[0].id));
  assert.equal(
    (await request(app).get("/api/events/surprise")).body.id,
    traditions[0].id,
  );
});
