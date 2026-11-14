import { Op } from "sequelize";
import { z } from "zod";
import { Event, Favorite, CATEGORIES, STATUSES } from "../models/index.js";
import {
  adminSchema,
  proposalSchema,
  querySchema,
} from "../services/validation.js";
import { calendarFile } from "../services/calendar.js";
import { config } from "../config.js";
const id = (req) => z.uuid().parse(req.params.id);
const publicAttributes = { exclude: ["submittedBy", "moderationNote"] };
export function buildWhere(query) {
  const where = { status: "published" };
  if (query.q) {
    const term = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
    where[Op.or] = ["title", "country", "city", "description", "origin"].map(
      (field) => ({ [field]: { [Op.iLike]: term } }),
    );
  }
  for (const key of ["country", "category", "kind"])
    if (query[key]) where[key] = query[key];
  if (query.from) where.endDate = { [Op.gte]: query.from };
  if (query.to) where.startDate = { [Op.lte]: query.to };
  return where;
}
export async function list(req, res) {
  const query = querySchema.parse(req.query);
  const { rows, count } = await Event.findAndCountAll({
    where: buildWhere(query),
    attributes: publicAttributes,
    order:
      query.sort === "title"
        ? [
            ["title", "ASC"],
            ["id", "ASC"],
          ]
        : [
            ["startDate", "ASC NULLS LAST"],
            ["title", "ASC"],
            ["id", "ASC"],
          ],
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
  });
  res.json({
    events: rows,
    total: count,
    page: query.page,
    pages: Math.ceil(count / query.limit),
  });
}
export async function metadata(req, res) {
  const rows = await Event.findAll({
    where: { status: "published" },
    attributes: ["country"],
    group: ["country"],
    order: [["country", "ASC"]],
  });
  res.json({
    categories: CATEGORIES,
    countries: rows.map((row) => row.country),
  });
}
export async function surprise(req, res) {
  const count = await Event.count({ where: { status: "published" } });
  if (!count)
    return res
      .status(404)
      .json({ message: "Todavía no hay historias publicadas. Vuelve pronto." });
  const event = await Event.findOne({
    where: { status: "published" },
    attributes: ["id"],
    offset: Math.floor(Math.random() * count),
    order: [["id", "ASC"]],
  });
  res.json(event);
}
export async function detail(req, res) {
  const event = await Event.findOne({
    where: { id: id(req), status: "published" },
    attributes: publicAttributes,
  });
  if (!event)
    return res
      .status(404)
      .json({ message: "Este contenido no está disponible o fue retirado." });
  const related = await Event.findAll({
    where: {
      id: { [Op.ne]: event.id },
      status: "published",
      [Op.or]: [{ country: event.country }, { category: event.category }],
    },
    attributes: publicAttributes,
    limit: 3,
    order: [["startDate", "ASC NULLS LAST"]],
  });
  res.json({ event, related });
}
export async function download(req, res) {
  const event = await Event.findOne({
    where: { id: id(req), status: "published", kind: "edition" },
  });
  if (!event?.startDate || !event.endDate)
    return res
      .status(404)
      .json({
        message:
          "Esta historia no tiene una edición con fechas para el calendario.",
      });
  res
    .set("Content-Type", "text/calendar; charset=utf-8")
    .set("Content-Disposition", 'attachment; filename="cultura-evento.ics"')
    .send(calendarFile(event, `${config.publicUrl}/eventos/${event.id}`));
}
export async function favorites(req, res) {
  const rows = await Favorite.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Event,
        required: true,
        where: { status: "published" },
        attributes: publicAttributes,
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.json({ events: rows.map((row) => row.Event) });
}
export async function saveFavorite(req, res) {
  const eventId = id(req);
  if (!(await Event.findOne({ where: { id: eventId, status: "published" } })))
    return res.status(404).json({ message: "El evento ya no está publicado." });
  await Favorite.findOrCreate({ where: { userId: req.user.id, eventId } });
  res.status(201).json({ saved: true });
}
export async function removeFavorite(req, res) {
  await Favorite.destroy({ where: { userId: req.user.id, eventId: id(req) } });
  res.json({ saved: false });
}
export async function propose(req, res) {
  const data = proposalSchema.parse(req.body);
  const event = await Event.create({
    ...data,
    submittedBy: req.user.id,
    status: "pending",
    isDemo: false,
    dateConfirmed: false,
  });
  res.status(201).json({ event });
}
export async function proposals(req, res) {
  res.json({
    events: await Event.findAll({
      where: { submittedBy: req.user.id },
      order: [["createdAt", "DESC"]],
    }),
  });
}
export async function adminList(req, res) {
  const status = req.query.status
    ? z.enum(STATUSES).parse(req.query.status)
    : null;
  const { page, limit } = querySchema.parse(req.query);
  const { rows, count } = await Event.findAndCountAll({
    where: status ? { status } : {},
    order: [
      ["updatedAt", "DESC"],
      ["id", "ASC"],
    ],
    limit,
    offset: (page - 1) * limit,
  });
  res.json({
    events: rows,
    total: count,
    pages: Math.ceil(count / limit),
    page,
  });
}
export async function adminDetail(req, res) {
  const event = await Event.findByPk(id(req));
  if (!event)
    return res.status(404).json({ message: "No se encontró el contenido." });
  res.json({ event });
}
export async function adminSave(req, res) {
  const data = adminSchema.parse(req.body);
  if (req.params.id) {
    const event = await Event.findByPk(id(req));
    if (!event)
      return res.status(404).json({ message: "No se encontró el contenido." });
    await event.update(data);
    res.json({ event });
  } else
    res
      .status(201)
      .json({
        event: await Event.create({ ...data, submittedBy: req.user.id }),
      });
}
export async function moderate(req, res) {
  const { status, moderationNote } = z
    .object({
      status: z.enum(["published", "rejected", "withdrawn"]),
      moderationNote: z.string().trim().max(1000).default(""),
    })
    .parse(req.body);
  const event = await Event.findByPk(id(req));
  if (!event)
    return res.status(404).json({ message: "No se encontró el contenido." });
  if (status === "published") {
    const data = adminSchema.parse({
      ...event.toJSON(),
      status,
      reviewedAt: new Date().toISOString().slice(0, 10),
    });
    await event.update({
      status: data.status,
      reviewedAt: data.reviewedAt,
      moderationNote,
    });
  } else await event.update({ status, moderationNote });
  res.json({ event });
}
export async function withdrawDemo(req, res) {
  const [count] = await Event.update(
    { status: "withdrawn" },
    { where: { isDemo: true, status: "published" } },
  );
  res.json({ message: `${count} ejemplos retirados.`, count });
}
