import { apiClient } from "./client.js";

export async function submitReview({ username, isbn, starRating, reviewText }) {
  const { data } = await apiClient.post("/api/reviews", {
    username,
    isbn,
    starRating,
    reviewText
  });
  return data;
}

export async function deleteReview(reviewId) {
  const { data } = await apiClient.delete(
    `/api/reviews/${encodeURIComponent(reviewId)}`
  );
  return data;
}
