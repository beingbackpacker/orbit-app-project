import React, { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Animated, Easing } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../components/ui";
import { colors, fonts, radii } from "../theme/theme";
import { api } from "../api/client";

interface Msg { who: "me" | "ai"; text: string; }
interface PlanStep { n: string; t: string; }

const SUGGESTIONS = ["What's the FSSAI status?", "Summarise this week", "Find me 2 free hours"];

function PulseDot() {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  return <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mint, transform: [{ scale }] }} />;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [plan, setPlan] = useState<PlanStep[]>([]);
  const [planOpen, setPlanOpen] = useState(true);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ messages: Msg[]; plan: PlanStep[]; planOpen: boolean }>("/home/chat");
      setMessages(res.messages);
      setPlan(res.plan);
      setPlanOpen(res.planOpen);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const decide = async (decision: "approve" | "reject") => {
    setPlanOpen(false);
    await api.post(`/home/chat/plan/${decision}`);
    load();
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    setInput("");
    setMessages((prev) => [...prev, { who: "me", text }]);
    await api.post("/home/chat/message", { text });
    load();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <Screen scroll={false}>
      <View style={s.header}>
        <View style={s.avatar}><PulseDot /></View>
        <View>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink }}>Orbit</Text>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: colors.mute, marginTop: 4 }}>Reads your day. Acts only with a yes.</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 12 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages.map((m, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: m.who === "me" ? "flex-end" : "flex-start" }}>
            <View style={[s.bubble, m.who === "me" ? s.bubbleMe : s.bubbleAi]}>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 21, color: m.who === "me" ? colors.cream : "#26241F" }}>{m.text}</Text>
            </View>
          </View>
        ))}
        {planOpen ? (
          <View style={s.planCard}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: colors.green }}>Will do 3 things — approve?</Text>
            <View style={{ gap: 8, marginTop: 11 }}>
              {plan.map((p) => (
                <View key={p.n} style={{ flexDirection: "row", gap: 9, alignItems: "baseline" }}>
                  <Text style={{ fontFamily: "ui-monospace" as any, fontSize: 10, color: "#A9A296" }}>{p.n}</Text>
                  <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 12.5, lineHeight: 18, color: "#3C3931" }}>{p.t}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 13 }}>
              <Pressable onPress={() => decide("approve")} style={s.approveBtn}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 12.5, color: "#fff" }}>Approve all</Text>
              </Pressable>
              <Pressable onPress={() => decide("reject")} style={s.rejectBtn}>
                <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 12.5, color: "#6E6A61" }}>Not now</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={s.inputArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 11 }}>
          {SUGGESTIONS.map((sg) => (
            <Pressable key={sg} onPress={() => send(sg)} style={s.suggestChip}>
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11.5, color: "#3C3931" }}>{sg}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={s.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            placeholder="Ask, or tell me what to do…"
            placeholderTextColor="#A9A296"
            style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.ink }}
            returnKeyType="send"
          />
          <Pressable onPress={() => send(input)} style={s.sendBtn}>
            <Text style={{ color: colors.cream, fontFamily: fonts.sansSemibold, fontSize: 15 }}>↑</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "82%", borderRadius: 16, padding: 14 },
  bubbleMe: { backgroundColor: colors.ink, borderBottomRightRadius: 5 },
  bubbleAi: { backgroundColor: "#fff", borderBottomLeftRadius: 5 },
  planCard: { borderRadius: radii.lg, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, padding: 15 },
  approveBtn: { flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  rejectBtn: { minHeight: 42, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: "rgba(20,23,26,0.14)", alignItems: "center", justifyContent: "center" },
  inputArea: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18, borderTopWidth: 1, borderTopColor: colors.border },
  suggestChip: { minHeight: 36, paddingHorizontal: 13, borderRadius: radii.pill, borderWidth: 1, borderColor: "rgba(20,23,26,0.14)", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  inputRow: { minHeight: 50, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(20,23,26,0.12)", flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 6, gap: 10 },
  sendBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }
});
