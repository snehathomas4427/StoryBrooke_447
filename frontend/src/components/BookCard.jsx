// little card used on the search page to show a single book
// clicking it takes you to the detail page

import { Link } from "react-router-dom";
import { StarRatingDisplay } from "./StarRating.jsx";

// some books have multiple authors so split on commas semicolons slashes ampersands or the word and
function splitAuthors(author) {
  if (!author) return [];
  return String(author)
    .split(/\s*[;,/&]\s*|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

// keep the summary short on the card so the layout doesnt blow up
function truncate(text, max = 180) {
  if (!text) return "";
  const clean = String(text).trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export function BookCard({ book, footer = null }) {
  if (!book) return null;
  const authors = splitAuthors(book.author);
  return (
    <Link
      to={`/books/${encodeURIComponent(book.isbn)}`}
      className="group card flex h-full flex-col gap-3 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-brand-400">ISBN {book.isbn}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-brand-900 group-hover:text-brand-600">
          {book.title}
        </h3>
        <p className="mt-1 text-sm text-brand-600">
          {authors.length > 0 ? `by ${authors.join(", ")}` : "Author unknown"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <StarRatingDisplay value={book.average_rating} size="sm" />
        <span className="text-xs text-brand-500">
          {Number(book.average_rating || 0).toFixed(2)} avg
        </span>
      </div>

      {book.summary ? (
        <p className="text-sm leading-relaxed text-brand-700">
          {truncate(book.summary, 200)}
        </p>
      ) : null}

      {footer}
    </Link>
  );
}
