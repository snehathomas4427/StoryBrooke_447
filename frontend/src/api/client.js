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

export function extractApiError(error, fallback = "Something went wrong.") {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return fallback;
}
