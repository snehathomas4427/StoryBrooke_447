import { apiClient } from "./client.js";

export async function searchBooks(query, limit = 20) {
  const { data } = await apiClient.get("/api/books/search", {
    params: { q: query || "", limit }
  });
  return data;
}

export async function fetchBookDetail(isbn) {
  const { data } = await apiClient.get(`/api/books/${encodeURIComponent(isbn)}`);
  return data;
}
