// book detail page
// shows the books info plus all reviews
// also where the user can post a review delete their own review or add to reading log

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBookDetail } from "../api/books.js";
import { submitReview, deleteReview } from "../api/reviews.js";
import { addReadingLogEntry } from "../api/readingLog.js";
import { extractApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StarRatingDisplay, StarRatingInput } from "../components/StarRating.jsx";
import { ReviewCard } from "../components/ReviewCard.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { LoadingState } from "../components/LoadingState.jsx";

// hard limits on what we accept in the review form so the textarea doesnt go crazy
const REVIEW_MAX_LENGTH = 15000;
const SUMMARY_MAX_LENGTH = 1000;

// same author splitting trick as in book card
function splitAuthors(author) {
  if (!author) return [];
  return String(author)
    .split(/\s*[;,/&]\s*|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function clampSummary(summary) {
  if (!summary) return "";
  const trimmed = String(summary).trim();
  if (trimmed.length <= SUMMARY_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, SUMMARY_MAX_LENGTH).trimEnd()}…`;
}

export function BookDetailPage() {
  const { isbn } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");

  const [logBusy, setLogBusy] = useState(false);
  const [logMessage, setLogMessage] = useState("");
  const [logError, setLogError] = useState("");

  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchBookDetail(isbn);
      setBook({
        isbn: data.isbn,
        title: data.title,
        author: data.author,
        average_rating: data.average_rating,
        summary: data.summary
      });
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (err) {
      setError(extractApiError(err, "Could not load this book."));
      setBook(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [isbn]);

  useEffect(() => {
    load();
  }, [load]);

  const authors = useMemo(() => splitAuthors(book?.author), [book?.author]);
  const summary = useMemo(() => clampSummary(book?.summary), [book?.summary]);

  // submit a new review for this book
  // does some client side validation first then calls the api
  async function onReviewSubmit(event) {
    event.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    if (!isAuthenticated || !user?.username) {
      setReviewError("Please sign in to leave a review.");
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setReviewError("Please choose a star rating between 1 and 5.");
      return;
    }
    if (reviewText.length > REVIEW_MAX_LENGTH) {
      setReviewError(`Reviews must be ${REVIEW_MAX_LENGTH.toLocaleString()} characters or fewer.`);
      return;
    }

    setReviewSubmitting(true);
    try {
      await submitReview({
        username: user.username,
        isbn,
        starRating: rating,
        reviewText: reviewText.trim() || null
      });

      // optimistic update so the new review pops in instantly
      // we still call load below to grab the real review id from the server
      const optimistic = {
        review_id: `optimistic-${Date.now()}`,
        username: user.username,
        star_rating: rating,
        review_text: reviewText.trim() || null,
        time_posted: new Date().toISOString()
      };
      setReviews((current) => [optimistic, ...current]);

      setRating(0);
      setReviewText("");
      setReviewSuccess("Your review has been posted.");

      load();
    } catch (err) {
      setReviewError(extractApiError(err, "Could not post review."));
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleDeleteReview(review) {
    if (!review?.review_id) return;
    if (!isAuthenticated || !user?.username) {
      setDeleteError("Please sign in to delete your review.");
      return;
    }
    if (review.username !== user.username) return;

    const confirmed = window.confirm(
      "Delete your review? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingReviewId(review.review_id);
    setDeleteError("");
    try {
      await deleteReview(review.review_id);
      setReviews((current) =>
        current.filter((r) => r.review_id !== review.review_id)
      );
      load();
    } catch (err) {
      setDeleteError(extractApiError(err, "Could not delete review."));
    } finally {
      setDeletingReviewId(null);
    }
  }

  // adds the current book to the users reading log
  // the date_finished is left null on purpose they can fill it in from the dashboard later
  async function handleAddToLog({ isFavorite }) {
    if (!isAuthenticated || !user?.username) {
      setLogError("Please sign in to update your reading list.");
      return;
    }
    setLogBusy(true);
    setLogError("");
    setLogMessage("");
    try {
      const result = await addReadingLogEntry({
        username: user.username,
        isbn,
        dateFinished: null,
        isFavorite
      });
      if (result?.alreadyInLog) {
        setLogMessage(
          isFavorite
            ? "This book was already in your reading log; we marked it as a favorite."
            : "This book is already in your reading log."
        );
      } else {
        setLogMessage(
          isFavorite
            ? "Added to your favorites. Set the finished date from your dashboard when you're done."
            : "Added to your reading log with no finished date yet — update it from your dashboard when you finish."
        );
      }
    } catch (err) {
      setLogError(extractApiError(err, "Could not update reading log."));
    } finally {
      setLogBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <LoadingState label="Pulling book from the shelf..." />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          title="Book not found"
          description={error || "We couldn't find that ISBN in StoryBrooke."}
          action={
            <Link to="/" className="btn-secondary">
              Back to search
            </Link>
          }
        />
      </div>
    );
  }

  const reviewCount = reviews.length;
  const charCount = reviewText.length;
  const charOver = charCount > REVIEW_MAX_LENGTH;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <nav className="text-sm">
        <Link to="/" className="text-brand-500 hover:text-brand-700">
          ← Back to search
        </Link>
      </nav>

      <header className="grid grid-cols-1 gap-6 rounded-2xl bg-white p-6 shadow-card md:grid-cols-[1fr_2fr]">
        <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-gradient-to-br from-brand-200 via-brand-300 to-brand-500 text-cream-50 shadow-inner">
          <div className="px-6 text-center">
            <p className="font-serif text-2xl font-semibold leading-tight">{book.title}</p>
            {authors[0] ? (
              <p className="mt-3 text-sm font-medium opacity-90">{authors[0]}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-400">ISBN {book.isbn}</p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight">{book.title}</h1>
            <p className="mt-2 text-sm text-brand-600">
              {authors.length > 0 ? `by ${authors.join(", ")}` : "Author unknown"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StarRatingDisplay value={book.average_rating} size="lg" />
            <span className="text-sm font-semibold text-brand-700">
              {Number(book.average_rating || 0).toFixed(2)}
            </span>
            <span className="text-sm text-brand-500">
              · {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </span>
          </div>
          {summary ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
              {summary}
            </p>
          ) : (
            <p className="text-sm italic text-brand-500">No summary available yet.</p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={logBusy}
              onClick={() => handleAddToLog({ isFavorite: false })}
            >
              Add to reading log
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={logBusy}
              onClick={() => handleAddToLog({ isFavorite: true })}
            >
              Add to favorites
            </button>
          </div>
          <p className="text-xs text-brand-500">
            Books are added without a finished date. Set it later from your dashboard.
          </p>
          {logMessage ? (
            <p className="text-sm text-emerald-700">{logMessage}</p>
          ) : null}
          {logError ? <p className="text-sm text-red-600">{logError}</p> : null}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.4fr]">
        <div className="card flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Leave a review</h2>
            <p className="mt-1 text-sm text-brand-600">
              Share what you thought of this book. Reviews appear instantly.
            </p>
          </div>

          <form onSubmit={onReviewSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-brand-700">Your rating</label>
              <div className="mt-1">
                <StarRatingInput value={rating} onChange={setRating} disabled={reviewSubmitting} />
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium text-brand-700">
              Review (optional)
              <textarea
                className="input min-h-[140px] resize-y"
                placeholder="What stood out? Who would you recommend it to?"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                maxLength={REVIEW_MAX_LENGTH + 100}
                disabled={reviewSubmitting}
              />
            </label>
            <div className="flex items-center justify-between text-xs">
              <span className={charOver ? "text-red-600" : "text-brand-500"}>
                {charCount.toLocaleString()} / {REVIEW_MAX_LENGTH.toLocaleString()} characters
              </span>
              {!isAuthenticated ? (
                <span className="text-brand-500">Sign in to post.</span>
              ) : null}
            </div>

            {reviewError ? <p className="text-sm text-red-600">{reviewError}</p> : null}
            {reviewSuccess ? (
              <p className="text-sm text-emerald-700">{reviewSuccess}</p>
            ) : null}

            <button
              type="submit"
              className="btn-primary self-start"
              disabled={reviewSubmitting || charOver || !isAuthenticated}
            >
              {reviewSubmitting ? "Posting..." : "Post review"}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            Community reviews <span className="text-brand-500">({reviewCount})</span>
          </h2>
          {deleteError ? (
            <p className="text-sm text-red-600">{deleteError}</p>
          ) : null}
          {reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              description="Be the first to share your thoughts on this book."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => {
                const isOwn =
                  isAuthenticated &&
                  user?.username &&
                  review.username === user.username &&
                  typeof review.review_id === "number";
                return (
                  <ReviewCard
                    key={review.review_id}
                    review={review}
                    isbn={isbn}
                    canDelete={isOwn}
                    deleting={deletingReviewId === review.review_id}
                    onDelete={isOwn ? handleDeleteReview : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
