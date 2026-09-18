import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "../theme/theme";
import { Avatar } from "../components/ui";
import { api } from "../api/client";

interface Meeting {
  id: string; title: string; subtitle: string; when_text: string; location: string;
  prep_brief: string; notes: string; attendees: string[];
  agenda: { n: string; text: string; minutes: string }[]; actions: string[];
}

const ATTENDEE_COLORS = [colors.mint, colors.gold, colors.peach, "#C9C2B4"];

export default function MeetingScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [actionsOut, setActionsOut] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const load = useCallback(async () => {
    if (!route.params?.id) return;
    try {
      const res = await api.get<{ meeting: Meeting }>(`/meetings/${route.params.id}`);
      setMeeting(res.meeting);
    } catch {}
  }, [route.params?.id]);

  useEffect(() => { load(); }, [load]);

  const extract = async () => {
    if (!meeting) return;
    if (actionsOut) return setActionsOut(false);
    const res = await api.post<{ addedCount: number }>(`/meetings/${meeting.id}/extract-actions`);
    setAddedCount(res.addedCount);
    setActionsOut(true);
  };

  if (!meeting) return <View style={{ flex: 1, backgroundColor: colors.ink }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ backgroundColor: colors.ink, paddingTop: insets.top + 12, paddingBottom: 22, paddingHorizontal: 20 }}>
        <Pressable onPress={() => nav.canGoBack() ? nav.goBack() : nav.navigate("Calendar")}>
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12, color: "rgba(245,242,236,0.55)" }}>‹ Calendar</Text>
        </Pressable>
        <Text style={{ fontFamily: fonts.serif, fontSize: 28, lineHeight: 32, marginTop: 14, color: colors.cream }}>
          {meeting.title}{"\n"}<Text style={{ fontStyle: "italic", color: colors.mint }}>{meeting.subtitle}</Text>
        </Text>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12.5, color: "rgba(245,242,236,0.6)", marginTop: 9 }}>
          {meeting.when_text} · {meeting.location}
        </Text>
        <View style={{ flexDirection: "row", marginTop: 15 }}>
          {meeting.attendees.map((a, i) => (
            <View key={i} style={{ marginRight: -8 }}>
              <Avatar initials={a} bg={ATTENDEE_COLORS[i % ATTENDEE_COLORS.length]} fg="#0F2A22" size={34} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
          <View style={s.joinBtn}><Text style={{ fontFamily: fonts.sansBold, fontSize: 13.5, color: "#0F2A22" }}>Join now</Text></View>
          <View style={s.notesBtn}><Text style={{ fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.cream }}>Notes</Text></View>
        </View>
      </View>

      <View style={{ padding: 20, gap: 12 }}>
        <View style={s.briefCard}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: colors.green }}>Prep brief · auto-written</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 12.8, lineHeight: 20, color: "#31473E", marginTop: 9 }}>{meeting.prep_brief}</Text>
        </View>

        <View style={s.card}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: colors.mute }}>Agenda</Text>
          <View style={{ gap: 11, marginTop: 11 }}>
            {meeting.agenda.map((a) => (
              <View key={a.n} style={{ flexDirection: "row", gap: 11, alignItems: "baseline" }}>
                <Text style={{ fontFamily: "ui-monospace" as any, fontSize: 10.5, color: "#A9A296" }}>{a.n}</Text>
                <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: "#3C3931" }}>{a.text}</Text>
                <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 10.5, color: colors.mute }}>{a.minutes}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: colors.mute }}>Notes</Text>
            <Pressable onPress={extract} style={s.extractBtn}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.cream }}>{actionsOut ? "Actions pulled ✓" : "Pull action items"}</Text>
            </Pressable>
          </View>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: "#3C3931", marginTop: 11 }}>{meeting.notes}</Text>
          {actionsOut ? (
            <View style={{ marginTop: 13, paddingTop: 13, borderTopWidth: 1, borderTopColor: "rgba(20,23,26,0.07)", gap: 8 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: colors.green }}>{addedCount} action items added to Tasks</Text>
              {meeting.actions.map((t) => (
                <View key={t} style={{ flexDirection: "row", gap: 9, alignItems: "center" }}>
                  <View style={s.checkGlyph}><Text style={{ color: "#fff", fontFamily: fonts.sansBold, fontSize: 10 }}>✓</Text></View>
                  <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: "#31473E", flex: 1 }}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  joinBtn: { flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  notesBtn: { minHeight: 46, paddingHorizontal: 18, borderRadius: 13, borderWidth: 1, borderColor: "rgba(245,242,236,0.22)", alignItems: "center", justifyContent: "center" },
  briefCard: { borderRadius: radii.xl, backgroundColor: colors.greenTint, borderWidth: 1, borderColor: colors.greenBorder, padding: 15 },
  card: { borderRadius: radii.xl, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, padding: 15 },
  extractBtn: { minHeight: 32, paddingHorizontal: 12, borderRadius: 9, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  checkGlyph: { width: 18, height: 18, borderRadius: 6, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" }
});
