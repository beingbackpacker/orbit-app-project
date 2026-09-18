CREATE TABLE IF NOT EXISTS workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  seat_limit INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')),
  must_change_password INTEGER NOT NULL DEFAULT 0,
  temp_password_expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT
);

CREATE TABLE IF NOT EXISTS scopes (
  user_id INTEGER NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK(category IN ('tasks','calendar','mail','vault')),
  granted INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, category)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  event TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  title TEXT NOT NULL,
  meta TEXT,
  urgent INTEGER NOT NULL DEFAULT 0,
  project TEXT,
  owner_user_id INTEGER REFERENCES users(id),
  done INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  text TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  icon TEXT,
  title TEXT NOT NULL,
  when_text TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mails (
  id TEXT PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  from_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  time_text TEXT NOT NULL,
  subject TEXT NOT NULL,
  snippet TEXT NOT NULL,
  tag TEXT NOT NULL,
  hot INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mail_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mail_id TEXT NOT NULL REFERENCES mails(id),
  tone_label TEXT NOT NULL,
  body TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  title TEXT NOT NULL,
  subtitle TEXT,
  when_text TEXT NOT NULL,
  location TEXT,
  prep_brief TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id TEXT NOT NULL REFERENCES meetings(id),
  initials TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meeting_agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id TEXT NOT NULL REFERENCES meetings(id),
  n TEXT NOT NULL,
  text TEXT NOT NULL,
  minutes TEXT,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meeting_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id TEXT NOT NULL REFERENCES meetings(id),
  text TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS calendar_busy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  level INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  sub TEXT,
  kind TEXT NOT NULL CHECK(kind IN ('hot','green','soft')),
  meeting_id TEXT REFERENCES meetings(id),
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_proposals (
  id TEXT PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  tag TEXT NOT NULL,
  title TEXT NOT NULL,
  why TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_proposal_state (
  user_id INTEGER NOT NULL REFERENCES users(id),
  proposal_id TEXT NOT NULL REFERENCES ai_proposals(id),
  state TEXT NOT NULL CHECK(state IN ('ok','no')),
  PRIMARY KEY (user_id, proposal_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER NOT NULL REFERENCES users(id),
  key TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  PRIMARY KEY (user_id, key)
);

CREATE TABLE IF NOT EXISTS vault_usage (
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  label TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  color_key TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  who TEXT NOT NULL CHECK(who IN ('me','ai')),
  text TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_plan_state (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  open INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  label TEXT NOT NULL DEFAULT 'Deep work on the CELLUVIA dossier',
  total_seconds INTEGER NOT NULL DEFAULT 1500,
  seconds_left INTEGER NOT NULL DEFAULT 1500,
  running INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
