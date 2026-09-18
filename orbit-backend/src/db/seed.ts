import bcrypt from "bcryptjs";
import { db } from "./index";

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

function seed() {
  const existing = db.prepare("SELECT id FROM workspaces WHERE domain = ?").get("elongeva.orbit.app") as { id: number } | undefined;
  if (existing) {
    console.log("Already seeded. Delete orbit-backend/data/orbit.sqlite to reseed.");
    return;
  }

  const wsId = db.prepare("INSERT INTO workspaces (domain, seat_limit) VALUES (?, ?)").run("elongeva.orbit.app", 10).lastInsertRowid as number;

  const CREDS = {
    lucky: "Orbit#Owner1",
    priya: "Orbit#Priya1",
    arjun: "Orbit#Arjun1",
    kavya: "Kx7-fern-92"
  };

  const insertUser = db.prepare(`INSERT INTO users (workspace_id, user_id, name, initials, password_hash, role, must_change_password, temp_password_expires_at, status, last_active_at)
    VALUES (@workspace_id, @user_id, @name, @initials, @password_hash, @role, @must_change_password, @temp_password_expires_at, @status, @last_active_at)`);

  const luckyId = insertUser.run({
    workspace_id: wsId, user_id: "lucky@elongeva", name: "Lucky Sharma", initials: "L",
    password_hash: hash(CREDS.lucky), role: "owner", must_change_password: 0,
    temp_password_expires_at: null, status: "active", last_active_at: "now"
  }).lastInsertRowid as number;

  const priyaId = insertUser.run({
    workspace_id: wsId, user_id: "priya@elongeva", name: "Priya Nadar", initials: "P",
    password_hash: hash(CREDS.priya), role: "editor", must_change_password: 0,
    temp_password_expires_at: null, status: "active", last_active_at: "07:12 today"
  }).lastInsertRowid as number;

  const arjunId = insertUser.run({
    workspace_id: wsId, user_id: "arjun@elongeva", name: "Arjun Mehta", initials: "AR",
    password_hash: hash(CREDS.arjun), role: "editor", must_change_password: 0,
    temp_password_expires_at: null, status: "active", last_active_at: "yesterday"
  }).lastInsertRowid as number;

  const kavyaId = insertUser.run({
    workspace_id: wsId, user_id: "kavya@elongeva", name: "Kavya Rao", initials: "K",
    password_hash: hash(CREDS.kavya), role: "viewer", must_change_password: 1,
    temp_password_expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), status: "active", last_active_at: null
  }).lastInsertRowid as number;

  const setScope = db.prepare("INSERT INTO scopes (user_id, category, granted) VALUES (?, ?, ?)");
  const allCats = ["tasks", "calendar", "mail", "vault"] as const;
  for (const cat of allCats) setScope.run(luckyId, cat, 1);
  for (const cat of allCats) setScope.run(priyaId, cat, cat === "vault" ? 0 : 1);
  for (const cat of allCats) setScope.run(arjunId, cat, cat === "vault" || cat === "mail" ? 0 : 1);
  for (const cat of allCats) setScope.run(kavyaId, cat, cat === "vault" || cat === "mail" ? 0 : 1);

  const log = db.prepare("INSERT INTO audit_log (workspace_id, ts, event) VALUES (?, ?, ?)");
  log.run(wsId, "07:41", "Priya opened the CELLUVIA stability folder");
  log.run(wsId, "07:12", "Priya signed in — new device, approved by you");
  log.run(wsId, "Yesterday", "You issued credentials for kavya@elongeva (Viewer)");
  log.run(wsId, "Yesterday", "Arjun marked 'pricing sheet' complete");
  log.run(wsId, "Monday", "Vault backup verified · 1.2 GB encrypted");

  const owners: Record<string, number> = { me: luckyId, P: priyaId, AR: arjunId, K: kavyaId };
  const insertTask = db.prepare(`INSERT INTO tasks (id, workspace_id, title, meta, urgent, project, owner_user_id, done, sort) VALUES (@id, @workspace_id, @title, @meta, @urgent, @project, @owner_user_id, @done, @sort)`);
  const insertStep = db.prepare(`INSERT INTO task_steps (task_id, text, sort) VALUES (?, ?, ?)`);
  const taskDefs = [
    { id: "t1", title: "Finish FSSAI label copy for CELLUVIA", meta: "Due 6pm", urgent: 1, project: "Regulatory", owner: "me", done: 0,
      steps: ["Pull approved claims list", "Draft front-of-pack panel", "Send to Priya for review"] },
    { id: "t2", title: "Send 12-week stability data to advisory board", meta: "Done 09:10", urgent: 0, project: "Trial", owner: "me", done: 1, steps: [] },
    { id: "t3", title: "Review GutLongevity Pro pricing sheet", meta: "Today", urgent: 0, project: "Commercial", owner: "AR", done: 0, steps: [] },
    { id: "t4", title: "Book Dubai clinic visit", meta: "This week", urgent: 0, project: "UAE", owner: "K", done: 0, steps: [] },
    { id: "t5", title: "Log yesterday's dose adherence", meta: "2 min", urgent: 0, project: "Personal", owner: "me", done: 0, steps: [] },
    { id: "t6", title: "Re-run 8-week subgroup analysis", meta: "Done Tue", urgent: 0, project: "Trial", owner: "P", done: 1, steps: [] },
    { id: "t7", title: "Upload cold-chain temperature log", meta: "Done Mon", urgent: 0, project: "Regulatory", owner: "K", done: 1, steps: [] }
  ];
  taskDefs.forEach((t, i) => {
    insertTask.run({ id: t.id, workspace_id: wsId, title: t.title, meta: t.meta, urgent: t.urgent, project: t.project, owner_user_id: owners[t.owner], done: t.done, sort: i });
    t.steps.forEach((s, j) => insertStep.run(t.id, s, j));
  });

  const insertReminder = db.prepare(`INSERT INTO reminders (id, workspace_id, icon, title, when_text, enabled, sort) VALUES (?, ?, ?, ?, ?, 1, ?)`);
  [
    ["r1", "◍", "Log CELLUVIA dose", "Daily at 14:00 · streak 23 days"],
    ["r2", "▲", "FSSAI document upload", "01 Nov · 3 nudges before"],
    ["r3", "◎", "Ask Arjun about the pricing sheet", "When I next call him"],
    ["r4", "⌖", "Pick up cold-chain samples", "When I arrive at the lab"],
    ["r5", "☾", "Wind down — screens off", "Daily at 22:30"]
  ].forEach((r, i) => insertReminder.run(r[0], wsId, r[1], r[2], r[3], i));

  const insertMail = db.prepare(`INSERT INTO mails (id, workspace_id, from_name, initials, time_text, subject, snippet, tag, hot, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const mailDefs = [
    { id: "mail1", from: "Priya Nadar", i: "P", time: "07:12", subject: "Re: 8-week subgroup re-run", snippet: "Can you confirm which cohort we're excluding before I…", tag: "Needs your decision", hot: 1 },
    { id: "mail2", from: "FSSAI portal", i: "F", time: "06:40", subject: "Application FSS/2026/8841 — document pending", snippet: "One item remains outstanding on your submission…", tag: "Deadline in 66 days", hot: 1 },
    { id: "mail3", from: "Arjun Mehta", i: "AR", time: "Yesterday", subject: "Moved our 1:1 — works for me", snippet: "16:00 is fine. Orbit already put it in.", tag: "Reply drafted", hot: 0 },
    { id: "mail4", from: "Dubai Clinic Group", i: "D", time: "Yesterday", subject: "Site visit availability", snippet: "We have windows on the 8th and 15th of September…", tag: "Filed · Travel", hot: 0 },
    { id: "mail5", from: "Nature Aging", i: "N", time: "Mon", subject: "New issue: senolytics in humans", snippet: "Three papers matched your research saves.", tag: "Filed · Research", hot: 0 }
  ];
  mailDefs.forEach((m, i) => insertMail.run(m.id, wsId, m.from, m.i, m.time, m.subject, m.snippet, m.tag, m.hot, i));

  const insertDraft = db.prepare(`INSERT INTO mail_drafts (mail_id, tone_label, body, sort) VALUES (?, ?, ?, ?)`);
  const drafts = [
    { label: "Draft it", body: "Hi Priya,\n\nExcluding cohort C — the three participants who withdrew before week 6. Everything else stays as specified.\n\nStability data from this morning's advisory is attached; variance on the placebo arm sat inside tolerance, so the re-run is confirmatory rather than corrective.\n\nCan you have it back by Tuesday? I need it for the board deck.\n\nThanks,\nLucky" },
    { label: "Shorter", body: "Hi Priya,\n\nExclude cohort C (the three week-6 withdrawals). Stability data attached — placebo variance was in tolerance.\n\nBy Tuesday, if you can, for the board deck.\n\nThanks,\nLucky" },
    { label: "Warmer", body: "Hi Priya,\n\nThanks for chasing this — good catch on the cohort question. Let's exclude cohort C, the three who withdrew before week 6.\n\nI've attached this morning's stability data; the placebo arm behaved, so the re-run is really just confirmatory.\n\nNo rush beyond Tuesday, which is when the board deck locks. Shout if that's tight.\n\nBest,\nLucky" }
  ];
  drafts.forEach((d, i) => insertDraft.run("mail1", d.label, d.body, i));

  db.prepare(`INSERT INTO meetings (id, workspace_id, title, subtitle, when_text, location, prep_brief, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    "meet1", wsId, "Clinical advisory", "CELLUVIA trial", "Thu 27 Aug · 10:30 – 11:15", "Google Meet",
    "Last session you agreed to circulate the 12-week stability data. It is attached. Priya flagged one open question on the placebo arm — expect that first.",
    "Placebo arm variance within tolerance. Priya to re-run the 8-week subgroup. Need FSSAI label copy before the Sept batch. Ship the summary to the board deck."
  );
  const insertAttendee = db.prepare(`INSERT INTO meeting_attendees (meeting_id, initials, sort) VALUES (?, ?, ?)`);
  ["P", "AR", "K", "+1"].forEach((i, idx) => insertAttendee.run("meet1", i, idx));
  const insertAgendaItem = db.prepare(`INSERT INTO meeting_agenda (meeting_id, n, text, minutes, sort) VALUES (?, ?, ?, ?, ?)`);
  [
    ["01", "12-week stability data walkthrough", "15m"],
    ["02", "Placebo arm variance — Priya's question", "10m"],
    ["03", "Sept batch label copy", "10m"],
    ["04", "Next milestones", "10m"]
  ].forEach((a, i) => insertAgendaItem.run("meet1", a[0], a[1], a[2], i));
  const insertAction = db.prepare(`INSERT INTO meeting_actions (meeting_id, text, sort) VALUES (?, ?, ?)`);
  [
    "Priya — re-run 8-week subgroup",
    "You — FSSAI label copy before Sept batch",
    "You — add summary to board deck"
  ].forEach((t, i) => insertAction.run("meet1", t, i));

  const insertCalAgenda = db.prepare(`INSERT INTO calendar_agenda (workspace_id, date, time, title, sub, kind, meeting_id, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    ["09:00", "Morning review", "Solo · 20 min", "soft", null],
    ["10:30", "Clinical advisory — CELLUVIA", "Google Meet · 4 people", "hot", "meet1"],
    ["12:00", "Lunch + dose log", "Reminder", "soft", null],
    ["14:00", "FSSAI dossier — held by Orbit", "Focus block · 90 min", "green", null],
    ["16:00", "1:1 Arjun (moved)", "Phone · 30 min", "soft", null]
  ].forEach((a, i) => insertCalAgenda.run(wsId, "2026-08-27", a[0], a[1], a[2], a[3], a[4], i));

  const insertBusy = db.prepare(`INSERT INTO calendar_busy (workspace_id, year, month, day, level) VALUES (?, 2026, 8, ?, ?)`);
  const busy: Record<number, number> = { 4: 1, 6: 2, 11: 1, 13: 2, 18: 1, 20: 1, 25: 2, 27: 3, 28: 1 };
  Object.entries(busy).forEach(([day, level]) => insertBusy.run(wsId, Number(day), level));

  const insertProposal = db.prepare(`INSERT INTO ai_proposals (id, workspace_id, tag, title, why, sort) VALUES (?, ?, ?, ?, ?, ?)`);
  [
    ["p1", "Reschedule", "Move 1:1 with Arjun to 16:00", "It collides with the advisory call. 16:00 is free for both of you."],
    ["p2", "Draft", "Reply to Priya about the subgroup re-run", "She asked twice. Draft is written and waiting for your read."],
    ["p3", "Protect", "Block 14:00–15:30 for the FSSAI dossier", "Deadline is in 66 days and you've logged no work on it this week."]
  ].forEach((p, i) => insertProposal.run(p[0], wsId, p[1], p[2], p[3], i));

  const insertVault = db.prepare(`INSERT INTO vault_usage (workspace_id, label, bytes, color_key, sort) VALUES (?, ?, ?, ?, ?)`);
  [
    ["Notes & research", 540 * 1024 * 1024, "mint"],
    ["Mail cache", 320 * 1024 * 1024, "gold"],
    ["Attachments", 240 * 1024 * 1024, "peach"],
    ["Index", 120 * 1024 * 1024, "faint"]
  ].forEach((v, i) => insertVault.run(wsId, v[0], v[1], v[2], i));

  const insertSetting = db.prepare(`INSERT INTO user_settings (user_id, key, enabled) VALUES (?, ?, ?)`);
  const settingDefs: [string, number][] = [["vault", 1], ["sync", 0], ["local", 1], ["cite", 1], ["log", 1]];
  [luckyId, priyaId, arjunId, kavyaId].forEach((uid) => settingDefs.forEach(([k, v]) => insertSetting.run(uid, k, v)));

  db.prepare(`INSERT INTO chat_messages (user_id, who, text) VALUES (?, 'ai', ?)`).run(
    luckyId, "Morning. Three things are tangled today: the 10:30 advisory collides with your 1:1, Priya is still waiting on the subgroup answer, and the FSSAI dossier hasn't moved in six days."
  );
  db.prepare(`INSERT INTO chat_messages (user_id, who, text) VALUES (?, 'me', ?)`).run(luckyId, "Sort it out.");
  db.prepare(`INSERT INTO chat_messages (user_id, who, text) VALUES (?, 'ai', ?)`).run(luckyId, "Here's my plan. Nothing sends until you approve.");

  db.prepare(`INSERT INTO focus_sessions (user_id, label, total_seconds, seconds_left, running) VALUES (?, ?, 1500, 1500, 0)`).run(luckyId, "Deep work on the CELLUVIA dossier");

  console.log("Seeded workspace elongeva.orbit.app");
  console.log("Sign-in credentials (demo):");
  console.log("  Owner:  lucky@elongeva /", CREDS.lucky);
  console.log("  Editor: priya@elongeva /", CREDS.priya);
  console.log("  Editor: arjun@elongeva /", CREDS.arjun);
  console.log("  Viewer: kavya@elongeva /", CREDS.kavya, "(temp — must change on first sign-in)");
}

seed();
