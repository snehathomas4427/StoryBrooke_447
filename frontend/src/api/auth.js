// thin wrappers around the auth endpoints on the backend

import { apiClient } from "./client.js";

export async function login({ username, name }) {
  const { data } = await apiClient.post("/api/auth/login", { username, name });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
}

export async function logout() {
  const { data } = await apiClient.post("/api/auth/logout");
  return data;
}
