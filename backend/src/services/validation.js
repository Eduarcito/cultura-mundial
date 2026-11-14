import { z } from "zod";
import { CATEGORIES, STATUSES } from "../models/index.js";
z.config(z.locales.es());
export const date = z.iso.date();
const url = z
  .url()
  .max(2000)
  .refine((v) => /^https?:\/\//.test(v), "Utiliza un enlace http o https.");
const nullable = (schema) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    schema.nullable(),
  );
export const registration = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254).trim().toLowerCase(),
  password: z
    .string()
    .min(12, "Utiliza al menos 12 caracteres.")
    .max(72)
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "La contraseña supera el límite de 72 bytes UTF-8.",
    ),
});
export const login = registration
  .omit({ name: true })
  .extend({ password: z.string().min(1).max(72) });
const fields = {
  title: z.string().trim().min(4).max(180),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(100),
  category: z.enum(CATEGORIES),
  kind: z.enum(["edition", "tradition"]).default("edition"),
  description: z.string().trim().min(30).max(10000),
  sourceUrl: url,
  startDate: nullable(date),
  endDate: nullable(date),
  origin: z.string().trim().max(6000).default(""),
  activities: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  venue: z.string().trim().max(250).default(""),
  startTime: nullable(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)),
  endTime: nullable(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)),
  timezone: nullable(
    z
      .string()
      .max(80)
      .refine((v) => {
        try {
          new Intl.DateTimeFormat("es", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }, "Zona horaria IANA inválida."),
  ),
};
function chronological(value, ctx) {
  const issue = (path, message) =>
    ctx.addIssue({ code: "custom", path: [path], message });
  if (value.kind === "edition" && (!value.startDate || !value.endDate))
    issue("startDate", "Una edición necesita fechas de inicio y fin.");
  if (
    value.kind === "tradition" &&
    (value.startDate || value.endDate || value.startTime || value.endTime)
  )
    issue(
      "kind",
      "Una tradición general no tiene fechas ni horarios de una edición.",
    );
  if (value.startDate && value.endDate && value.endDate < value.startDate)
    issue("endDate", "La fecha final debe ser posterior o igual al inicio.");
  if (
    (value.startTime || value.endTime) &&
    (!value.startTime || !value.endTime || !value.timezone)
  )
    issue("timezone", "Completa ambos horarios y la zona horaria.");
  if (
    value.startTime &&
    value.startDate === value.endDate &&
    value.endTime <= value.startTime
  )
    issue("endTime", "El horario final debe ser posterior al inicio.");
}
export const proposalSchema = z.object(fields).superRefine(chronological);
export const adminSchema = z
  .object({
    ...fields,
    dateConfirmed: z.boolean().default(false),
    access: z.enum(["unknown", "free", "paid"]).default("unknown"),
    accessDetails: z.string().max(300).default(""),
    reviewedAt: nullable(date),
    imageUrl: z.union([
      url,
      z.string().regex(/^\/images\/[a-z0-9-]+\.(webp|jpg|png)$/),
    ]),
    imageAlt: z.string().trim().min(5).max(300),
    imageCredit: z.string().trim().min(2).max(250),
    imageSource: url,
    imageLicense: z.string().trim().min(2).max(300),
    isDemo: z.boolean().default(false),
    status: z.enum(STATUSES).default("pending"),
    moderationNote: z.string().trim().max(1000).default(""),
  })
  .superRefine(chronological)
  .superRefine((v, ctx) => {
    if (v.status === "published" && !v.reviewedAt)
      ctx.addIssue({
        code: "custom",
        path: ["reviewedAt"],
        message: "Registra la fecha de revisión antes de publicar.",
      });
  });
export const querySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    country: z.string().max(80).optional(),
    category: z.enum(CATEGORIES).optional(),
    from: date.optional(),
    to: date.optional(),
    kind: z.enum(["edition", "tradition"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(9),
    sort: z.enum(["date", "title"]).default("date"),
  })
  .refine(
    (v) => !v.from || !v.to || v.to >= v.from,
    "El rango de fechas no es válido.",
  );
