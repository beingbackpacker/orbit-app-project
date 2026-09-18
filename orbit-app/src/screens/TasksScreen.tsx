import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, Card, Eyebrow, ProgressBar, Avatar } from "../components/ui";
import { colors, fonts, radii } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

interface Task {
  id: string; title: string; meta: string; urgent: boolean; project: string; done: boolean;
  ownerInitials: string; ownerName: string; steps: string[];
}

const OWNER_COLORS: Record<string, { bg: string; fg: string }> = {
  L: { bg: colors.ink, fg: colors.cream }, P: { bg: colors.mint, fg: "#0F2A22" },
  AR: { bg: colors.gold, fg: "#3A2E10" }, K: { bg: colors.peach, fg: "#4A2313" }
};

const FILTERS = ["Pending", "Completed", "All"] as const;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ tasks: Task[] }>("/tasks");
      setTasks(res.tasks);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    await api.post(`/tasks/${id}/toggle`);
  };

  const submitDraft = async () => {
    const title = draft.trim();
    if (!title) return setAdding(false);
    setDraft("");
    setAdding(false);
    const res = await api.post<{ tasks: Task[] }>("/tasks", { title });
    setTasks(res.tasks);
  };

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const shared = tasks.filter((t) => t.ownerName !== user?.userId);
  const visible = filter === "Pending" ? pending : filter === "Completed" ? done : tasks;
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  return (
    <Screen>
      <View style={s.pad}>
        <View style={s.headerRow}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 32, color: colors.ink }}>Tasks</Text>
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.mute }}>
            elongeva.orbit.app · {user?.role === "owner" ? "Owner" : "Editor"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={[s.statTile, { backgroundColor: "#fff", borderColor: colors.border }]}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.clay }}>{pending.length}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
          <View style={[s.statTile, { backgroundColor: colors.greenTint, borderColor: colors.greenBorder }]}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.green }}>{done.length}</Text>
            <Text style={[s.statLabel, { color: "#5C7A6D" }]}>Completed</Text>
          </View>
          <View style={[s.statTile, { backgroundColor: colors.ink, borderColor: colors.ink }]}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.cream }}>{shared.length}</Text>
            <Text style={[s.statLabel, { color: "rgba(245,242,236,0.5)" }]}>Shared</Text>
          </View>
        </View>

        <ProgressBar pct={pct} />
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: colors.mute, paddingHorizontal: 2 }}>
          {done.length} of {tasks.length} closed this week · {pct}%
        </Text>

        <View style={{ flexDirection: "row", gap: 7, paddingHorizontal: 2 }}>
          {FILTERS.map((f) => {
            const count = f === "Pending" ? pending.length : f === "Completed" ? done.length : tasks.length;
            const active = filter === f;
            return (
              <Pressable key={f} onPress={() => setFilter(f)} style={[s.filterChip, { backgroundColor: active ? colors.ink : "#fff", borderColor: active ? colors.ink : "rgba(20,23,26,0.10)" }]}>
                <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12, color: active ? colors.cream : "#6E6A61" }}>{f} {count}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 9 }}>
          {visible.map((t) => {
            const owner = OWNER_COLORS[t.ownerInitials] || OWNER_COLORS.L;
            const isMe = t.ownerName === user?.userId;
            const isExpanded = expanded === t.id && !t.done;
            return (
              <Card key={t.id}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <Pressable onPress={() => toggle(t.id)} style={[s.checkbox, { backgroundColor: t.done ? colors.green : "transparent", borderColor: t.done ? colors.green : "rgba(20,23,26,0.22)" }]}>
                    {t.done ? <Text style={{ color: "#fff", fontFamily: fonts.sansBold, fontSize: 13 }}>✓</Text> : null}
                  </Pressable>
                  <Pressable style={{ flex: 1 }} onPress={() => t.steps.length && setExpanded(isExpanded ? null : t.id)}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: t.done ? "#A9A296" : colors.ink, textDecorationLine: t.done ? "line-through" : "none" }}>{t.title}</Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      <View style={[s.metaChip, { backgroundColor: t.urgent && !t.done ? colors.clayTint : colors.chipBg }]}>
                        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: t.urgent && !t.done ? colors.clay : "#6E6A61" }}>{t.meta}</Text>
                      </View>
                      <View style={[s.metaChip, { backgroundColor: colors.chipBg }]}>
                        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: "#6E6A61" }}>{t.project}</Text>
                      </View>
                      <View style={s.ownerChip}>
                        <Avatar initials={t.ownerInitials} bg={owner.bg} fg={owner.fg} size={18} />
                        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 10.5, color: "#6E6A61" }}>{isMe ? "You" : `${capitalize(t.ownerName.split("@")[0])} · shared`}</Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
                {isExpanded ? (
                  <View style={s.breakdown}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: colors.green }}>Orbit broke this down</Text>
                    <View style={{ gap: 7, marginTop: 10 }}>
                      {t.steps.map((step) => (
                        <View key={step} style={{ flexDirection: "row", gap: 9, alignItems: "center" }}>
                          <View style={{ width: 16, height: 16, borderRadius: 5, borderWidth: 1.5, borderColor: "rgba(20,23,26,0.2)" }} />
                          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12.5, color: "#4A463F" }}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 22, color: colors.ink }}>Nothing here</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 19, color: colors.mute, marginTop: 8, textAlign: "center" }}>
              {filter === "Pending" ? "Every task is closed out. Orbit will surface tomorrow's at 7am." : "No completed tasks in this view yet."}
            </Text>
          </View>
        ) : null}

        {adding ? (
          <View style={s.addForm}>
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={submitDraft}
              placeholder="Send FSSAI docs to Priya before Friday 6pm"
              placeholderTextColor={colors.mute}
              style={{ flex: 1, fontFamily: fonts.sansSemibold, fontSize: 13.5, color: colors.ink }}
              returnKeyType="done"
            />
            <Pressable onPress={submitDraft} style={s.addSubmit}><Text style={{ color: "#fff", fontFamily: fonts.sansBold }}>Add</Text></Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setAdding(true)} style={s.addRow}>
            <View style={s.addIcon}><Text style={{ color: colors.cream, fontFamily: fonts.sansSemibold, fontSize: 17 }}>+</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 13.5, color: colors.ink }}>Add a task in plain words</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.mute, marginTop: 3 }}>"Send FSSAI docs to Priya before Friday 6pm"</Text>
            </View>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 20, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 4 },
  statTile: { flex: 1, borderRadius: radii.lg, borderWidth: 1, padding: 14 },
  statLabel: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: colors.mute, marginTop: 8 },
  filterChip: { minHeight: 34, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  metaChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  ownerChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingHorizontal: 8, paddingLeft: 4, borderRadius: 6, backgroundColor: colors.chipBg },
  breakdown: { marginTop: 13, paddingTop: 13, borderTopWidth: 1, borderTopColor: "rgba(20,23,26,0.07)" },
  empty: { borderRadius: radii.lg, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.borderSoft, padding: 26, alignItems: "center" },
  addRow: { borderRadius: radii.lg, borderWidth: 1.5, borderColor: "rgba(20,23,26,0.18)", borderStyle: "dashed", padding: 15, flexDirection: "row", gap: 12, alignItems: "center" },
  addIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  addForm: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  addSubmit: { minHeight: 34, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }
});
