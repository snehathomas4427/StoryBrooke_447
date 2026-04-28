// gets the dashboard data for one user in a single call

import { apiClient } from "./client.js";

export async function fetchDashboard(username) {
  const { data } = await apiClient.get(
    `/api/profiles/${encodeURIComponent(username)}/dashboard`
  );
  return data;
}
