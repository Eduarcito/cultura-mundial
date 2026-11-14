import { randomBytes, timingSafeEqual } from "node:crypto";
import { User } from "../models/index.js";
import { config } from "../config.js";
export const token = () => randomBytes(32).toString("hex");
export async function loadUser(req, res, next) {
  req.user = req.session.userId
    ? await User.findByPk(req.session.userId)
    : null;
  next();
}
export function requireUser(req, res, next) {
  if (!req.user)
    return res.status(401).json({ message: "Inicia sesión para continuar." });
  next();
}
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res
      .status(403)
      .json({ message: "Esta acción requiere permisos de administración." });
  next();
}
export function csrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const expected = req.session.csrfToken || "";
  const actual = req.get("x-csrf-token") || "";
  const origin = req.get("origin");
  if (
    (origin && origin !== config.origin) ||
    !actual ||
    !expected ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  ) {
    return res
      .status(403)
      .json({
        message:
          "La sesión del formulario expiró. Recarga la página e inténtalo de nuevo.",
      });
  }
  next();
}
