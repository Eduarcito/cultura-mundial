import { Event, sequelize } from "../src/models/index.js";
import { demoEvents, traditions } from "../seeders/events.js";
try {
  await sequelize.transaction(async (transaction) => {
    for (const event of [...demoEvents, ...traditions])
      await Event.findOrCreate({
        where: { id: event.id },
        defaults: event,
        transaction,
      });
  });
  console.log(
    "12 ediciones ficticias y 1 tradición documentada cargadas. No se modificaron registros existentes.",
  );
} finally {
  await sequelize.close();
}
