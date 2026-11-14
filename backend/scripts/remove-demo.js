import { Event, sequelize } from "../src/models/index.js";
try {
  const [count] = await Event.update(
    { status: "withdrawn" },
    { where: { isDemo: true } },
  );
  console.log(`${count} ejemplos retirados del sitio público.`);
} finally {
  await sequelize.close();
}
