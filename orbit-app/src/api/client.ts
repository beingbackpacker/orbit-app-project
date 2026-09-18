import { getItem } from "../utils/storage";

// Override at build time with EXPO_PUBLIC_API_BASE for a deployed backend.
// For local dev on a physical device or Android emulator, replace "localhost"
// with your machine's LAN IP (Android emulator: 10.0.2.2).
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://10.247.161.235:4000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  if (authToken === null) authToken = await getItem("orbit_token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Request failed", res.status);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body })
};
