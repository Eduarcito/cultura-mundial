import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { registration, login as loginSchema } from "../services/validation.js";
import { token } from "../middleware/security.js";
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});
async function establish(req, user) {
  await new Promise((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve())),
  );
  req.session.userId = user.id;
  req.session.csrfToken = token();
  await new Promise((resolve, reject) =>
    req.session.save((e) => (e ? reject(e) : resolve())),
  );
  return { user: publicUser(user), csrfToken: req.session.csrfToken };
}
export function sessionInfo(req, res) {
  req.session.csrfToken ||= token();
  res.json({
    user: req.user ? publicUser(req.user) : null,
    csrfToken: req.session.csrfToken,
  });
}
export async function register(req, res) {
  const data = registration.parse(req.body);
  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash: await bcrypt.hash(data.password, 12),
  });
  res.status(201).json(await establish(req, user));
}
export async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const user = await User.unscoped().findOne({ where: { email: data.email } });
  // Compare even when the email does not exist to reduce timing differences.
  const valid = await bcrypt.compare(
    data.password,
    user?.passwordHash ||
      "$2b$12$KkZJpMhpcdvCv5USG8xPguOUMT4SmQCf7IQoVFUIdc4soBPY/ADiq",
  );
  if (!user || !valid)
    return res
      .status(401)
      .json({ message: "Correo o contraseña incorrectos." });
  res.json(await establish(req, user));
}
export async function logout(req, res) {
  await new Promise((resolve, reject) =>
    req.session.destroy((e) => (e ? reject(e) : resolve())),
  );
  res.clearCookie("cultura.sid", { path: "/" });
  res.json({ message: "Sesión cerrada." });
}
