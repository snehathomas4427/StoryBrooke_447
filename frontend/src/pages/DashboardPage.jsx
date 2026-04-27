import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboard } from "../api/dashboard.js";
import { setFavorite, updateReadingLogDate } from "../api/readingLog.js";
import { extractApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StarRatingDisplay } from "../components/StarRating.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { LoadingState } from "../components/LoadingState.jsx";

function formatDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return String(value);
  }
}

function sortReadingLog(entries, sortKey) {
  const copy = [...entries];
  switch (sortKey) {
    case "rating-desc":
      copy.sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0));
      break;
    case "rating-asc":
      copy.sort((a, b) => Number(a.average_rating || 0) - Number(b.average_rating || 0));
      break;
    case "date-asc":
      copy.sort((a, b) => {
        const da = a.date_finished ? new Date(a.date_finished).getTime() : 0;
        const db = b.date_finished ? new Date(b.date_finished).getTime() : 0;
        return da - db;
      });
      break;
    case "title":
      copy.sort((a, b) => String(a.title).localeCompare(String(b.title)));
      break;
    case "date-desc":
    default:
      copy.sort((a, b) => {
        const da = a.date_finished ? new Date(a.date_finished).getTime() : 0;
        const db = b.date_finished ? new Date(b.date_finished).getTime() : 0;
        return db - da;
      });
      break;
  }
  return copy;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortKey, setSortKey] = useState("date-desc");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [favBusy, setFavBusy] = useState(null);
  const [favNotice, setFavNotice] = useState("");
  const [dateDrafts, setDateDrafts] = useState({});
  const [dateBusy, setDateBusy] = useState(null);
  const [dateMessages, setDateMessages] = useState({});

  const load = useCallback(async () => {
    if (!user?.username) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchDashboard(user.username);
      setDashboard(data);
    } catch (err) {
      setError(extractApiError(err, "Could not load your dashboard."));
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    load();
  }, [load]);

  const readingLogProcessed = useMemo(() => {
    const list = dashboard?.readingLog || [];
    const filtered = list.filter((entry) => {
      if (filterFavorites && !entry.is_favorite) return false;
      if (minRating > 0 && Number(entry.average_rating || 0) < minRating) return false;
      return true;
    });
    return sortReadingLog(filtered, sortKey);
  }, [dashboard?.readingLog, sortKey, filterFavorites, minRating]);

  async function handleFavoriteToggle(entry) {
    if (!user?.username || !entry) return;
    const nextValue = !entry.is_favorite;
    setFavBusy(entry.entry_id);
    setFavNotice("");

    if (nextValue) {
      const alreadyFavorited = (dashboard?.readingLog || []).some(
        (row) =>
          row.is_favorite &&
          row.isbn === entry.isbn &&
          row.entry_id !== entry.entry_id
      );
      if (alreadyFavorited) {
        setFavNotice("this book is already in your favorites");
        setFavBusy(null);
        return;
      }
    }

    setDashboard((current) => {
      if (!current) return current;
      const updated = current.readingLog.map((row) =>
        row.entry_id === entry.entry_id ? { ...row, is_favorite: nextValue } : row
      );
      const favorites = updated
        .filter((row) => row.is_favorite)
        .map((row) => ({
          isbn: row.isbn,
          title: row.title,
          author: row.author,
          average_rating: row.average_rating
        }));
      return {
        ...current,
        readingLog: updated,
        favorites,
        stats: { ...current.stats, favoriteCount: favorites.length }
      };
    });

    try {
      await setFavorite({
        username: user.username,
        entryId: entry.entry_id,
        isFavorite: nextValue
      });
    } catch (err) {
      setFavNotice(extractApiError(err, "Could not update favorite."));
      load();
    } finally {
      setFavBusy(null);
    }
  }

  function dateKey(entry) {
    return `${entry.username || user?.username || ""}|${entry.entry_id}`;
  }

  function toDateInputValue(value) {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  async function handleSaveFinishedDate(entry) {
    if (!user?.username) return;
    const key = dateKey(entry);
    const draft = Object.prototype.hasOwnProperty.call(dateDrafts, key)
      ? dateDrafts[key]
      : toDateInputValue(entry.date_finished);
    const nextValue = draft === "" ? null : draft;

    if (nextValue && nextValue > todayStr) {
      setDateMessages((prev) => ({
        ...prev,
        [key]: "Date finished cannot be in the future."
      }));
      return;
    }

    setDateBusy(key);
    setDateMessages((prev) => ({ ...prev, [key]: "" }));
    try {
      await updateReadingLogDate({
        username: user.username,
        entryId: entry.entry_id,
        dateFinished: nextValue
      });
      setDashboard((current) => {
        if (!current) return current;
        const updated = current.readingLog.map((row) =>
          row.entry_id === entry.entry_id
            ? { ...row, date_finished: nextValue }
            : row
        );
        return { ...current, readingLog: updated };
      });
      setDateDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setDateMessages((prev) => ({
        ...prev,
        [key]: nextValue ? "Saved." : "Cleared."
      }));
    } catch (err) {
      setDateMessages((prev) => ({
        ...prev,
        [key]: extractApiError(err, "Could not update date.")
      }));
    } finally {
      setDateBusy(null);
    }
  }

  async function handleClearFinishedDate(entry) {
    const key = dateKey(entry);
    setDateDrafts((prev) => ({ ...prev, [key]: "" }));
    await handleSaveFinishedDate({ ...entry, date_finished: null });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <LoadingState label="Loading your dashboard..." />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          title="Could not load dashboard"
          description={error || "Try refreshing the page."}
          action={
            <button type="button" className="btn-secondary" onClick={load}>
              Retry
            </button>
          }
        />
      </div>
    );
  }

  const { profile, stats, favorites } = dashboard;
  const favoriteIsbns = new Set((favorites || []).map((b) => b.isbn));
  const wantToReadCandidates = (favorites || []).filter((book) => {
    return !(dashboard.readingLog || []).some(
      (entry) => entry.isbn === book.isbn && entry.date_finished
    );
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-brand-100 via-cream-50 to-brand-50 p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-500">Your StoryBrooke</p>
          <h1 className="mt-1 text-3xl font-semibold">{profile.name}</h1>
          <p className="mt-1 text-sm text-brand-700">
            @{profile.username} · joined {formatDate(profile.date_joined)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-2xl font-semibold text-brand-700">{stats.booksRead}</p>
            <p className="text-xs uppercase tracking-wide text-brand-500">Books read</p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-2xl font-semibold text-brand-700">{stats.favoriteCount}</p>
            <p className="text-xs uppercase tracking-wide text-brand-500">Favorites</p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-2xl font-semibold text-brand-700">{stats.reviewCount}</p>
            <p className="text-xs uppercase tracking-wide text-brand-500">Reviews</p>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Reading log</h2>
            <p className="text-sm text-brand-600">
              Books you've finished. Sort and filter to revisit favorites.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-col text-xs font-medium text-brand-600">
              Sort by
              <select
                className="input mt-1 py-1.5"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value)}
              >
                <option value="date-desc">Recently finished</option>
                <option value="date-asc">Oldest finished</option>
                <option value="rating-desc">Rating: high to low</option>
                <option value="rating-asc">Rating: low to high</option>
                <option value="title">Title (A–Z)</option>
              </select>
            </label>
            <label className="flex flex-col text-xs font-medium text-brand-600">
              Min rating
              <select
                className="input mt-1 py-1.5"
                value={minRating}
                onChange={(event) => setMinRating(Number(event.target.value))}
              >
                <option value={0}>Any</option>
                <option value={1}>1+</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
                <option value={5}>5</option>
              </select>
            </label>
            <label className="flex items-center gap-2 self-end pb-1 text-sm text-brand-700">
              <input
                type="checkbox"
                checked={filterFavorites}
                onChange={(event) => setFilterFavorites(event.target.checked)}
              />
              Favorites only
            </label>
          </div>
        </div>

        {favNotice ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {favNotice}
          </p>
        ) : null}

        {readingLogProcessed.length === 0 ? (
          <EmptyState
            title="Nothing logged yet"
            description="Mark a book as finished from its detail page to start your log."
            action={
              <Link to="/" className="btn-secondary">
                Browse books
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {readingLogProcessed.map((entry) => {
              const key = dateKey(entry);
              const draftDefined = Object.prototype.hasOwnProperty.call(dateDrafts, key);
              const draftValue = draftDefined
                ? dateDrafts[key]
                : toDateInputValue(entry.date_finished);
              const persistedValue = toDateInputValue(entry.date_finished);
              const isDirty = draftDefined && draftValue !== persistedValue;
              const message = dateMessages[key];
              const busy = dateBusy === key;

              return (
              <li
                key={entry.entry_id}
                className="card flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-brand-400">
                    @{user?.username} · Entry #{entry.entry_id} · ISBN {entry.isbn}
                  </p>
                  <Link
                    to={`/books/${encodeURIComponent(entry.isbn)}`}
                    className="mt-1 block text-base font-semibold text-brand-900 hover:text-brand-600"
                  >
                    {entry.title}
                  </Link>
                  <p className="text-sm text-brand-600">by {entry.author}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StarRatingDisplay value={entry.average_rating} size="sm" />
                    <span className="text-xs text-brand-500">
                      {Number(entry.average_rating || 0).toFixed(2)} avg
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="flex flex-col text-[11px] uppercase tracking-wide text-brand-500">
                      Date finished
                      <input
                        type="date"
                        className="input mt-1 py-1 text-sm"
                        value={draftValue}
                        max={todayStr}
                        onChange={(event) =>
                          setDateDrafts((prev) => ({
                            ...prev,
                            [key]: event.target.value
                          }))
                        }
                        disabled={busy}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-secondary py-1 text-xs"
                      onClick={() => handleSaveFinishedDate(entry)}
                      disabled={busy || !isDirty}
                    >
                      {busy ? "Saving..." : "Save"}
                    </button>
                    {persistedValue ? (
                      <button
                        type="button"
                        className="btn-ghost py-1 text-xs"
                        onClick={() => handleClearFinishedDate(entry)}
                        disabled={busy}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-brand-500">
                    {persistedValue
                      ? `Currently saved: ${formatDate(entry.date_finished)}`
                      : "Not finished yet"}
                  </p>
                  {message ? (
                    <p className="mt-1 text-xs text-brand-600">{message}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={`btn-ghost ${entry.is_favorite ? "text-brand-600" : "text-brand-400"}`}
                  onClick={() => handleFavoriteToggle(entry)}
                  disabled={favBusy === entry.entry_id}
                  aria-label={entry.is_favorite ? "Remove favorite" : "Add favorite"}
                  title={entry.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M12 21s-7.5-4.7-9.4-9.1C1.4 8.7 3.4 5.5 6.7 5.5c1.8 0 3.4 1 4.3 2.5C12 6.5 13.5 5.5 15.3 5.5c3.3 0 5.3 3.2 4.1 6.4C19.5 16.3 12 21 12 21z"
                      fill={entry.is_favorite ? "currentColor" : "transparent"}
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Favorites</h2>
          {(favorites || []).length === 0 ? (
            <EmptyState
              title="No favorites yet"
              description="Tap the heart icon on any reading log entry to favorite it."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {favorites.map((book) => (
                <li key={book.isbn} className="card">
                  <Link
                    to={`/books/${encodeURIComponent(book.isbn)}`}
                    className="text-base font-semibold text-brand-900 hover:text-brand-600"
                  >
                    {book.title}
                  </Link>
                  <p className="text-sm text-brand-600">by {book.author}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StarRatingDisplay value={book.average_rating} size="sm" />
                    <span className="text-xs text-brand-500">
                      {Number(book.average_rating || 0).toFixed(2)} avg
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Want to read</h2>
          <p className="text-sm text-brand-600">
            Favorites you haven't marked as finished yet.
          </p>
          {wantToReadCandidates.length === 0 ? (
            <EmptyState
              title="Nothing waiting"
              description={
                favoriteIsbns.size === 0
                  ? "Favorite a book to plan your next read."
                  : "All your favorites are finished. Time to find new ones!"
              }
              action={
                <Link to="/" className="btn-secondary">
                  Browse books
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {wantToReadCandidates.map((book) => (
                <li key={book.isbn} className="card">
                  <Link
                    to={`/books/${encodeURIComponent(book.isbn)}`}
                    className="text-base font-semibold text-brand-900 hover:text-brand-600"
                  >
                    {book.title}
                  </Link>
                  <p className="text-sm text-brand-600">by {book.author}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
