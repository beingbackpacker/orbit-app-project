import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "../theme/theme";
import { api } from "../api/client";

interface Draft { label: string; body: string; }

export default function ComposeScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { mailId, from, subject } = route.params || {};
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!mailId) return;
    api.get<{ drafts: Draft[] }>(`/mail/${mailId}/drafts`).then((res) => setDrafts(res.drafts)).catch(() => {});
  }, [mailId]);

  const pick = (d: Draft) => { setBody(d.body); setTone(d.label); };

  const send = async () => {
    if (!body.trim() || sending || sent) return;
    setSending(true);
    try {
      await api.post(`/mail/${mailId}/send`, { body });
      setSent(true);
      setTimeout(() => (nav.canGoBack() ? nav.goBack() : nav.navigate("Tabs", { screen: "Mail" })), 700);
    } catch (e: any) {
      Alert.alert("Couldn't send", e.message || "Try again");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate("Tabs", { screen: "Mail" }))}>
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: colors.mute }}>‹ Inbox</Text>
          </Pressable>
          <Pressable onPress={send} disabled={!body.trim() || sending || sent}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: sent ? colors.mint : !body.trim() || sending ? "#A9A296" : colors.green }}>
              {sent ? "Sent ✓" : sending ? "Sending…" : "Send"}
            </Text>
          </Pressable>
        </View>

        <Text style={{ fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.ink, marginTop: 16 }}>
          Reply to <Text style={{ fontStyle: "italic", color: colors.green }}>{from || "…"}</Text>
        </Text>

        <View style={s.fieldGroup}>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>To</Text>
            <Text style={s.fieldValue}>{from}</Text>
          </View>
          <View style={[s.fieldRow, { borderTopWidth: 1, borderTopColor: "rgba(20,23,26,0.07)" }]}>
            <Text style={s.fieldLabel}>Subject</Text>
            <Text style={s.fieldValue} numberOfLines={1}>{subject && /^re:/i.test(subject) ? subject : `Re: ${subject || ""}`}</Text>
          </View>
        </View>

        <View style={s.bodyBox}>
          <TextInput
            value={body}
            onChangeText={(t) => { setBody(t); setTone(null); }}
            placeholder="Write your reply, or let Orbit draft it from the thread and your meeting notes."
            placeholderTextColor="#A9A296"
            multiline
            textAlignVertical="top"
            style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 23, color: "#26241F" }}
          />
        </View>

        <View style={s.draftPanel}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
            <View style={s.dot} />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: colors.mint }}>Draft with Orbit</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
            {drafts.map((d) => (
              <Pressable
                key={d.label}
                onPress={() => pick(d)}
                style={[s.toneChip, { backgroundColor: tone === d.label ? colors.mint : "rgba(245,242,236,0.08)", borderColor: tone === d.label ? colors.mint : "rgba(245,242,236,0.16)" }]}
              >
                <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12, color: tone === d.label ? "#0F2A22" : colors.cream }}>{d.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  fieldGroup: { marginTop: 18, borderRadius: 15, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  fieldRow: { backgroundColor: "#fff", paddingHorizontal: 15, paddingVertical: 14, flexDirection: "row", gap: 10 },
  fieldLabel: { fontFamily: fonts.sansSemibold, fontSize: 12.5, color: "#A9A296", width: 52 },
  fieldValue: { fontFamily: fonts.sansSemibold, fontSize: 12.5, color: colors.ink, flex: 1 },
  bodyBox: { marginTop: 12, flex: 1, borderRadius: 15, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, padding: 15, minHeight: 200 },
  draftPanel: { marginTop: 12, borderRadius: 15, backgroundColor: colors.ink, padding: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.mint },
  toneChip: { minHeight: 38, paddingHorizontal: 14, borderRadius: radii.md, borderWidth: 1, alignItems: "center", justifyContent: "center" }
});
