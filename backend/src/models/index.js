import { Sequelize, DataTypes as D } from "sequelize";
import { config } from "../config.js";
export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: "postgres",
  logging: false,
});
export const CATEGORIES = [
  "Festivales",
  "Gastronomía",
  "Música y danza",
  "Arte",
  "Tradiciones",
  "Celebraciones",
];
export const STATUSES = ["pending", "published", "rejected", "withdrawn"];
export const userFields = {
  id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
  name: { type: D.STRING(100), allowNull: false },
  email: { type: D.STRING(254), allowNull: false, unique: true },
  passwordHash: { type: D.STRING, allowNull: false },
  role: {
    type: D.STRING(20),
    allowNull: false,
    defaultValue: "user",
    validate: { isIn: [["user", "admin"]] },
  },
};
export const eventFields = {
  id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
  title: { type: D.STRING(180), allowNull: false },
  kind: { type: D.STRING(20), allowNull: false, defaultValue: "edition" },
  country: { type: D.STRING(80), allowNull: false },
  city: { type: D.STRING(100), allowNull: false },
  category: { type: D.STRING(40), allowNull: false },
  description: { type: D.TEXT, allowNull: false },
  origin: { type: D.TEXT, allowNull: false, defaultValue: "" },
  activities: { type: D.JSONB, allowNull: false, defaultValue: [] },
  venue: { type: D.STRING(250), allowNull: false, defaultValue: "" },
  startDate: { type: D.DATEONLY },
  endDate: { type: D.DATEONLY },
  startTime: { type: D.STRING(5) },
  endTime: { type: D.STRING(5) },
  timezone: { type: D.STRING(80) },
  dateConfirmed: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
  access: { type: D.STRING(20), allowNull: false, defaultValue: "unknown" },
  accessDetails: { type: D.STRING(300), defaultValue: "" },
  sourceUrl: { type: D.STRING(2000), allowNull: false },
  reviewedAt: { type: D.DATEONLY },
  imageUrl: { type: D.STRING(2000), defaultValue: "/images/antigua.webp" },
  imageAlt: {
    type: D.STRING(300),
    defaultValue: "Arquitectura de Antigua Guatemala; imagen ilustrativa.",
  },
  imageCredit: { type: D.STRING(250), defaultValue: "By Topo / Unsplash" },
  imageSource: {
    type: D.STRING(2000),
    defaultValue: "https://unsplash.com/photos/XOSMdXIWk_I",
  },
  imageLicense: { type: D.STRING(300), defaultValue: "Unsplash License" },
  isDemo: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
  status: { type: D.STRING(20), allowNull: false, defaultValue: "pending" },
  moderationNote: { type: D.STRING(1000), allowNull: false, defaultValue: "" },
  submittedBy: {
    type: D.UUID,
    allowNull: true,
    references: { model: "Users", key: "id" },
    onDelete: "SET NULL",
  },
};
export const User = sequelize.define("User", userFields, {
  defaultScope: { attributes: { exclude: ["passwordHash"] } },
});
export const Event = sequelize.define("Event", eventFields);
export const Favorite = sequelize.define("Favorite", {
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
});
Favorite.belongsTo(Event, { foreignKey: "eventId" });
Event.belongsTo(User, { foreignKey: "submittedBy", as: "author" });
