import bcrypt from "bcryptjs";
import { User, sequelize } from "../src/models/index.js";
import { registration } from "../src/services/validation.js";
try {
  const data = registration.parse({
    name: process.env.ADMIN_NAME || "Administración",
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  if (await User.findOne({ where: { email: data.email } }))
    throw new Error(
      "El correo ya existe. No se cambian roles ni contraseñas de cuentas existentes.",
    );
  await User.create({
    name: data.name,
    email: data.email,
    passwordHash: await bcrypt.hash(data.password, 12),
    role: "admin",
  });
  console.log("Cuenta de administración creada.");
} finally {
  await sequelize.close();
}
