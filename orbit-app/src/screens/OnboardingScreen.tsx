import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts, radii } from "../theme/theme";
import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  {
    glyph: "◐", title: "One place for the whole day.",
    body: "Tasks, meetings, mail and reminders stop living in four apps. Orbit merges them and tells you what actually matters next.",
    cta: "Continue",
    rows: [{ icon: "✓", label: "Tasks & reminders", state: "ready" }, { icon: "▤", label: "Calendar", state: "ready" }, { icon: "✉", label: "Mail", state: "ready" }]
  },
  {
    glyph: "◒", title: "Connect what you already use.",
    body: "Read-only to start. Orbit never sends anything without your approval — you'll see every action before it happens.",
    cta: "Connect",
    rows: [{ icon: "G", label: "Google Calendar", state: "linked" }, { icon: "✉", label: "Gmail", state: "linked" }, { icon: "◍", label: "Apple Reminders", state: "skip" }]
  },
  {
    glyph: "◓", title: "Your data stays yours.",
    body: "Everything is written to an encrypted vault on this device. Cloud sync is opt-in, per category, and you can export or wipe it anytime.",
    cta: "Enter Orbit",
    rows: [{ icon: "◈", label: "On-device vault", state: "on" }, { icon: "↑", label: "Cloud sync", state: "off" }, { icon: "◎", label: "AI on-device first", state: "on" }]
  }
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  const finish = async () => {
    await completeOnboarding();
    nav.replace("Tabs");
  };

  const next = () => (step < 2 ? setStep(step + 1) : finish());

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 34, paddingHorizontal: 26 }}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 34 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ height: 3, flex: 1, borderRadius: 2, backgroundColor: i <= step ? colors.ink : "rgba(20,23,26,0.14)" }} />
        ))}
      </View>
      <View style={styles.glyphBox}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 34, color: colors.cream }}>{s.glyph}</Text>
      </View>
      <Text style={{ fontFamily: fonts.serif, fontSize: 40, lineHeight: 42, color: colors.ink, letterSpacing: -0.3 }}>{s.title}</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 24, color: "#5F5B53", marginTop: 14 }}>{s.body}</Text>

      <View style={{ marginTop: 26, gap: 9 }}>
        {s.rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <View style={styles.rowIcon}><Text style={{ fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.green }}>{r.icon}</Text></View>
            <Text style={{ flex: 1, fontFamily: fonts.sansSemibold, fontSize: 13.5, color: colors.ink }}>{r.label}</Text>
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: colors.green }}>{r.state}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Button label={s.cta} variant="dark" onPress={next} style={{ marginTop: 28 }} />
      <Pressable onPress={finish}>
        <Text style={{ textAlign: "center", marginTop: 14, fontFamily: fonts.sansSemibold, fontSize: 12.5, color: colors.mute }}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  glyphBox: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", marginBottom: 26 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 16, borderRadius: 15, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  rowIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.greenTint, alignItems: "center", justifyContent: "center" }
});
