import { atom } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import type { User } from "../types";
import { api } from "../lib/api";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
};

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

let authReadyPromise: Promise<void> | null = null;

/** Wait until persisted auth state is available on the client. */
export function waitForAuth(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (!authReadyPromise) {
    authReadyPromise = Promise.resolve().then(() => {
      syncAuth();
    });
  }

  return authReadyPromise;
}

export function getPostLoginRedirect(user: User): string {
  return user.role === "ADMIN" ? "/admin" : "/account";
}

export async function checkAuthAccess(options: {
  requireAuth?: boolean;
  requireAdmin?: boolean;
}): Promise<{ allowed: boolean; redirectTo?: string }> {
  await waitForAuth();

  const { requireAuth = true, requireAdmin = false } = options;
  const loggedIn = isLoggedIn.get();
  const user = currentUser.get();

  if (requireAuth && !loggedIn) {
    return { allowed: false, redirectTo: "/login" };
  }

  if (requireAdmin && (!user || user.role !== "ADMIN")) {
    return { allowed: false, redirectTo: loggedIn ? "/" : "/login" };
  }

  return { allowed: true };
}

export async function login(email: string, password: string) {
  authState.set({ ...authState.get(), isLoading: true });
  try {
    const { data } = await api.post("/api/auth/login", { email, password });
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
    const { data } = await api.post("/api/auth/register", payload);
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
    const { data } = await api.get("/api/auth/profile");
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

export async function updateProfile(payload: { name: string; phone: string }) {
  const { data } = await api.put("/api/auth/profile", payload);
  authState.set({ ...authState.get(), user: data.data });
  return data.data;
}

/** @deprecated Use `import { API_URL } from "../lib/api"` instead */
export { API_URL } from "../lib/api";
