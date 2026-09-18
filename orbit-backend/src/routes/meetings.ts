import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireScope } from "../middleware/auth";

export const meetingsRouter = Router();
meetingsRouter.use(requireAuth, requireScope("calendar"));

function serialize(id: string) {
  const meeting = db.prepare("SELECT * FROM meetings WHERE id = ?").get(id) as any;
  if (!meeting) return null;
  return {
    ...meeting,
    attendees: db.prepare("SELECT initials FROM meeting_attendees WHERE meeting_id = ? ORDER BY sort").all(id).map((a: any) => a.initials),
    agenda: db.prepare("SELECT n, text, minutes FROM meeting_agenda WHERE meeting_id = ? ORDER BY sort").all(id),
    actions: db.prepare("SELECT text FROM meeting_actions WHERE meeting_id = ? ORDER BY sort").all(id).map((a: any) => a.text)
  };
}

meetingsRouter.get("/:id", (req, res) => {
  const meeting = serialize(req.params.id);
  if (!meeting) return res.status(404).json({ error: "Not found" });
  res.json({ meeting });
});

meetingsRouter.post("/:id/extract-actions", (req, res) => {
  const meeting = serialize(req.params.id);
  if (!meeting) return res.status(404).json({ error: "Not found" });
  const wsId = req.user!.workspace_id;
  const maxSort = (db.prepare("SELECT COALESCE(MAX(sort), -1) m FROM tasks WHERE workspace_id = ?").get(wsId) as any).m;
  meeting.actions.forEach((text: string, i: number) => {
    const id = `mt-${req.params.id}-${i}`;
    const exists = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
    if (!exists) {
      db.prepare("INSERT INTO tasks (id, workspace_id, title, meta, urgent, project, owner_user_id, done, sort) VALUES (?, ?, ?, 'From meeting', 0, 'Trial', ?, 0, ?)")
        .run(id, wsId, text.replace(/^[^—-]+[—-]\s*/, ""), req.user!.id, maxSort + 1 + i);
    }
  });
  res.json({ meeting, addedCount: meeting.actions.length });
});
