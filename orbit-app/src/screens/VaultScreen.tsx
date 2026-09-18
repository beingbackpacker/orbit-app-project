import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toggle } from "../components/ui";
import { colors, fonts, radii } from "../theme/theme";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Bar { label: string; pct: number; colorKey: string; }
interface Setting { id: string; title: string; sub: string; enabled: boolean; }

const COLOR_MAP: Record<string, string> = { mint: colors.mint, gold: colors.gold, peach: colors.peach, faint: "rgba(245,242,236,0.3)" };

export default function VaultScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [totalGb, setTotalGb] = useState("0");
  const [bars, setBars] = useState<Bar[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ totalGb: string; bars: Bar[]; settings: Setting[] }>("/vault");
      setTotalGb(res.totalGb);
      setBars(res.bars);
      setSettings(res.settings);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (id: string) => {
    if (id === "vault") return;
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
    await api.post(`/vault/settings/${id}/toggle`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 26, paddingHorizontal: 20 }}>
      <Pressable onPress={() => nav.canGoBack() && nav.goBack()} style={{ marginBottom: 8 }}>
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: colors.mute }}>‹ Back</Text>
      </Pressable>
      <Text style={{ fontFamily: fonts.serif, fontSize: 32, color: colors.ink, paddingHorizontal: 4 }}>Your data</Text>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 20, color: "#6E6A61", marginTop: 6, paddingHorizontal: 4 }}>
        Tasks, notes, mail drafts and research live in an encrypted vault on this device. Sync and AI processing are opt-in, per category.
      </Text>

      <View style={s.vaultCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <View>
            <Text style={{ fontFamily: fonts.serif, fontSize: 34, color: colors.cream }}>{totalGb} GB</Text>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(245,242,236,0.5)", marginTop: 8 }}>On-device vault · AES-256</Text>
          </View>
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.mint }}>Healthy</Text>
        </View>
        <View style={s.barTrack}>
          {bars.map((b, i) => (
            <View key={i} style={{ width: `${b.pct}%`, height: "100%", backgroundColor: COLOR_MAP[b.colorKey] || colors.mint }} />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          {bars.map((b, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: COLOR_MAP[b.colorKey] || colors.mint }} />
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 10.5, color: "rgba(245,242,236,0.6)" }}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 14, gap: 9 }}>
        {settings.map((st) => (
          <View key={st.id} style={s.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.ink }}>{st.title}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 17, color: colors.mute, marginTop: 4 }}>{st.sub}</Text>
            </View>
            <Toggle on={st.enabled} onPress={() => toggle(st.id)} />
          </View>
        ))}

        <View style={s.exportCard}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: colors.mute }}>Export</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
            <View style={s.exportBtn}><Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.ink }}>Encrypted archive</Text></View>
            <View style={s.exportBtn}><Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.ink }}>CSV / ICS</Text></View>
          </View>
        </View>

        <Pressable onPress={signOut} style={s.signOutBtn}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.clay }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  vaultCard: { marginTop: 16, borderRadius: radii.xl, backgroundColor: colors.ink, padding: 17 },
  barTrack: { flexDirection: "row", height: 8, borderRadius: 5, overflow: "hidden", marginTop: 15 },
  settingRow: { flexDirection: "row", gap: 13, alignItems: "center", borderRadius: radii.lg, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, padding: 14 },
  exportCard: { borderRadius: radii.lg, backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.borderSoft, padding: 15 },
  exportBtn: { minHeight: 38, paddingHorizontal: 14, borderRadius: 11, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(20,23,26,0.12)", alignItems: "center", justifyContent: "center" },
  signOutBtn: { minHeight: 50, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" }
});
