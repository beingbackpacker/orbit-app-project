import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../theme/theme";
import { applyKey, initialCalcState, BASIC_KEYS, SCIENTIFIC_KEYS, daysBetween, CalcState } from "../utils/calculator";

type Mode = "Basic" | "Scientific" | "Time" | "Cost";
const MODES: Mode[] = ["Basic", "Scientific", "Time", "Cost"];

const FROM_DATE = new Date(2026, 7, 27);
const TO_DATE = new Date(2026, 10, 1);

export default function CalculatorScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("Basic");
  const [calc, setCalc] = useState<CalcState>(initialCalcState);

  const press = (k: string) => setCalc((s) => applyKey(s, k));

  const keys = mode === "Scientific" ? SCIENTIFIC_KEYS : BASIC_KEYS;
  const cols = mode === "Scientific" ? 5 : 4;
  const sci = mode === "Scientific";

  const time = useMemo(() => daysBetween(FROM_DATE, TO_DATE), []);
  const cost = useMemo(() => {
    const attendees = 4, minutes = 45, rate = 3200;
    const total = Math.round((minutes / 60) * rate * attendees);
    return { attendees, minutes, rate, total };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20, paddingHorizontal: 18 }}>
      <Pressable onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate("Tabs"))} style={{ marginBottom: 10 }}>
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: "rgba(245,242,236,0.55)" }}>‹ Back</Text>
      </Pressable>

      <View style={s.modeTabs}>
        {MODES.map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[s.modeTab, { backgroundColor: mode === m ? colors.cream : "transparent" }]}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: mode === m ? colors.ink : "rgba(245,242,236,0.55)" }}>{m}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "Basic" || mode === "Scientific" ? (
        <>
          <View style={{ flex: 1, justifyContent: "flex-end", paddingVertical: 20, minHeight: 130 }}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: "rgba(245,242,236,0.4)", textAlign: "right", minHeight: 16 }}>{calc.expr}</Text>
            <Text style={{ fontFamily: fonts.serif, fontSize: 58, color: colors.cream, textAlign: "right", marginTop: 8 }} numberOfLines={1} adjustsFontSizeToFit>{calc.display}</Text>
          </View>
          <View style={s.grid}>
            {keys.map((k) => {
              const isOp = ["÷", "×", "−", "+", "="].includes(k);
              const isFn = !/^[0-9.]$/.test(k) && !isOp;
              const bg = k === "=" ? colors.mint : isOp ? "rgba(143,211,182,0.16)" : isFn ? "rgba(245,242,236,0.09)" : "rgba(245,242,236,0.14)";
              const fg = k === "=" ? "#0F2A22" : isOp ? colors.mint : isFn ? "rgba(245,242,236,0.75)" : colors.cream;
              return (
                <Pressable key={k} onPress={() => press(k)} style={[s.key, { width: `${100 / cols - 2}%`, height: sci ? 52 : 62, backgroundColor: bg }]}>
                  <Text style={{ fontFamily: fonts.sansSemibold, fontSize: sci ? 15 : 20, color: fg }}>{k}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {mode === "Time" ? (
        <View style={{ paddingTop: 22 }}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 26, color: colors.cream }}>Days between</Text>
          <View style={{ gap: 9, marginTop: 18 }}>
            <View style={s.timeField}>
              <Text style={s.timeLabel}>From</Text>
              <Text style={s.timeValue}>27 Aug 2026</Text>
            </View>
            <View style={s.timeField}>
              <Text style={s.timeLabel}>To</Text>
              <Text style={s.timeValue}>01 Nov 2026 · FSSAI deadline</Text>
            </View>
          </View>
          <View style={s.resultCard}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 54, color: "#0F2A22" }}>{time.totalDays} days</Text>
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: "#0F2A22", marginTop: 8 }}>
              {time.weeks} weeks {time.remDays} days · {time.workingDays} working days · {time.sprints} sprints of 15
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 20, color: "rgba(245,242,236,0.55)", marginTop: 14 }}>
            Also does dose intervals, hours between timestamps, and adding working days to a date.
          </Text>
        </View>
      ) : null}

      {mode === "Cost" ? (
        <View style={{ paddingTop: 22 }}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 26, color: colors.cream }}>What this meeting costs</Text>
          <View style={{ gap: 9, marginTop: 18 }}>
            {[
              { label: "Attendees", val: String(cost.attendees) },
              { label: "Duration", val: `${cost.minutes} min` },
              { label: "Blended rate", val: `₹ ${cost.rate.toLocaleString("en-IN")}/hr` }
            ].map((row) => (
              <View key={row.label} style={s.costRow}>
                <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 13, color: "rgba(245,242,236,0.7)" }}>{row.label}</Text>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.cream }}>{row.val}</Text>
              </View>
            ))}
          </View>
          <View style={[s.resultCard, { backgroundColor: colors.clay }]}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 52, color: "#fff" }}>₹ {cost.total.toLocaleString("en-IN")}</Text>
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: "#fff", opacity: 0.9, marginTop: 8 }}>
              {cost.minutes} min × {cost.attendees} people. Orbit suggests cutting to 25 min — agenda item 3 can be a note.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  modeTabs: { flexDirection: "row", gap: 5, backgroundColor: "rgba(245,242,236,0.07)", borderRadius: 12, padding: 4 },
  modeTab: { flex: 1, minHeight: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: "2%", rowGap: 8 },
  key: { borderRadius: 16, alignItems: "center", justifyContent: "center" },
  timeField: { borderRadius: 14, backgroundColor: "rgba(245,242,236,0.07)", borderWidth: 1, borderColor: "rgba(245,242,236,0.12)", padding: 14 },
  timeLabel: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(245,242,236,0.45)" },
  timeValue: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.cream, marginTop: 8 },
  resultCard: { marginTop: 20, borderRadius: 18, backgroundColor: colors.mint, padding: 20 },
  costRow: { borderRadius: 14, backgroundColor: "rgba(245,242,236,0.07)", borderWidth: 1, borderColor: "rgba(245,242,236,0.12)", padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }
});
