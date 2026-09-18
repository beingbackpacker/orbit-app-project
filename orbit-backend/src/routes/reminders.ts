import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export const remindersRouter = Router();
remindersRouter.use(requireAuth);

remindersRouter.get("/", (req, res) => {
  const reminders = db.prepare("SELECT * FROM reminders WHERE workspace_id = ? ORDER BY sort").all(req.user!.workspace_id);
  res.json({ reminders });
});

remindersRouter.post("/:id/toggle", (req, res) => {
  const r = db.prepare("SELECT * FROM reminders WHERE id = ? AND workspace_id = ?").get(req.params.id, req.user!.workspace_id) as any;
  if (!r) return res.status(404).json({ error: "Not found" });
  db.prepare("UPDATE reminders SET enabled = ? WHERE id = ?").run(r.enabled ? 0 : 1, r.id);
  res.json({ reminders: db.prepare("SELECT * FROM reminders WHERE workspace_id = ? ORDER BY sort").all(req.user!.workspace_id) });
});
