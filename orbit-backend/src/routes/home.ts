import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export const homeRouter = Router();
homeRouter.use(requireAuth);

// ---- AI proposals (approval-queue interaction model) ----
homeRouter.get("/proposals", (req, res) => {
  const rows = db.prepare("SELECT * FROM ai_proposals WHERE workspace_id = ? ORDER BY sort").all(req.user!.workspace_id) as any[];
  const states = db.prepare("SELECT proposal_id, state FROM ai_proposal_state WHERE user_id = ?").all(req.user!.id) as { proposal_id: string; state: string }[];
  const stateMap = Object.fromEntries(states.map((s) => [s.proposal_id, s.state]));
  res.json({ proposals: rows.map((p) => ({ id: p.id, tag: p.tag, title: p.title, why: p.why, state: stateMap[p.id] || null })) });
});

homeRouter.post("/proposals/:id/decide", (req, res) => {
  const { decision } = req.body || {};
  if (!["ok", "no"].includes(decision)) return res.status(400).json({ error: "decision must be ok or no" });
  db.prepare("INSERT INTO ai_proposal_state (user_id, proposal_id, state) VALUES (?, ?, ?) ON CONFLICT(user_id, proposal_id) DO UPDATE SET state = excluded.state")
    .run(req.user!.id, req.params.id, decision);
  res.json({ ok: true, state: decision });
});

// ---- AI chat (conversational interaction model) ----
homeRouter.get("/chat", (req, res) => {
  const messages = db.prepare("SELECT who, text FROM chat_messages WHERE user_id = ? ORDER BY id").all(req.user!.id);
  const planRow = db.prepare("SELECT open FROM chat_plan_state WHERE user_id = ?").get(req.user!.id) as { open: number } | undefined;
  res.json({
    messages,
    plan: [
      { n: "01", t: "Move the 1:1 with Arjun to 16:00 and tell him why" },
      { n: "02", t: "Send the drafted reply to Priya, cohort C excluded" },
      { n: "03", t: "Hold 14:00–15:30 as a focus block for the dossier" }
    ],
    planOpen: planRow ? !!planRow.open : true
  });
});

homeRouter.post("/chat/plan/:decision", (req, res) => {
  const decision = req.params.decision;
  if (!["approve", "reject"].includes(decision)) return res.status(400).json({ error: "invalid decision" });
  db.prepare("INSERT INTO chat_plan_state (user_id, open) VALUES (?, 0) ON CONFLICT(user_id) DO UPDATE SET open = 0").run(req.user!.id);
  const reply = decision === "approve"
    ? "Done — all three. Arjun's confirmed, Priya's reply is sent, and 14:00 is protected. I'll check back at 13:50."
    : "Left alone. I'll keep them in the queue on Home and won't act on my own.";
  db.prepare("INSERT INTO chat_messages (user_id, who, text) VALUES (?, 'ai', ?)").run(req.user!.id, reply);
  res.json({ ok: true });
});

const SUGGEST_REPLIES: Record<string, string> = {
  "What's the FSSAI status?": "One document is outstanding on FSS/2026/8841, due in 66 days. I've queued the label copy task at the top of your list.",
  "Summarise this week": "4 tasks closed, 2 meetings left, and the FSSAI dossier is the one thing slipping — no logged work on it in 6 days.",
  "Find me 2 free hours": "11:15–13:00 tomorrow is fully open across your calendar. Want me to hold it?"
};

homeRouter.post("/chat/message", (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required" });
  db.prepare("INSERT INTO chat_messages (user_id, who, text) VALUES (?, 'me', ?)").run(req.user!.id, text);
  const reply = SUGGEST_REPLIES[text] || "Pulling that from your vault — everything below is computed on-device.";
  db.prepare("INSERT INTO chat_messages (user_id, who, text) VALUES (?, 'ai', ?)").run(req.user!.id, reply);
  res.json({ ok: true });
});

// ---- Focus session ----
function focusPayload(row: any) {
  const m = Math.floor(row.seconds_left / 60), s = row.seconds_left % 60;
  return {
    label: row.label, totalSeconds: row.total_seconds, secondsLeft: row.seconds_left, running: !!row.running,
    clock: `${m}:${String(s).padStart(2, "0")}`,
    pct: Math.round(((row.total_seconds - row.seconds_left) / row.total_seconds) * 100)
  };
}

homeRouter.get("/focus", (req, res) => {
  let row = db.prepare("SELECT * FROM focus_sessions WHERE user_id = ?").get(req.user!.id) as any;
  if (!row) {
    db.prepare("INSERT INTO focus_sessions (user_id) VALUES (?)").run(req.user!.id);
    row = db.prepare("SELECT * FROM focus_sessions WHERE user_id = ?").get(req.user!.id);
  }
  // catch up elapsed time since last update while running
  if (row.running) {
    const elapsed = Math.floor((Date.now() - new Date(row.updated_at.replace(" ", "T") + "Z").getTime()) / 1000);
    const secondsLeft = Math.max(0, row.seconds_left - elapsed);
    if (secondsLeft !== row.seconds_left) {
      db.prepare("UPDATE focus_sessions SET seconds_left = ?, updated_at = datetime('now'), running = ? WHERE user_id = ?")
        .run(secondsLeft, secondsLeft > 0 ? 1 : 0, req.user!.id);
      row = db.prepare("SELECT * FROM focus_sessions WHERE user_id = ?").get(req.user!.id);
    }
  }
  res.json(focusPayload(row));
});

homeRouter.post("/focus/toggle", (req, res) => {
  const row = db.prepare("SELECT * FROM focus_sessions WHERE user_id = ?").get(req.user!.id) as any;
  const running = row ? !row.running : true;
  db.prepare("INSERT INTO focus_sessions (user_id, running, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET running = excluded.running, updated_at = datetime('now')")
    .run(req.user!.id, running ? 1 : 0);
  const updated = db.prepare("SELECT * FROM focus_sessions WHERE user_id = ?").get(req.user!.id);
  res.json(focusPayload(updated));
});

homeRouter.post("/focus/reset", (req, res) => {
  db.prepare("UPDATE focus_sessions SET seconds_left = total_seconds, running = 0, updated_at = datetime('now') WHERE user_id = ?").run(req.user!.id);
  const updated = db.prepare("SELECT * FROM focus_sessions WHERE user_id = ?").get(req.user!.id);
  res.json(focusPayload(updated));
});
