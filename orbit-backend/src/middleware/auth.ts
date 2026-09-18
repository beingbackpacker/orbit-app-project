import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { JWT_SECRET } from "../env";

export interface AuthedUser {
  id: number;
  workspace_id: number;
  user_id: string;
  name: string;
  initials: string;
  role: "owner" | "editor" | "viewer";
  must_change_password: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { uid: number };
    const user = db.prepare("SELECT id, workspace_id, user_id, name, initials, role, must_change_password, status FROM users WHERE id = ?").get(payload.uid) as any;
    if (!user || user.status !== "active") return res.status(401).json({ error: "Session invalid" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "owner") return res.status(403).json({ error: "Owner only" });
  next();
}

export function requireScope(category: "tasks" | "calendar" | "mail" | "vault") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Missing token" });
    if (req.user.role === "owner") return next();
    const row = db.prepare("SELECT granted FROM scopes WHERE user_id = ? AND category = ?").get(req.user.id, category) as { granted: number } | undefined;
    if (!row || !row.granted) return res.status(403).json({ error: `No access to ${category}` });
    next();
  };
}
