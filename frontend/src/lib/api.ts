import axios from "axios";
import { authState } from "../stores/authStore";

export const API_URL = import.meta.env.PUBLIC_API_URL ?? "";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = authState.get().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  },
);
