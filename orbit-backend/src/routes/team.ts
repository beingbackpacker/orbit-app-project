import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { requireAuth, requireOwner } from "../middleware/auth";
import { generateTempPassword, generateUserId } from "../util/password";

export const teamRouter = Router();
teamRouter.use(requireAuth);

const CATEGORIES = ["tasks", "calendar", "mail", "vault"] as const;
const ROLE_LABEL: Record<string, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };

function serializeMembers(workspaceId: number, viewerId: number) {
  const rows = db.prepare("SELECT * FROM users WHERE workspace_id = ? ORDER BY (role = 'owner') DESC, created_at ASC").all(workspaceId) as any[];
  return rows.map((m) => {
    const you = m.id === viewerId;
    const scopeRows = db.prepare("SELECT category, granted FROM scopes WHERE user_id = ?").all(m.id) as { category: string; granted: number }[];
    const scopeMap = Object.fromEntries(scopeRows.map((s) => [s.category, !!s.granted]));
    const openTasks = (db.prepare("SELECT COUNT(*) c FROM tasks WHERE owner_user_id = ? AND done = 0").get(m.id) as { c: number }).c;
    const activity = you
      ? "Holds the vault key · last active now"
      : m.status === "revoked"
        ? "Access revoked"
        : !m.last_active_at
          ? "Invite pending · password not yet used"
          : `Signed in ${m.last_active_at} · ${openTasks} task(s) open`;
    return {
      id: m.id,
      userId: m.user_id,
      name: m.name,
      initials: m.initials,
      role: ROLE_LABEL[m.role],
      you,
      status: m.status,
      activity,
      action: you ? "You" : m.status === "revoked" ? "Revoked" : !m.last_active_at ? "Resend" : "Revoke",
      scopes: CATEGORIES.map((c) => ({ category: c, label: c[0].toUpperCase() + c.slice(1), granted: m.role === "owner" || scopeMap[c] !== false }))
    };
  });
}

teamRouter.get("/", (req, res) => {
  const wsId = req.user!.workspace_id;
  const seatLimitRow = db.prepare("SELECT seat_limit FROM workspaces WHERE id = ?").get(wsId) as { seat_limit: number };
  const seatCount = (db.prepare("SELECT COUNT(*) c FROM users WHERE workspace_id = ? AND status = 'active'").get(wsId) as any).c;
  const auditLog = db.prepare("SELECT ts, event FROM audit_log WHERE workspace_id = ? ORDER BY id DESC LIMIT 10").all(wsId);
  res.json({
    workspaceDomain: (db.prepare("SELECT domain FROM workspaces WHERE id = ?").get(wsId) as any).domain,
    seatLine: `${seatCount} of ${seatLimitRow.seat_limit} seats`,
    isOwner: req.user!.role === "owner",
    members: serializeMembers(wsId, req.user!.id),
    auditLog
  });
});

teamRouter.post("/users", requireOwner, (req, res) => {
  const { name, scopes } = req.body || {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name is required" });
  const wsId = req.user!.workspace_id;
  const domain = (db.prepare("SELECT domain FROM workspaces WHERE id = ?").get(wsId) as any).domain;

  let userId = generateUserId(name, domain);
  let n = 1;
  while (db.prepare("SELECT id FROM users WHERE user_id = ?").get(userId)) userId = generateUserId(name, domain).replace("@", `${n++}@`);

  const tempPassword = generateTempPassword();
  const initials = name.trim().split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const result = db.prepare(`INSERT INTO users (workspace_id, user_id, name, initials, password_hash, role, must_change_password, temp_password_expires_at, status)
    VALUES (?, ?, ?, ?, ?, 'editor', 1, ?, 'active')`).run(wsId, userId, name.trim(), initials, bcrypt.hashSync(tempPassword, 10), expires);
  const newId = result.lastInsertRowid as number;

  const grantSet = new Set(Array.isArray(scopes) && scopes.length ? scopes : ["tasks", "calendar"]);
  const setScope = db.prepare("INSERT INTO scopes (user_id, category, granted) VALUES (?, ?, ?)");
  CATEGORIES.forEach((c) => setScope.run(newId, c, grantSet.has(c) ? 1 : 0));

  db.prepare("INSERT INTO audit_log (workspace_id, ts, event) VALUES (?, strftime('%H:%M','now'), ?)").run(
    wsId, `You issued credentials for ${userId} (Editor)`
  );

  res.json({
    userId,
    tempPassword,
    scope: [...grantSet].map((c) => c[0].toUpperCase() + c.slice(1)).join(" + "),
    expiresAt: expires
  });
});

teamRouter.post("/users/:id/revoke", requireOwner, (req, res) => {
  const id = Number(req.params.id);
  const target = db.prepare("SELECT * FROM users WHERE id = ? AND workspace_id = ?").get(id, req.user!.workspace_id) as any;
  if (!target || target.role === "owner") return res.status(400).json({ error: "Cannot revoke this account" });
  db.prepare("UPDATE users SET status = 'revoked' WHERE id = ?").run(id);
  db.prepare("INSERT INTO audit_log (workspace_id, ts, event) VALUES (?, strftime('%H:%M','now'), ?)").run(
    req.user!.workspace_id, `You revoked access for ${target.user_id}`
  );
  res.json({ ok: true });
});

teamRouter.post("/users/:id/resend", requireOwner, (req, res) => {
  const id = Number(req.params.id);
  const target = db.prepare("SELECT * FROM users WHERE id = ? AND workspace_id = ?").get(id, req.user!.workspace_id) as any;
  if (!target) return res.status(404).json({ error: "Not found" });
  const tempPassword = generateTempPassword();
  const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1, temp_password_expires_at = ? WHERE id = ?")
    .run(bcrypt.hashSync(tempPassword, 10), expires, id);
  db.prepare("INSERT INTO audit_log (workspace_id, ts, event) VALUES (?, strftime('%H:%M','now'), ?)").run(
    req.user!.workspace_id, `You reissued a temporary password for ${target.user_id}`
  );
  res.json({ userId: target.user_id, tempPassword, expiresAt: expires });
});

teamRouter.post("/scopes", requireOwner, (req, res) => {
  const { memberId, category, granted } = req.body || {};
  if (!memberId || !CATEGORIES.includes(category)) return res.status(400).json({ error: "memberId and valid category are required" });
  const target = db.prepare("SELECT * FROM users WHERE id = ? AND workspace_id = ?").get(memberId, req.user!.workspace_id) as any;
  if (!target || target.role === "owner") return res.status(400).json({ error: "Cannot change this member's scopes" });
  const next = granted === undefined ? undefined : !!granted;
  const current = db.prepare("SELECT granted FROM scopes WHERE user_id = ? AND category = ?").get(memberId, category) as { granted: number } | undefined;
  const value = next !== undefined ? next : !(current?.granted ?? 1);
  db.prepare("INSERT INTO scopes (user_id, category, granted) VALUES (?, ?, ?) ON CONFLICT(user_id, category) DO UPDATE SET granted = excluded.granted")
    .run(memberId, category, value ? 1 : 0);
  db.prepare("INSERT INTO audit_log (workspace_id, ts, event) VALUES (?, strftime('%H:%M','now'), ?)").run(
    req.user!.workspace_id, `You ${value ? "granted" : "revoked"} ${category} access for ${target.user_id}`
  );
  res.json({ ok: true, granted: value });
});
