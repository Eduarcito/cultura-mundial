import { app, sessionStore } from "./app.js";
import { sequelize } from "./models/index.js";
import { config } from "./config.js";
await sequelize.authenticate();
const server = app.listen(config.port, "127.0.0.1", () =>
  console.log(`Cultura sin fronteras · API http://localhost:${config.port}`),
);
async function stop() {
  server.close();
  sessionStore.stopExpiringSessions();
  await sequelize.close();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
