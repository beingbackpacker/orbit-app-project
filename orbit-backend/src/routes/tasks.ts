import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireScope } from "../middleware/auth";

export const tasksRouter = Router();
tasksRouter.use(requireAuth, requireScope("tasks"));

function serialize(wsId: number) {
  const rows = db.prepare("SELECT t.*, u.user_id as owner_login, u.initials as owner_initials, u.role as owner_role FROM tasks t LEFT JOIN users u ON u.id = t.owner_user_id WHERE t.workspace_id = ? ORDER BY t.sort").all(wsId) as any[];
  return rows.map((t) => ({
    id: t.id, title: t.title, meta: t.meta, urgent: !!t.urgent, project: t.project, done: !!t.done,
    ownerInitials: t.owner_initials, ownerName: t.owner_login,
    steps: (db.prepare("SELECT text FROM task_steps WHERE task_id = ? ORDER BY sort").all(t.id) as any[]).map((s) => s.text)
  }));
}

tasksRouter.get("/", (req, res) => {
  res.json({ tasks: serialize(req.user!.workspace_id) });
});

tasksRouter.post("/:id/toggle", (req, res) => {
  const wsId = req.user!.workspace_id;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND workspace_id = ?").get(req.params.id, wsId) as any;
  if (!task) return res.status(404).json({ error: "Not found" });
  db.prepare("UPDATE tasks SET done = ? WHERE id = ?").run(task.done ? 0 : 1, task.id);
  res.json({ tasks: serialize(wsId) });
});

tasksRouter.post("/", (req, res) => {
  const { title, project } = req.body || {};
  if (!title) return res.status(400).json({ error: "title is required" });
  const wsId = req.user!.workspace_id;
  const id = "t" + Date.now().toString(36);
  const maxSort = (db.prepare("SELECT COALESCE(MAX(sort), -1) m FROM tasks WHERE workspace_id = ?").get(wsId) as any).m;
  db.prepare("INSERT INTO tasks (id, workspace_id, title, meta, urgent, project, owner_user_id, done, sort) VALUES (?, ?, ?, 'New', 0, ?, ?, 0, ?)")
    .run(id, wsId, title, project || "Personal", req.user!.id, maxSort + 1);
  res.json({ tasks: serialize(wsId) });
});
