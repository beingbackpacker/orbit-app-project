import express from "express";
import cors from "cors";
import "./db";
import { authRouter } from "./routes/auth";
import { teamRouter } from "./routes/team";
import { tasksRouter } from "./routes/tasks";
import { calendarRouter } from "./routes/calendar";
import { meetingsRouter } from "./routes/meetings";
import { mailRouter } from "./routes/mail";
import { remindersRouter } from "./routes/reminders";
import { vaultRouter } from "./routes/vault";
import { homeRouter } from "./routes/home";
import { PORT } from "./env";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/team", teamRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/meetings", meetingsRouter);
app.use("/api/mail", mailRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/vault", vaultRouter);
app.use("/api/home", homeRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

app.listen(PORT, () => console.log(`Orbit backend listening on http://localhost:${PORT}`));
