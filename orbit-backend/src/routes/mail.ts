import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireScope } from "../middleware/auth";

export const mailRouter = Router();
mailRouter.use(requireAuth, requireScope("mail"));

mailRouter.get("/", (req, res) => {
  const mails = db.prepare("SELECT * FROM mails WHERE workspace_id = ? ORDER BY sort").all(req.user!.workspace_id);
  res.json({ mails });
});

mailRouter.get("/:id/drafts", (req, res) => {
  const drafts = db.prepare("SELECT tone_label as label, body FROM mail_drafts WHERE mail_id = ? ORDER BY sort").all(req.params.id);
  res.json({ drafts });
});

mailRouter.post("/:id/send", (req, res) => {
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: "Reply body is empty" });
  const wsId = req.user!.workspace_id;
  const mail = db.prepare("SELECT * FROM mails WHERE id = ? AND workspace_id = ?").get(req.params.id, wsId) as any;
  if (!mail) return res.status(404).json({ error: "Not found" });
  db.prepare("UPDATE mails SET tag = 'Replied', hot = 0 WHERE id = ?").run(mail.id);
  db.prepare("INSERT INTO audit_log (workspace_id, ts, event) VALUES (?, strftime('%H:%M','now'), ?)").run(
    wsId, `You replied to ${mail.from_name}`
  );
  const mails = db.prepare("SELECT * FROM mails WHERE workspace_id = ? ORDER BY sort").all(wsId);
  res.json({ ok: true, mails });
});
