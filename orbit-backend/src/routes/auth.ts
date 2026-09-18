import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { JWT_SECRET } from "../env";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/sign-in", (req, res) => {
  const { workspace, userId, password } = req.body || {};
  if (!workspace || !userId || !password) return res.status(400).json({ error: "workspace, userId and password are required" });

  const ws = db.prepare("SELECT id FROM workspaces WHERE domain = ?").get(workspace) as { id: number } | undefined;
  if (!ws) return res.status(401).json({ error: "Unknown workspace" });

  const user = db.prepare("SELECT * FROM users WHERE workspace_id = ? AND user_id = ?").get(ws.id, userId) as any;
  if (!user || user.status !== "active") return res.status(401).json({ error: "Invalid credentials" });

  if (user.temp_password_expires_at && new Date(user.temp_password_expires_at).getTime() < Date.now()) {
    return res.status(401).json({ error: "Temporary password expired — ask your workspace owner to reissue one" });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  db.prepare("UPDATE users SET last_active_at = strftime('%H:%M','now') || ' today' WHERE id = ?").run(user.id);
  if (user.role !== "owner") {
    db.prepare("INSERT INTO audit_log (workspace_id, ts, event) VALUES (?, strftime('%H:%M','now'), ?)").run(
      ws.id, `${user.name} signed in`
    );
  }

  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({
    token,
    user: {
      id: user.id, userId: user.user_id, name: user.name, initials: user.initials,
      role: user.role, mustChangePassword: !!user.must_change_password
    }
  });
});

authRouter.post("/change-password", requireAuth, (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 0, temp_password_expires_at = NULL WHERE id = ?")
    .run(bcrypt.hashSync(newPassword, 10), req.user!.id);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
