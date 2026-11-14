import express from "express";
import session from "express-session";
import SequelizeStoreFactory from "connect-session-sequelize";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { ZodError } from "zod";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { sequelize } from "./models/index.js";
import { config } from "./config.js";
import { router } from "./routes/index.js";
import { csrf, loadUser } from "./middleware/security.js";
const SequelizeStore = SequelizeStoreFactory(session.Store);
export const sessionStore = new SequelizeStore({
  db: sequelize,
  expiration: 7 * 24 * 60 * 60 * 1000,
});
export const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "https:", "data:"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
      },
    },
  }),
);
app.use(cors({ origin: config.origin, credentials: true }));
app.use(express.json({ limit: "64kb" }));
app.get("/api/health", async (req, res) => {
  await sequelize.authenticate();
  res.json({ status: "ok" });
});
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Hay muchas solicitudes. Inténtalo en un minuto." },
  }),
);
app.use(
  "/api",
  session({
    name: "cultura.sid",
    secret: config.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.production,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
  csrf,
  loadUser,
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  router,
);
app.use("/api", (req, res) =>
  res.status(404).json({ message: "Ruta no encontrada." }),
);
const dist = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*path}", (req, res) => res.sendFile(`${dist}/index.html`));
}
app.use((error, req, res, next) => {
  if (error instanceof ZodError)
    return res
      .status(400)
      .json({
        message: "Revisa los campos del formulario o los filtros.",
        errors: error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
  if (error.name === "SequelizeUniqueConstraintError")
    return res
      .status(409)
      .json({ message: "Ya existe una cuenta con ese correo." });
  if (error.type === "entity.too.large")
    return res
      .status(413)
      .json({ message: "El contenido enviado es demasiado grande." });
  if (error.type === "entity.parse.failed")
    return res
      .status(400)
      .json({ message: "El formato de la solicitud no es válido." });
  console.error(error.name, error.message);
  res
    .status(500)
    .json({
      message:
        "No pudimos completar la solicitud. Inténtalo de nuevo en unos momentos.",
    });
});
