import { atom } from "nanostores";
import { persistent } from "@nanostores/persistent";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
};

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:5000";

export const authState = persistent<AuthState>("petmania-auth", {
  user: null,
  token: null,
  isLoading: false,
});

export const isLoggedIn = atom(false);
export const currentUser = atom<User | null>(null);
export const isAdmin = atom(false);

// Sync atoms with persistent store
authState.subscribe((state) => {
  isLoggedIn.set(!!state.token);
  currentUser.set(state.user);
  isAdmin.set(state.user?.role === "ADMIN");
});

// Initialize from persisted state
const initial = authState.get();
if (initial.token) {
  isLoggedIn.set(true);
  currentUser.set(initial.user);
  isAdmin.set(initial.user?.role === "ADMIN");
}

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
