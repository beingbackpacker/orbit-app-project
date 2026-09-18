import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toggle } from "../components/ui";
import { colors, fonts, radii } from "../theme/theme";
import { api } from "../api/client";

interface Reminder { id: string; icon: string; title: string; when_text: string; enabled: number; }

export default function RemindersScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ reminders: Reminder[] }>("/reminders");
      setReminders(res.reminders);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: r.enabled ? 0 : 1 } : r)));
    const res = await api.post<{ reminders: Reminder[] }>(`/reminders/${id}/toggle`);
    setReminders(res.reminders);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 26, paddingHorizontal: 20 }}>
      <Pressable onPress={() => nav.canGoBack() && nav.goBack()} style={{ marginBottom: 8 }}>
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: colors.mute }}>‹ Back</Text>
      </Pressable>
      <Text style={{ fontFamily: fonts.serif, fontSize: 32, color: colors.ink, paddingHorizontal: 4 }}>Reminders</Text>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: "#6E6A61", marginTop: 6, paddingHorizontal: 4 }}>
        Time, place and habit-based. Nothing leaves your phone.
      </Text>

      <View style={{ marginTop: 18, gap: 9 }}>
        {reminders.map((r) => {
          const on = !!r.enabled;
          return (
            <View key={r.id} style={s.row}>
              <View style={[s.iconBox, { backgroundColor: on ? colors.greenTint : colors.chipBg }]}>
                <Text style={{ fontSize: 15, color: on ? colors.green : "#A9A296" }}>{r.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 13.5, color: on ? colors.ink : "#A9A296" }}>{r.title}</Text>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.mute, marginTop: 4 }}>{r.when_text}</Text>
              </View>
              <Toggle on={on} onPress={() => toggle(r.id)} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 13, borderRadius: radii.lg, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, padding: 14 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" }
});
