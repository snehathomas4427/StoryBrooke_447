import { StarRatingDisplay } from "./StarRating.jsx";

function formatTimestamp(value) {
  if (!value) return "";
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

export function ReviewCard({ review, isbn, canDelete = false, onDelete, deleting = false }) {
  if (!review) return null;
  const resolvedIsbn = review.isbn || isbn;
  return (
    <article className="card">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-900">@{review.username}</p>
          <p className="text-xs text-brand-500">{formatTimestamp(review.time_posted)}</p>
        </div>
        <StarRatingDisplay value={review.star_rating} size="sm" />
      </header>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-brand-400">
        Review #{review.review_id}
        {resolvedIsbn ? <> · ISBN {resolvedIsbn}</> : null}
      </p>
      {review.review_text ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
          {review.review_text}
        </p>
      ) : (
        <p className="mt-3 text-sm italic text-brand-400">No written review.</p>
      )}
      {canDelete && onDelete ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="btn-ghost py-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
            onClick={() => onDelete(review)}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete my review"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
