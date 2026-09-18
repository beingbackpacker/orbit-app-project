import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Easing } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Screen, Card, DarkCard, Eyebrow, Avatar, Button } from "../components/ui";
import { colors, fonts, radii } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

interface Proposal { id: string; tag: string; title: string; why: string; state: "ok" | "no" | null; }
interface Task { id: string; title: string; done: boolean; meta: string; urgent: boolean; ownerInitials: string; }
interface AgendaItem { time: string; title: string; sub: string; kind: string; meeting_id: string | null; }

const TAG_COLOR: Record<string, string> = { Reschedule: colors.mint, Draft: colors.gold, Protect: colors.peach };

function PulseDot() {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.5] });
  return <Animated.View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.mint, transform: [{ scale }], opacity }} />;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const nav = useNavigation<any>();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [mailCount, setMailCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [p, t, cal, mail, rem] = await Promise.all([
        api.get<{ proposals: Proposal[] }>("/home/proposals"),
        api.get<{ tasks: Task[] }>("/tasks"),
        api.get<{ agenda: AgendaItem[] }>("/calendar"),
        api.get<{ mails: any[] }>("/mail").catch(() => ({ mails: [] })),
        api.get<{ reminders: any[] }>("/reminders")
      ]);
      setProposals(p.proposals);
      setTasks(t.tasks.slice(0, 4));
      setAgenda(cal.agenda);
      setMailCount(mail.mails.filter((m) => m.hot).length);
      setReminderCount(rem.reminders.filter((r) => r.enabled).length);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const decide = async (id: string, decision: "ok" | "no") => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, state: decision } : p)));
    await api.post(`/home/proposals/${id}/decide`, { decision });
  };

  const toggleTask = async (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    await api.post(`/tasks/${id}/toggle`);
  };

  const pendingCount = proposals.filter((p) => !p.state).length;
  const nextMeeting = agenda.find((a) => a.kind === "hot");

  return (
    <Screen>
      <View style={s.pad}>
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => nav.navigate("Calendar")}>
              <Eyebrow>Thursday, 27 Aug ›</Eyebrow>
            </Pressable>
            <Text style={{ fontFamily: fonts.serif, fontSize: 33, color: colors.ink, marginTop: 7 }}>
              Good morning, <Text style={{ fontStyle: "italic", color: colors.green }}>{user?.name.split(" ")[0]}</Text>
            </Text>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: "#6E6A61", marginTop: 5 }}>
              {tasks.filter((t) => !t.done).length} tasks · {agenda.length} meetings · {mailCount} mails need you
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <Pressable onPress={() => nav.navigate("Calculator")} style={s.iconBtn}>
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.ink }}>÷</Text>
            </Pressable>
            <Pressable onPress={() => nav.navigate("Tabs", { screen: "Team" })} style={{ alignItems: "flex-end", gap: 6 }}>
              <Avatar initials={user?.initials || "?"} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: colors.mute }}>
                {user?.role === "owner" ? "Owner" : "Editor"}
              </Text>
            </Pressable>
          </View>
        </View>

        <DarkCard style={{ marginTop: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
            <PulseDot />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.mint }}>Orbit proposes</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, color: "rgba(245,242,236,0.5)" }}>
              {pendingCount ? `${pendingCount} pending` : "all clear"}
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.serif, fontSize: 20, lineHeight: 26, marginTop: 11, color: colors.cream }}>
            Three things I'd do next. Approve and I'll handle them.
          </Text>
          <View style={{ gap: 8, marginTop: 13 }}>
            {proposals.map((p) => (
              <View key={p.id} style={s.proposal}>
                <View style={{ flexDirection: "row", gap: 9, alignItems: "baseline" }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: TAG_COLOR[p.tag] || colors.mint }}>{p.tag}</Text>
                  <Text style={{ flex: 1, fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.cream }}>{p.title}</Text>
                </View>
                <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 16, color: "rgba(245,242,236,0.6)", marginTop: 5 }}>{p.why}</Text>
                {!p.state ? (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 11 }}>
                    <Pressable onPress={() => decide(p.id, "ok")} style={s.approveBtn}>
                      <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: "#0F2A22" }}>Approve</Text>
                    </Pressable>
                    <Pressable onPress={() => decide(p.id, "no")} style={s.skipBtn}>
                      <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12, color: "rgba(245,242,236,0.7)" }}>Skip</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={{ marginTop: 10, fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: p.state === "ok" ? colors.mint : "rgba(245,242,236,0.45)" }}>
                    {p.state === "ok" ? "✓ Done — calendar updated" : "Skipped · I'll stop suggesting this"}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </DarkCard>

        {nextMeeting ? (
          <Pressable onPress={() => nav.navigate("Meeting", { id: nextMeeting.meeting_id })} style={{ marginTop: 14 }}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Eyebrow>Next meeting</Eyebrow>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, color: colors.clay }}>at {nextMeeting.time}</Text>
              </View>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, marginTop: 9 }}>{nextMeeting.title}</Text>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12.5, color: "#6E6A61", marginTop: 5 }}>{nextMeeting.sub}</Text>
              <View style={{ flexDirection: "row", gap: 7, marginTop: 13 }}>
                <View style={s.tagDark}><Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: "#fff" }}>Join</Text></View>
                <View style={s.tagLight}><Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.ink }}>Agenda ready ✓</Text></View>
              </View>
            </Card>
          </Pressable>
        ) : null}

        <Card style={{ marginTop: 14, paddingBottom: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Eyebrow>Today's tasks</Eyebrow>
            <Pressable onPress={() => nav.navigate("Tabs", { screen: "Tasks" })}>
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11.5, color: colors.green }}>All →</Text>
            </Pressable>
          </View>
          <View style={{ marginTop: 6 }}>
            {tasks.map((t) => (
              <View key={t.id} style={s.taskRow}>
                <Pressable onPress={() => toggleTask(t.id)} style={[s.checkbox, { backgroundColor: t.done ? colors.green : "transparent", borderColor: t.done ? colors.green : "rgba(20,23,26,0.22)" }]}>
                  {t.done ? <Text style={{ color: "#fff", fontFamily: fonts.sansBold, fontSize: 12 }}>✓</Text> : null}
                </Pressable>
                <Text style={{ flex: 1, fontFamily: fonts.sansSemibold, fontSize: 13.5, color: t.done ? "#A9A296" : colors.ink, textDecorationLine: t.done ? "line-through" : "none" }}>{t.title}</Text>
                <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, color: t.urgent && !t.done ? colors.clay : colors.mute }}>{t.meta}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
          <Pressable onPress={() => nav.navigate("Tabs", { screen: "Mail" })} style={{ flex: 1 }}>
            <Card style={{ borderRadius: radii.xl }}>
              <Text style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.ink }}>{mailCount}</Text>
              <Text style={s.tileLabel}>Mail needing{"\n"}a reply</Text>
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11.5, color: colors.clay, marginTop: 9 }}>1 drafted for you</Text>
            </Card>
          </Pressable>
          <Pressable onPress={() => nav.navigate("Reminders")} style={{ flex: 1 }}>
            <View style={[s.tile, { backgroundColor: colors.greenTint, borderColor: colors.greenBorder }]}>
              <Text style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.green }}>{reminderCount}</Text>
              <Text style={[s.tileLabel, { color: "#5C7A6D" }]}>Reminders{"\n"}set today</Text>
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11.5, color: colors.green, marginTop: 9 }}>Next: 14:00 dose log</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingHorizontal: 4 },
  proposal: { borderRadius: 14, backgroundColor: "rgba(245,242,236,0.07)", borderWidth: 1, borderColor: "rgba(245,242,236,0.12)", padding: 13 },
  approveBtn: { flex: 1, minHeight: 38, borderRadius: 11, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  skipBtn: { minHeight: 38, paddingHorizontal: 16, borderRadius: 11, borderWidth: 1, borderColor: "rgba(245,242,236,0.22)", alignItems: "center", justifyContent: "center" },
  tagDark: { minHeight: 36, paddingHorizontal: 15, borderRadius: 10, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  tagLight: { minHeight: 36, paddingHorizontal: 15, borderRadius: 10, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, borderBottomWidth: 1, borderBottomColor: "rgba(20,23,26,0.06)" },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  tile: { borderRadius: 18, borderWidth: 1, padding: 15 },
  iconBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  tileLabel: { fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: colors.mute, marginTop: 7, lineHeight: 14 }
});
