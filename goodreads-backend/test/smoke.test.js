const test = require("node:test");
const assert = require("node:assert/strict");

const stubPath = require.resolve("./stubMysql.js");
const realPath = require.resolve("mysql2/promise");

const stub = require(stubPath);
require.cache[realPath] = {
  id: realPath,
  filename: realPath,
  loaded: true,
  exports: stub,
  paths: []
};

stub.__store.reset();
stub.__store.seed();

require("../server.js");

const BASE = "http://127.0.0.1:3000";

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Server did not start in time");
}

test.before(async () => {
  await waitForServer();
});

function joinCookies(setCookie) {
  if (!setCookie) return "";
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  return list.map((c) => c.split(";")[0]).join("; ");
}

test("GET /health returns ok:true", async () => {
  const res = await fetch(`${BASE}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test("GET /api/auth/me returns null user when unauthenticated", async () => {
  const res = await fetch(`${BASE}/api/auth/me`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user, null);
});

test("POST /api/auth/login validates username", async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "" })
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /username/i);
});

test("login -> me -> logout round trip preserves session", async () => {
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "reader42", name: "Reader Forty Two" })
  });
  assert.equal(loginRes.status, 200);

  const setCookie = loginRes.headers.getSetCookie?.() || loginRes.headers.get("set-cookie");
  const cookie = joinCookies(setCookie);
  assert.ok(cookie.includes("storybrooke.sid"), `expected session cookie, got ${cookie}`);

  const loginBody = await loginRes.json();
  assert.equal(loginBody.user.username, "reader42");
  assert.equal(loginBody.user.name, "Reader Forty Two");

  const meRes = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
  const meBody = await meRes.json();
  assert.equal(meBody.user.username, "reader42");

  const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { cookie }
  });
  assert.equal(logoutRes.status, 200);
});

test("login is idempotent for existing usernames (no duplicate insert)", async () => {
  const before = stub.__store.profiles.size;
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "reader42", name: "Should be ignored" })
  });
  assert.equal(res.status, 200);
  const after = stub.__store.profiles.size;
  assert.equal(after, before);
});

test("GET /api/books/search returns seeded books", async () => {
  const res = await fetch(`${BASE}/api/books/search`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
  assert.ok(body.find((b) => b.isbn === "isbn-1"));
});

test("GET /api/books/:isbn returns reviews payload (404 for unknown)", async () => {
  const ok = await fetch(`${BASE}/api/books/isbn-1`);
  assert.equal(ok.status, 200);
  const okBody = await ok.json();
  assert.equal(okBody.title, "The Hobbit");
  assert.ok(Array.isArray(okBody.reviews));

  const missing = await fetch(`${BASE}/api/books/does-not-exist`);
  assert.equal(missing.status, 404);
});

test("POST /api/reviews validates star rating", async () => {
  const bad = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "reader42",
      isbn: "isbn-1",
      starRating: 9,
      reviewText: "out of range"
    })
  });
  assert.equal(bad.status, 400);

  const missing = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "reader42", isbn: "isbn-1" })
  });
  assert.equal(missing.status, 400);
});

test("POST /api/reviews + reading-log persist and refresh average rating", async () => {
  const reviewRes = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "reader42",
      isbn: "isbn-1",
      starRating: 5,
      reviewText: "Loved it"
    })
  });
  assert.equal(reviewRes.status, 201);

  const detail = await fetch(`${BASE}/api/books/isbn-1`).then((r) => r.json());
  assert.ok(detail.reviews.some((r) => r.username === "reader42"));
  assert.equal(Number(detail.average_rating), 5);

  const today = new Date().toISOString().slice(0, 10);
  const logRes = await fetch(`${BASE}/api/reading-log`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "reader42",
      isbn: "isbn-1",
      dateFinished: today,
      isFavorite: true
    })
  });
  assert.equal(logRes.status, 201);
  const logBody = await logRes.json();
  assert.equal(typeof logBody.entryId, "number");

  const dash = await fetch(`${BASE}/api/profiles/reader42/dashboard`).then((r) => r.json());
  assert.equal(dash.profile.username, "reader42");
  assert.equal(dash.stats.booksRead, 1);
  assert.equal(dash.stats.favoriteCount, 1);
  assert.ok(dash.favorites.find((b) => b.isbn === "isbn-1"));

  const fav = await fetch(
    `${BASE}/api/reading-log/reader42/${logBody.entryId}/favorite`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isFavorite: false })
    }
  );
  assert.equal(fav.status, 200);

  const dash2 = await fetch(`${BASE}/api/profiles/reader42/dashboard`).then((r) => r.json());
  assert.equal(dash2.stats.favoriteCount, 0);
});

test("POST /api/reading-log validates required fields", async () => {
  const res = await fetch(`${BASE}/api/reading-log`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ isbn: "isbn-1" })
  });
  assert.equal(res.status, 400);
});

test.after(() => {
  setTimeout(() => process.exit(0), 50).unref();
});
