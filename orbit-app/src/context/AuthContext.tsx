import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAuthToken } from "../api/client";
import { getItem, setItem, removeItem } from "../utils/storage";

export interface OrbitUser {
  id: number;
  userId: string;
  name: string;
  initials: string;
  role: "owner" | "editor" | "viewer";
  mustChangePassword: boolean;
}

interface AuthState {
  user: OrbitUser | null;
  loading: boolean;
  onboarded: boolean;
  signIn: (userId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const WORKSPACE = "elongeva.orbit.app";

// SecureStore keys may only contain alphanumerics, ".", "-", and "_".
// userId is an email-like string (e.g. "lucky@elongeva"), so sanitize it
// before using it as part of a storage key.
function onboardedKey(userId: string) {
  return `orbit_onboarded_${userId.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OrbitUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  const loadOnboarded = async (userId: string) => {
    const flag = await getItem(onboardedKey(userId));
    setOnboarded(flag === "1");
  };

  useEffect(() => {
    (async () => {
      const token = await getItem("orbit_token");
      const rawUser = await getItem("orbit_user");
      if (token && rawUser) {
        setAuthToken(token);
        const parsed = JSON.parse(rawUser);
        setUser(parsed);
        await loadOnboarded(parsed.userId);
      }
      setLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (userId: string, password: string) => {
    const res = await api.post<{ token: string; user: OrbitUser }>("/auth/sign-in", {
      workspace: WORKSPACE,
      userId,
      password
    });
    setAuthToken(res.token);
    await setItem("orbit_token", res.token);
    await setItem("orbit_user", JSON.stringify(res.user));
    await loadOnboarded(res.user.userId);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await removeItem("orbit_token");
    await removeItem("orbit_user");
    setUser(null);
    setOnboarded(false);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (user) await setItem(onboardedKey(user.userId), "1");
    setOnboarded(true);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, onboarded, signIn, signOut, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
