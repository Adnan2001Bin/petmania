import { atom } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import type { User } from "../types";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
};

/** Same-origin by default so Caddy can route /api/* in production. Override via PUBLIC_API_URL for local dev without proxy. */
export const API_URL = import.meta.env.PUBLIC_API_URL ?? "";

export const authState = persistentAtom<AuthState>("petmania-auth", {
  user: null,
  token: null,
  isLoading: false,
}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const isLoggedIn = atom(false);
export const currentUser = atom<User | null>(null);
export const isAdmin = atom(false);

function syncAuth() {
  const state = authState.get();
  isLoggedIn.set(!!state.token);
  currentUser.set(state.user);
  isAdmin.set(state.user?.role === "ADMIN");
}

authState.subscribe(syncAuth);
syncAuth();

async function apiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function login(email: string, password: string) {
  authState.set({ ...authState.get(), isLoading: true });
  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    authState.set({
      user: data.data.user,
      token: data.data.token,
      isLoading: false,
    });
    return data.data;
  } catch (error) {
    authState.set({ ...authState.get(), isLoading: false });
    throw error;
  }
}

export async function register(payload: {
  email: string;
  password: string;
  name: string;
}) {
  authState.set({ ...authState.get(), isLoading: true });
  try {
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    authState.set({
      user: data.data.user,
      token: data.data.token,
      isLoading: false,
    });
    return data.data;
  } catch (error) {
    authState.set({ ...authState.get(), isLoading: false });
    throw error;
  }
}

export function logout() {
  authState.set({ user: null, token: null, isLoading: false });
}

export async function fetchProfile() {
  const token = authState.get().token;
  if (!token) return null;

  try {
    const data = await apiRequest("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    authState.set({ ...authState.get(), user: data.data });
    return data.data;
  } catch {
    logout();
    return null;
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = authState.get().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
