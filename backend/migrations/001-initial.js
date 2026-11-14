import { DataTypes as D } from "sequelize";
import { userFields, eventFields } from "../src/models/index.js";
const timestamps = {
  createdAt: { type: D.DATE, allowNull: false },
  updatedAt: { type: D.DATE, allowNull: false },
};
export async function up({ context: qi }) {
  await qi.sequelize.transaction(async (transaction) => {
    const opts = { transaction };
    await qi.createTable("Users", { ...userFields, ...timestamps }, opts);
    await qi.createTable("Events", { ...eventFields, ...timestamps }, opts);
    await qi.createTable(
      "Favorites",
      {
        userId: {
          type: D.UUID,
          primaryKey: true,
          references: { model: "Users", key: "id" },
          onDelete: "CASCADE",
        },
        eventId: {
          type: D.UUID,
          primaryKey: true,
          references: { model: "Events", key: "id" },
          onDelete: "CASCADE",
        },
        ...timestamps,
      },
      opts,
    );
    await qi.createTable(
      "Sessions",
      {
        sid: { type: D.STRING(36), primaryKey: true },
        expires: D.DATE,
        data: D.TEXT,
        ...timestamps,
      },
      opts,
    );
    await qi.addIndex("Events", ["status", "startDate"], opts);
    await qi.addIndex("Events", ["country", "category"], opts);
    await qi.addIndex("Sessions", ["expires"], opts);
    await qi.sequelize.query(
      `ALTER TABLE "Users" ADD CONSTRAINT users_role CHECK (role IN ('user', 'admin'))`,
      opts,
    );
    await qi.sequelize.query(
      `ALTER TABLE "Events" ADD CONSTRAINT event_status CHECK (status IN ('pending','published','rejected','withdrawn')), ADD CONSTRAINT event_kind CHECK (kind IN ('edition','tradition')), ADD CONSTRAINT event_dates CHECK ("endDate" IS NULL OR "startDate" IS NULL OR "endDate" >= "startDate")`,
      opts,
    );
  });
}
export async function down({ context: qi }) {
  await qi.sequelize.transaction(async (transaction) => {
    for (const table of ["Sessions", "Favorites", "Events", "Users"])
      await qi.dropTable(table, { transaction });
  });
}
