import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Screen, Avatar, Eyebrow } from "../components/ui";
import { colors, fonts, radii } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

interface Scope { category: string; label: string; granted: boolean; }
interface Member { id: number; userId: string; name: string; initials: string; role: string; you: boolean; status: string; activity: string; action: string; scopes: Scope[]; }
interface TeamData { workspaceDomain: string; seatLine: string; isOwner: boolean; members: Member[]; auditLog: { ts: string; event: string }[]; }
interface NewCreds { userId: string; tempPassword: string; scope: string; expiresAt: string; }

const ROLE_COLORS: Record<string, { bg: string; fg: string }> = {
  Owner: { bg: colors.greenTint, fg: colors.green }, Editor: { bg: colors.chipBg, fg: "#6E6A61" }, Viewer: { bg: colors.clayTint, fg: colors.clay }
};

export default function TeamScreen() {
  const nav = useNavigation<any>();
  const { user, signOut } = useAuth();
  const [data, setData] = useState<TeamData | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [creds, setCreds] = useState<NewCreds | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<TeamData>("/team");
      setData(res);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitCreate = async () => {
    const n = name.trim();
    if (!n) return;
    try {
      const res = await api.post<NewCreds>("/team/users", { name: n, scopes: ["tasks", "calendar"] });
      setCreds(res);
      setName("");
      setCreating(false);
      load();
    } catch (e: any) {
      Alert.alert("Couldn't issue credentials", e.message || "Try again");
    }
  };

  const toggleScope = async (member: Member, category: string) => {
    if (!data?.isOwner || member.you) return;
    setData((d) => d ? { ...d, members: d.members.map((m) => m.id === member.id ? { ...m, scopes: m.scopes.map((s) => s.category === category ? { ...s, granted: !s.granted } : s) } : m) } : d);
    try {
      await api.post("/team/scopes", { memberId: member.id, category });
    } finally {
      load();
    }
  };

  const doAction = async (m: Member) => {
    if (!data?.isOwner || m.you) return;
    try {
      if (m.action === "Revoke") await api.post(`/team/users/${m.id}/revoke`);
      else if (m.action === "Resend") {
        const res = await api.post<NewCreds>(`/team/users/${m.id}/resend`);
        setCreds({ ...res, scope: "" });
      }
    } finally {
      load();
    }
  };

  if (!data) return <Screen><View /></Screen>;

  return (
    <Screen>
      <View style={s.pad}>
        <View>
          <Text style={{ fontFamily: fonts.serif, fontSize: 32, color: colors.ink }}>Team & access</Text>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.mute, marginTop: 8 }}>
            {data.workspaceDomain} · {data.isOwner ? "Owner" : "Editor"}
          </Text>
        </View>

        {data.isOwner ? (
          <View style={s.ownerCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: colors.mint }}>Owner console · data hub</Text>
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, color: "rgba(245,242,236,0.5)" }}>{data.seatLine}</Text>
            </View>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 20, color: "rgba(245,242,236,0.68)", marginTop: 9 }}>
              You hold the workspace vault. Issue a user ID and temporary password, choose what that person can see, and revoke it in one tap.
            </Text>

            {creating ? (
              <View style={s.createForm}>
                <TextInput
                  autoFocus
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name, e.g. Meera Iyer"
                  placeholderTextColor="rgba(245,242,236,0.35)"
                  onSubmitEditing={submitCreate}
                  style={{ flex: 1, fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.cream }}
                />
                <Pressable onPress={submitCreate} style={s.createSubmit}><Text style={{ color: "#0F2A22", fontFamily: fonts.sansBold, fontSize: 12 }}>Issue</Text></Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setCreating(true)} style={s.createBtn}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: "#0F2A22" }}>＋ Create user & password</Text>
              </Pressable>
            )}

            {creds ? (
              <View style={s.credsCard}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: colors.mint }}>Credentials issued — share once</Text>
                <View style={{ gap: 9, marginTop: 11 }}>
                  <View style={s.credRow}><Text style={s.credLabel}>User ID</Text><Text style={s.credValue}>{creds.userId}</Text></View>
                  <View style={s.credRow}><Text style={s.credLabel}>Temp password</Text><Text style={s.credValue}>{creds.tempPassword}</Text></View>
                  {creds.scope ? <View style={s.credRow}><Text style={s.credLabel}>Scope</Text><Text style={s.credValue}>{creds.scope}</Text></View> : null}
                </View>
                <Text style={{ fontFamily: fonts.sans, fontSize: 11, lineHeight: 17, color: "rgba(245,242,236,0.55)", marginTop: 11 }}>
                  Password expires in 24h and must be changed at first sign-in. Nothing is emailed unless you ask.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Eyebrow style={{ marginTop: 6 }}>Members</Eyebrow>
        <View style={{ gap: 9 }}>
          {data.members.map((m) => (
            <View key={m.id} style={s.memberCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar initials={m.initials} bg={m.you ? colors.ink : "#E4E0D7"} fg={m.you ? colors.cream : "#4A463F"} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.ink }}>{m.name}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: colors.mute, marginTop: 4 }}>{m.userId}</Text>
                </View>
                <View style={[s.roleBadge, { backgroundColor: (ROLE_COLORS[m.role] || ROLE_COLORS.Editor).bg }]}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", color: (ROLE_COLORS[m.role] || ROLE_COLORS.Editor).fg }}>{m.role}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap", marginTop: 11 }}>
                {m.scopes.map((sc) => (
                  <Pressable key={sc.category} disabled={m.you} onPress={() => toggleScope(m, sc.category)} style={[s.scopeChip, { backgroundColor: sc.granted ? colors.greenTint : "#fff", borderColor: sc.granted ? "rgba(31,95,75,0.24)" : "rgba(20,23,26,0.10)", opacity: m.you ? 0.6 : 1 }]}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: sc.granted ? colors.green : "#A9A296" }}>{sc.granted ? "✓" : "＋"}</Text>
                    <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, color: sc.granted ? colors.green : "#A9A296" }}>{sc.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={s.memberFooter}>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: colors.mute, flex: 1 }}>{m.activity}</Text>
                <Pressable onPress={() => doAction(m)}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: m.you ? "#A9A296" : m.action === "Resend" ? colors.green : colors.clay }}>{m.action}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Eyebrow style={{ marginTop: 6 }}>Access log</Eyebrow>
        <View style={s.logCard}>
          {data.auditLog.map((a, i) => (
            <View key={i} style={[s.logRow, i === data.auditLog.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={{ fontFamily: "ui-monospace" as any, fontSize: 10, color: "#A9A296", width: 44 }}>{a.ts}</Text>
              <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 17, color: "#4A463F" }}>{a.event}</Text>
            </View>
          ))}
        </View>

        {data.isOwner || data.members.find((m) => m.you)?.scopes.find((s) => s.category === "vault")?.granted ? (
          <Pressable onPress={() => nav.navigate("Vault")} style={s.vaultLink}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.ink }}>Data & vault</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.mute, marginTop: 3 }}>Encryption, sync settings and export</Text>
            </View>
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.mute }}>→</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={signOut} style={s.signOutBtn}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.clay }}>Sign out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 20, gap: 14 },
  ownerCard: { borderRadius: radii.xl, backgroundColor: colors.ink, padding: 17 },
  createBtn: { marginTop: 14, minHeight: 46, borderRadius: 13, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  createForm: { marginTop: 14, minHeight: 46, borderRadius: 13, backgroundColor: "rgba(245,242,236,0.08)", borderWidth: 1, borderColor: "rgba(245,242,236,0.16)", flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 10 },
  createSubmit: { minHeight: 32, paddingHorizontal: 12, borderRadius: 9, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  credsCard: { marginTop: 12, borderRadius: 14, backgroundColor: "rgba(143,211,182,0.14)", borderWidth: 1, borderColor: "rgba(143,211,182,0.4)", padding: 14 },
  credRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  credLabel: { fontFamily: fonts.sansSemibold, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(245,242,236,0.5)" },
  credValue: { fontFamily: "ui-monospace" as any, fontSize: 13, fontWeight: "700", color: colors.cream },
  memberCard: { borderRadius: radii.lg, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, padding: 15 },
  roleBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7 },
  scopeChip: { flexDirection: "row", gap: 6, minHeight: 34, paddingHorizontal: 11, borderRadius: 9, alignItems: "center", borderWidth: 1 },
  memberFooter: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: "rgba(20,23,26,0.07)" },
  logCard: { borderRadius: radii.lg, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.borderSoft, paddingHorizontal: 15 },
  logRow: { flexDirection: "row", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(20,23,26,0.06)" },
  vaultLink: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radii.lg, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 6 },
  signOutBtn: { minHeight: 50, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", marginBottom: 6 }
});
