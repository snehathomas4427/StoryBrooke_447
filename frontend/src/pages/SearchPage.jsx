// home page where you search for books or just browse the catalog
// the search query lives in the url so you can share or refresh and keep results

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchBooks } from "../api/books.js";
import { extractApiError } from "../api/client.js";
import { BookCard } from "../components/BookCard.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { LoadingState } from "../components/LoadingState.jsx";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  // input value is the current text in the box
  // queryParam is the actual search that has been committed to the url
  const [inputValue, setInputValue] = useState(queryParam);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // hits the backend search endpoint and stores the results
  const load = useCallback(async (q) => {
    setLoading(true);
    setError("");
    try {
      const data = await searchBooks(q, 24);
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiError(err, "Could not load books."));
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // refetch any time the url query changes
  useEffect(() => {
    setInputValue(queryParam);
    load(queryParam);
  }, [queryParam, load]);

  // pushes the new query into the url which triggers the effect above
  function onSubmit(event) {
    event.preventDefault();
    const next = inputValue.trim();
    setSearchParams(next ? { q: next } : {});
  }

  const heading = useMemo(() => {
    if (queryParam) return `Results for “${queryParam}”`;
    return "Browse the StoryBrooke library";
  }, [queryParam]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-brand-50 via-cream-50 to-brand-100 p-8 shadow-card">
        <h1 className="text-3xl font-semibold leading-tight">
          Find your next great read
        </h1>
        <p className="max-w-2xl text-sm text-brand-700">
          Search StoryBrooke for books by title, author, or ISBN. Open a book to
          see its full summary, leave a star rating, write a review, or save it
          to your reading log.
        </p>
        <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Try “Tolkien”, “Beloved”, or an ISBN"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">{heading}</h2>
          {!loading && !error ? (
            <span className="text-sm text-brand-500">
              {books.length} book{books.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {loading ? <LoadingState label="Searching the shelves..." /> : null}

        {!loading && error ? (
          <EmptyState title="We hit a snag" description={error} />
        ) : null}

        {!loading && !error && books.length === 0 ? (
          <EmptyState
            title="No matching books"
            description={
              queryParam
                ? "Try a different title, author, or ISBN."
                : "There are no books in the catalog yet."
            }
          />
        ) : null}

        {!loading && !error && books.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.isbn} book={book} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
