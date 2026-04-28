// reading log api wrappers
// add a new entry toggle favorite update finished date

import { apiClient } from "./client.js";

export async function addReadingLogEntry({ username, isbn, dateFinished, isFavorite }) {
  const { data } = await apiClient.post("/api/reading-log", {
    username,
    isbn,
    dateFinished,
    isFavorite
  });
  return data;
}

export async function setFavorite({ username, entryId, isFavorite }) {
  const { data } = await apiClient.patch(
    `/api/reading-log/${encodeURIComponent(username)}/${encodeURIComponent(entryId)}/favorite`,
    { isFavorite }
  );
  return data;
}

export async function updateReadingLogDate({ username, entryId, dateFinished }) {
  const { data } = await apiClient.patch(
    `/api/reading-log/${encodeURIComponent(username)}/${encodeURIComponent(entryId)}`,
    { dateFinished: dateFinished === "" ? null : dateFinished }
  );
  return data;
}
