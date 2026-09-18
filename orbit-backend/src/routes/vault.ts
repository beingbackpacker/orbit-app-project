import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireScope } from "../middleware/auth";

export const vaultRouter = Router();
vaultRouter.use(requireAuth, requireScope("vault"));

const SETTING_META: Record<string, { title: string; sub: string }> = {
  vault: { title: "On-device encrypted vault", sub: "AES-256, unlocked with Face ID. Required." },
  sync: { title: "Cloud sync", sub: "Off. Turn on per category — calendar only, or everything." },
  local: { title: "Process AI on device first", sub: "Only sends to the cloud when a request needs a bigger model, and asks first." },
  cite: { title: "Cite sources in research answers", sub: "Every claim links to the paper or mail it came from." },
  log: { title: "Keep an approval log", sub: "Every action Orbit took, and who approved it." }
};

vaultRouter.get("/", (req, res) => {
  const wsId = req.user!.workspace_id;
  const usage = db.prepare("SELECT label, bytes, color_key as colorKey FROM vault_usage WHERE workspace_id = ? ORDER BY sort").all(wsId) as any[];
  const total = usage.reduce((sum, u) => sum + u.bytes, 0);
  const settingsRows = db.prepare("SELECT key, enabled FROM user_settings WHERE user_id = ?").all(req.user!.id) as { key: string; enabled: number }[];
  const order = Object.keys(SETTING_META);
  const settings = settingsRows
    .slice()
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
    .map((s) => ({ id: s.key, enabled: !!s.enabled, ...SETTING_META[s.key] }));
  res.json({
    totalGb: (total / (1024 * 1024 * 1024)).toFixed(1),
    bars: usage.map((u) => ({ label: `${u.label} ${(u.bytes / (1024 * 1024)).toFixed(0)} MB`, pct: Math.round((u.bytes / total) * 100), colorKey: u.colorKey })),
    settings
  });
});

vaultRouter.post("/settings/:key/toggle", (req, res) => {
  const key = req.params.key;
  if (key === "vault") return res.status(400).json({ error: "Vault encryption is required and cannot be turned off" });
  const row = db.prepare("SELECT enabled FROM user_settings WHERE user_id = ? AND key = ?").get(req.user!.id, key) as { enabled: number } | undefined;
  const next = row ? (row.enabled ? 0 : 1) : 1;
  db.prepare("INSERT INTO user_settings (user_id, key, enabled) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET enabled = excluded.enabled")
    .run(req.user!.id, key, next);
  res.json({ id: key, enabled: !!next });
});
