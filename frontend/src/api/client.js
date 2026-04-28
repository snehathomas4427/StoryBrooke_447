// shared axios instance used by every api file
// withCredentials true so the browser sends the session cookie with each request

import axios from "axios";

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};
const baseURL = env.VITE_API_BASE_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

// pulls a friendly error message out of an axios error
// uses the backend error if there is one otherwise the message or a fallback
export function extractApiError(error, fallback = "Something went wrong.") {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return fallback;
}
