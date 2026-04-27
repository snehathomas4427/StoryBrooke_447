import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

process.env.VITE_API_BASE_URL = "http://127.0.0.1:6789";

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    res.setHeader("content-type", "application/json");

    if (req.method === "GET" && url.pathname === "/api/books/search") {
      res.end(
        JSON.stringify([
          { isbn: "isbn-1", title: "The Hobbit", author: "Tolkien", average_rating: 4.5 }
        ])
      );
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/books/isbn-1") {
      res.end(
        JSON.stringify({
          isbn: "isbn-1",
          title: "The Hobbit",
          author: "Tolkien",
          average_rating: 4.5,
          summary: "Bilbo's adventure",
          reviews: []
        })
      );
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/reviews") {
      const parsed = JSON.parse(body || "{}");
      if (!parsed.username || !parsed.isbn || !parsed.starRating) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "missing fields" }));
        return;
      }
      res.statusCode = 201;
      res.end(JSON.stringify({ message: "ok", echo: parsed }));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const parsed = JSON.parse(body || "{}");
      res.end(
        JSON.stringify({
          user: {
            username: parsed.username,
            name: parsed.name || parsed.username,
            dateJoined: "2026-04-26"
          }
        })
      );
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
});

await new Promise((resolve) => server.listen(6789, "127.0.0.1", resolve));

const { apiClient } = await import("../src/api/client.js");
apiClient.defaults.baseURL = "http://127.0.0.1:6789";

const { searchBooks, fetchBookDetail } = await import("../src/api/books.js");
const { submitReview } = await import("../src/api/reviews.js");
const { login } = await import("../src/api/auth.js");

test("searchBooks returns array from API", async () => {
  const data = await searchBooks("hobbit");
  assert.ok(Array.isArray(data));
  assert.equal(data[0].title, "The Hobbit");
});

test("fetchBookDetail returns book + reviews shape", async () => {
  const data = await fetchBookDetail("isbn-1");
  assert.equal(data.isbn, "isbn-1");
  assert.ok(Array.isArray(data.reviews));
});

test("submitReview rejects when backend returns 400", async () => {
  await assert.rejects(
    submitReview({ username: "", isbn: "isbn-1", starRating: 0, reviewText: "" }),
    /400|missing/i
  );
});

test("submitReview succeeds with valid payload", async () => {
  const data = await submitReview({
    username: "reader",
    isbn: "isbn-1",
    starRating: 4,
    reviewText: "Great"
  });
  assert.equal(data.message, "ok");
  assert.equal(data.echo.starRating, 4);
});

test("login returns the user object", async () => {
  const data = await login({ username: "reader42", name: "Reader" });
  assert.equal(data.user.username, "reader42");
  assert.equal(data.user.name, "Reader");
});

test.after(() => {
  server.close();
  setTimeout(() => process.exit(0), 50).unref();
});
