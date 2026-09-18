import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireScope } from "../middleware/auth";

export const calendarRouter = Router();
calendarRouter.use(requireAuth, requireScope("calendar"));

calendarRouter.get("/", (req, res) => {
  const wsId = req.user!.workspace_id;
  const year = Number(req.query.year) || 2026;
  const month = Number(req.query.month) || 8;
  const busy = db.prepare("SELECT day, level FROM calendar_busy WHERE workspace_id = ? AND year = ? AND month = ?").all(wsId, year, month) as { day: number; level: number }[];
  const agenda = db.prepare("SELECT * FROM calendar_agenda WHERE workspace_id = ? ORDER BY sort").all(wsId);
  res.json({ year, month, busy, agenda });
});
