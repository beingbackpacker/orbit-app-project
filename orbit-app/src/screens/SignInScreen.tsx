import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, radii } from "../theme/theme";
import { Button } from "../components/ui";

const DEMO = [
  { label: "Workspace owner", sub: "Issues credentials, sets scopes, holds the vault key.", userId: "lucky@elongeva", password: "Orbit#Owner1" },
  { label: "Team member", sub: "Signs in with an owner-issued ID. Sees only granted scopes.", userId: "priya@elongeva", password: "Orbit#Priya1" }
];

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [pick, setPick] = useState(0);
  const [userId, setUserId] = useState(DEMO[0].userId);
  const [password, setPassword] = useState(DEMO[0].password);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = (i: number) => {
    setPick(i);
    setUserId(DEMO[i].userId);
    setPassword(DEMO[i].password);
  };

  const onSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(userId.trim(), password);
    } catch (e: any) {
      setError(e.message || "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ink }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, paddingTop: insets.top + 22, paddingBottom: insets.bottom + 30, paddingHorizontal: 26 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={s.logo}><Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: "#0F2A22" }}>O</Text></View>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.cream, letterSpacing: 0.4 }}>Orbit for Teams</Text>
        </View>

        <Text style={{ fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.cream, marginTop: 38 }}>
          Sign in to your{"\n"}
          <Text style={{ fontStyle: "italic", color: colors.mint }}>workspace</Text>
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: "rgba(245,242,236,0.55)", marginTop: 11 }}>
          Use the user ID your workspace owner issued. Credentials are verified against the workspace, not a public account.
        </Text>

        <View style={{ marginTop: 26, gap: 10 }}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>Workspace</Text>
            <Text style={s.fieldValue}>elongeva.orbit.app</Text>
          </View>
          <View style={s.field}>
            <Text style={s.fieldLabel}>User ID</Text>
            <TextInput
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@workspace"
              placeholderTextColor="rgba(245,242,236,0.3)"
              style={s.input}
            />
          </View>
          <View style={s.field}>
            <Text style={s.fieldLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••••"
              placeholderTextColor="rgba(245,242,236,0.3)"
              style={s.input}
            />
          </View>
        </View>

        <Text style={s.sectionLabel}>Sign in as</Text>
        <View style={{ gap: 8 }}>
          {DEMO.map((r, i) => (
            <Pressable
              key={r.label}
              onPress={() => choose(i)}
              style={[s.roleRow, { backgroundColor: pick === i ? "rgba(143,211,182,0.14)" : "rgba(245,242,236,0.06)", borderColor: pick === i ? colors.mint : "rgba(245,242,236,0.14)" }]}
            >
              <View style={[s.dot, { borderColor: pick === i ? colors.mint : "rgba(245,242,236,0.3)", backgroundColor: pick === i ? colors.mint : "transparent" }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.cream }}>{r.label}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 16, color: "rgba(245,242,236,0.55)", marginTop: 4 }}>{r.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={{ color: colors.clay, fontFamily: fonts.sansSemibold, fontSize: 12.5, marginTop: 16, textAlign: "center" }}>{error}</Text> : null}

        <View style={{ flex: 1 }} />
        <Button label={busy ? "Signing in…" : "Sign in"} onPress={onSignIn} disabled={busy} style={{ marginTop: 24 }} />
        <Text style={{ textAlign: "center", fontFamily: fonts.sansMedium, fontSize: 11, color: "rgba(245,242,236,0.38)", marginTop: 14 }}>
          Owner-issued credentials · device data stays in the local vault
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  logo: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  field: { borderRadius: radii.md, backgroundColor: "rgba(245,242,236,0.07)", borderWidth: 1, borderColor: "rgba(245,242,236,0.14)", paddingHorizontal: 15, paddingVertical: 12 },
  fieldLabel: { fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(245,242,236,0.42)" },
  fieldValue: { fontFamily: fonts.sansSemibold, fontSize: 14.5, color: colors.cream, marginTop: 8 },
  input: { fontFamily: fonts.sansSemibold, fontSize: 14.5, color: colors.cream, marginTop: 8, padding: 0 },
  sectionLabel: { fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(245,242,236,0.4)", marginTop: 24, marginBottom: 10 },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 13 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 }
});
