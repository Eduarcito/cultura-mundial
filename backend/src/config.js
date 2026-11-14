import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
export const config = {
  databaseUrl: process.env.DATABASE_URL,
  secret: process.env.SESSION_SECRET,
  production: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT || 3001),
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  publicUrl: process.env.PUBLIC_URL || "http://localhost:5173",
};
if (!config.databaseUrl)
  throw new Error(
    "Configura DATABASE_URL en backend/.env. Consulta el README.",
  );
if (!config.secret || config.secret.length < 32)
  throw new Error("SESSION_SECRET debe contener al menos 32 caracteres.");
