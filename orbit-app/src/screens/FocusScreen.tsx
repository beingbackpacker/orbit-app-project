import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../theme/theme";
import { api } from "../api/client";

interface FocusState { label: string; totalSeconds: number; secondsLeft: number; running: boolean; clock: string; pct: number; }

const SIZE = 236, STROKE = 12, RADIUS = (SIZE - STROKE) / 2, CIRCUM = 2 * Math.PI * RADIUS;

export default function FocusScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [focus, setFocus] = useState<FocusState | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<FocusState>("/home/focus");
      setFocus(res);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    interval.current = setInterval(load, 1000);
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [load]));

  const toggle = async () => {
    if (focus && focus.secondsLeft <= 0) {
      const res = await api.post<FocusState>("/home/focus/reset");
      return setFocus(res);
    }
    const res = await api.post<FocusState>("/home/focus/toggle");
    setFocus(res);
  };

  if (!focus) return <View style={{ flex: 1, backgroundColor: colors.green }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.green, alignItems: "center", paddingTop: insets.top + 26, paddingBottom: insets.bottom + 30, paddingHorizontal: 24 }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase", color: "rgba(245,242,236,0.55)" }}>Focus session</Text>
      <Text style={{ fontFamily: fonts.serif, fontSize: 27, lineHeight: 32, color: colors.cream, marginTop: 14, textAlign: "center" }}>
        Deep work on the{"\n"}<Text style={{ fontStyle: "italic", color: colors.mint }}>CELLUVIA dossier</Text>
      </Text>

      <View style={{ marginTop: 34, width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
        <Svg width={SIZE} height={SIZE} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="rgba(245,242,236,0.14)" strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.mint} strokeWidth={STROKE} fill="none"
            strokeDasharray={`${CIRCUM}`} strokeDashoffset={CIRCUM * (1 - focus.pct / 100)} strokeLinecap="round"
          />
        </Svg>
        <View style={s.innerCircle}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 52, color: colors.cream }}>{focus.clock}</Text>
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(245,242,236,0.5)", marginTop: 10 }}>
            {focus.running ? "running · phone quiet" : "paused"}
          </Text>
        </View>
      </View>

      <Pressable onPress={toggle} style={s.cta}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 14.5, color: "#0F2A22" }}>
          {focus.running ? "Pause session" : focus.secondsLeft <= 0 ? "Start 25 minutes" : focus.secondsLeft < focus.totalSeconds ? "Resume" : "Start 25 minutes"}
        </Text>
      </Pressable>

      <View style={s.heldCard}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: colors.mint }}>Held for you</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 20, color: "rgba(245,242,236,0.72)", marginTop: 8 }}>
          6 notifications and 1 non-urgent mail are queued. Orbit will answer the two routine ones and show you the rest after.
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <Pressable onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate("Tabs"))}>
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: "rgba(245,242,236,0.5)", marginTop: 20 }}>End early</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  innerCircle: { position: "absolute", width: SIZE - 40, height: SIZE - 40, borderRadius: (SIZE - 40) / 2, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  cta: { marginTop: 32, minHeight: 54, width: "100%", borderRadius: 16, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  heldCard: { marginTop: 22, width: "100%", borderRadius: 16, backgroundColor: "rgba(245,242,236,0.08)", borderWidth: 1, borderColor: "rgba(245,242,236,0.14)", padding: 15 }
});
