import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Screen } from "../components/ui";
import { colors, fonts, radii } from "../theme/theme";
import { api } from "../api/client";

interface Busy { day: number; level: number; }
interface AgendaItem { time: string; title: string; sub: string; kind: "hot" | "green" | "soft"; meeting_id: string | null; }

const DAY_NAMES = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function buildCells(year: number, month: number, busy: Busy[], today: number) {
  const busyMap = Object.fromEntries(busy.map((b) => [b.day, b.level]));
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const offset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = i - offset + 1;
    const inMonth = d >= 1 && d <= daysInMonth;
    const isToday = inMonth && d === today;
    const level = inMonth ? busyMap[d] : undefined;
    cells.push({
      key: i, d: inMonth ? d : "",
      bg: isToday ? colors.ink : inMonth && level ? colors.chipBg : "transparent",
      fg: isToday ? colors.cream : inMonth ? "#3C3931" : "transparent",
      dot: isToday ? colors.mint : level === 3 ? colors.clay : level === 2 ? colors.green : level ? "#C9C2B4" : "transparent"
    });
  }
  return cells;
}

export default function CalendarScreen() {
  const nav = useNavigation<any>();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(8);
  const [busy, setBusy] = useState<Busy[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ busy: Busy[]; agenda: AgendaItem[] }>(`/calendar?year=${year}&month=${month}`);
      setBusy(res.busy);
      setAgenda(res.agenda);
    } catch {}
  }, [year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shiftMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m); setYear(y);
  };

  const today = year === 2026 && month === 8 ? 27 : 0;
  const cells = buildCells(year, month, busy, today);

  const onAgendaPress = (item: AgendaItem) => {
    if (item.kind === "hot" && item.meeting_id) nav.navigate("Meeting", { id: item.meeting_id });
    else if (item.kind === "green") nav.navigate("Focus");
  };

  return (
    <Screen>
      <View style={s.pad}>
        <View style={s.headerRow}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 32, color: colors.ink }}>
            {MONTH_NAMES[month - 1]} <Text style={{ fontStyle: "italic", color: colors.green }}>{year}</Text>
          </Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Pressable onPress={() => shiftMonth(-1)}><Text style={s.arrow}>‹</Text></Pressable>
            <Pressable onPress={() => shiftMonth(1)}><Text style={s.arrow}>›</Text></Pressable>
          </View>
        </View>

        <View style={s.grid}>
          <View style={s.gridRow}>
            {DAY_NAMES.map((d, i) => (
              <Text key={i} style={s.dayName}>{d}</Text>
            ))}
          </View>
          <View style={s.gridWrap}>
            {cells.map((c) => (
              <View key={c.key} style={[s.cell, { backgroundColor: c.bg }]}>
                <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12, color: c.fg }}>{c.d}</Text>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.dot }} />
              </View>
            ))}
          </View>
        </View>

        <Text style={s.sectionLabel}>{today ? "Thursday 27 · agenda" : "Agenda"}</Text>
        <View>
          {agenda.map((a, i) => {
            const bg = a.kind === "hot" ? colors.ink : a.kind === "green" ? colors.greenTint : "#fff";
            const bd = a.kind === "hot" ? colors.ink : a.kind === "green" ? colors.greenBorder : colors.border;
            const fg = a.kind === "hot" ? colors.cream : a.kind === "green" ? colors.green : colors.ink;
            const subFg = a.kind === "hot" ? "rgba(245,242,236,0.6)" : a.kind === "green" ? "#5C7A6D" : colors.mute;
            const line = a.kind === "hot" ? colors.clay : a.kind === "green" ? colors.green : "rgba(20,23,26,0.12)";
            return (
              <Pressable key={i} onPress={() => onAgendaPress(a)} style={{ flexDirection: "row", gap: 12 }}>
                <Text style={s.agendaTime}>{a.time}</Text>
                <View style={{ flex: 1, borderLeftWidth: 2, borderLeftColor: line, paddingLeft: 12, paddingBottom: 10 }}>
                  <View style={{ borderRadius: 13, backgroundColor: bg, borderWidth: 1, borderColor: bd, padding: 13 }}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: fg }}>{a.title}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11.5, color: subFg, marginTop: 4 }}>{a.sub}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          {agenda.length === 0 ? <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.mute, textAlign: "center", marginTop: 20 }}>Nothing scheduled.</Text> : null}
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 20, gap: 4 },
  headerRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 12 },
  arrow: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.mute },
  grid: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, padding: 12, paddingBottom: 8, marginBottom: 20 },
  gridRow: { flexDirection: "row", marginBottom: 6 },
  dayName: { flex: 1, textAlign: "center", fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 0.5, color: "#A9A296" },
  gridWrap: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 2 },
  sectionLabel: { fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 1.4, textTransform: "uppercase", color: colors.mute, marginBottom: 10, paddingHorizontal: 4 },
  agendaTime: { width: 46, fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.mute, textAlign: "right", paddingTop: 12 }
});
