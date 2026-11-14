import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
const bin = process.env.LOCAL_PG_BIN,
  data = process.env.LOCAL_PG_DATA,
  action = process.argv[2];
if (
  !bin ||
  !data ||
  !existsSync(join(data, "PG_VERSION")) ||
  !["start", "stop"].includes(action)
)
  throw new Error(
    "Configura LOCAL_PG_BIN y LOCAL_PG_DATA para una instancia local propia ya inicializada. Para un servicio existente, usa su administrador de servicios.",
  );
const db = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(db.hostname))
  throw new Error("Este comando solo permite una base local.");
const executable = join(
  bin,
  process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl",
);
const status = spawnSync(executable, ["-D", data, "status"], {
  stdio: "ignore",
  windowsHide: true,
});
if (action === "start" && status.status === 0) {
  console.log("La instancia local ya está iniciada.");
  process.exit(0);
}
if (action === "stop" && status.status !== 0) {
  console.log("La instancia local ya está detenida.");
  process.exit(0);
}
const args = [
  "-D",
  data,
  ...(action === "start"
    ? [
        "-l",
        join(data, "server.log"),
        "-o",
        `-p ${db.port || 5432} -h 127.0.0.1`,
      ]
    : ["-m", "fast"]),
  action,
];
const result = spawnSync(executable, args, {
  stdio: "inherit",
  windowsHide: true,
});
process.exitCode = result.status || 0;
