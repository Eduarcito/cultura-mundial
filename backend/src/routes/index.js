import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as auth from "../controllers/auth.js";
import * as events from "../controllers/events.js";
import { requireUser, requireAdmin } from "../middleware/security.js";
export const router = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos. Vuelve a intentarlo en 15 minutos.",
  },
});
router.get("/auth/session", auth.sessionInfo);
router.post("/auth/register", authLimit, auth.register);
router.post("/auth/login", authLimit, auth.login);
router.post("/auth/logout", auth.logout);
router.get("/meta", events.metadata);
router.get("/events", events.list);
router.get("/events/surprise", events.surprise);
router.get("/events/:id/calendar", events.download);
router.get("/events/:id", events.detail);
router.get("/favorites", requireUser, events.favorites);
router.put("/favorites/:id", requireUser, events.saveFavorite);
router.delete("/favorites/:id", requireUser, events.removeFavorite);
router.get("/proposals", requireUser, events.proposals);
router.post("/proposals", requireUser, events.propose);
router.use("/admin", requireUser, requireAdmin);
router.get("/admin/events", events.adminList);
router.post("/admin/events", events.adminSave);
router.post("/admin/withdraw-demo", events.withdrawDemo);
router.get("/admin/events/:id", events.adminDetail);
router.put("/admin/events/:id", events.adminSave);
router.patch("/admin/events/:id/status", events.moderate);
