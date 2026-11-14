import { Umzug, SequelizeStorage } from "umzug";
import { fileURLToPath } from "node:url";
import { sequelize } from "../src/models/index.js";
export const migrator = new Umzug({
  migrations: {
    glob: fileURLToPath(
      new URL("../migrations/*.js", import.meta.url),
    ).replaceAll("\\", "/"),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await migrator.up();
  } finally {
    await sequelize.close();
  }
}
