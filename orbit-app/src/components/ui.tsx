import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp, TextStyle, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "../theme/theme";

export function Screen({
  children, bg = colors.cream, scroll = true, style
}: { children: React.ReactNode; bg?: string; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? { contentContainerStyle: [{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 26 }, style] }
    : { style: [{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }, style] };
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Container {...(containerProps as any)}>{children}</Container>
    </View>
  );
}

export function Card({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function DarkCard({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[s.darkCard, style]}>{children}</View>;
}

export function Eyebrow({ children, color = colors.mute, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.eyebrow, { color }, style]}>{children}</Text>;
}

export function SerifTitle({ children, size = 32, style, color = colors.ink }: { children: React.ReactNode; size?: number; style?: StyleProp<TextStyle>; color?: string }) {
  return <Text style={[{ fontFamily: fonts.serif, fontSize: size, color, lineHeight: size * 1.12 }, style]}>{children}</Text>;
}

export function Button({
  label, onPress, variant = "primary", style, disabled
}: { label: string; onPress?: () => void; variant?: "primary" | "dark" | "outline"; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const bg = variant === "primary" ? colors.mint : variant === "dark" ? colors.ink : "transparent";
  const fg = variant === "primary" ? "#0F2A22" : variant === "dark" ? colors.cream : colors.mute;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.button, { backgroundColor: bg, opacity: disabled ? 0.5 : 1, borderWidth: variant === "outline" ? 1 : 0, borderColor: "rgba(20,23,26,0.14)" }, style]}
    >
      <Text style={[s.buttonLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ on, onPress }: { on: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.toggleTrack, { backgroundColor: on ? colors.green : "rgba(20,23,26,0.16)", justifyContent: on ? "flex-end" : "flex-start" }]}>
      <View style={s.toggleKnob} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress, tone = "default" }: { label: string; active?: boolean; onPress?: () => void; tone?: "default" | "clay" | "green" }) {
  const bg = active ? colors.ink : "#fff";
  const fg = active ? colors.cream : colors.mute;
  return (
    <Pressable onPress={onPress} style={[s.chip, { backgroundColor: bg, borderColor: active ? colors.ink : "rgba(20,23,26,0.10)" }]}>
      <Text style={[s.chipLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({ initials, bg = colors.ink, fg = colors.cream, size = 36 }: { initials: string; bg?: string; fg?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: size * 0.34, color: fg }}>{initials}</Text>
    </View>
  );
}

export function ProgressBar({ pct, color = colors.green, bg = "#E4E0D7" }: { pct: number; color?: string; bg?: string }) {
  return (
    <View style={{ height: 7, borderRadius: 5, backgroundColor: bg, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color }} />
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: radii.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 15 },
  darkCard: { borderRadius: radii.xl, backgroundColor: colors.ink, padding: 17 },
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 1.4, textTransform: "uppercase" },
  button: { minHeight: 52, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  buttonLabel: { fontFamily: fonts.sansBold, fontSize: 14 },
  toggleTrack: { width: 48, height: 28, borderRadius: 999, padding: 3, flexDirection: "row", alignItems: "center" },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  chip: { minHeight: 34, paddingHorizontal: 14, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  chipLabel: { fontFamily: fonts.sansSemibold, fontSize: 12 }
});
