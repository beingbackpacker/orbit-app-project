import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Screen, Avatar } from "../components/ui";
import { colors, fonts, radii } from "../theme/theme";
import { api } from "../api/client";

interface Mail {
  id: string; from_name: string; initials: string; time_text: string; subject: string;
  snippet: string; tag: string; hot: number;
}

export default function InboxScreen() {
  const nav = useNavigation<any>();
  const [mails, setMails] = useState<Mail[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ mails: Mail[] }>("/mail");
      setMails(res.mails);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const decisionsNeeded = mails.filter((m) => m.hot).length;
  const drafted = mails.filter((m) => m.tag === "Reply drafted").length;

  return (
    <Screen>
      <View style={s.pad}>
        <View style={s.headerRow}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 32, color: colors.ink }}>Inbox</Text>
          <Pressable onPress={() => nav.navigate("Compose", { mailId: mails[0]?.id, from: mails[0]?.from_name.split(" ")[0], subject: mails[0]?.subject })} style={s.composeBtn}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: colors.cream }}>Compose</Text>
          </Pressable>
        </View>

        <View style={s.triageCard}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: colors.mint }}>Triaged for you</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 12.8, lineHeight: 20, color: "rgba(245,242,236,0.75)", marginTop: 8 }}>
            {mails.length} mails arrived overnight. {decisionsNeeded} need a decision from you, {drafted} has a reply drafted, the rest are filed.
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {mails.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => nav.navigate("Compose", { mailId: m.id, from: m.from_name.split(" ")[0], subject: m.subject })}
              style={[s.mailCard, { backgroundColor: m.hot ? "#fff" : colors.cardAlt, borderColor: m.hot ? "rgba(20,23,26,0.12)" : colors.borderSoft }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Avatar initials={m.initials} bg={m.hot ? colors.ink : "#E4E0D7"} fg={m.hot ? colors.cream : "#6E6A61"} size={30} />
                <Text style={{ flex: 1, fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink }} numberOfLines={1}>{m.from_name}</Text>
                <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 10.5, color: "#A9A296" }}>{m.time_text}</Text>
              </View>
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.ink, marginTop: 9 }}>{m.subject}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: "#6E6A61", marginTop: 4 }} numberOfLines={1}>{m.snippet}</Text>
              <View style={{ flexDirection: "row", gap: 7, marginTop: 10 }}>
                <View style={[s.tag, { backgroundColor: m.hot ? colors.clayTint : "#EAE6DE" }]}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase", color: m.hot ? colors.clay : colors.mute }}>{m.tag}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 20, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 4 },
  composeBtn: { minHeight: 38, paddingHorizontal: 15, borderRadius: 11, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  triageCard: { borderRadius: radii.lg, backgroundColor: colors.ink, padding: 14 },
  mailCard: { borderRadius: 15, borderWidth: 1, padding: 14 },
  tag: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7 }
});
