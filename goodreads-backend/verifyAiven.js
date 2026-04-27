// End-to-end check that confirms every frontend mutation persists to Aiven.
// For each operation, we call the public HTTP API the way the frontend does,
// then we query Aiven *directly* (bypassing the API) and compare the row.

const mysql = require("mysql2/promise");

const API = process.env.API_URL || "http://localhost:3000";
const TEST_USER = `verify_${Date.now()}`;
const TEST_NAME = "Persistence Check";
const ISBN = "1006"; // The Hobbit

function aivenPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || "mysql-493f1ce-snehavechoor-9509.b.aivencloud.com",
    user: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD || "AVNS_kOsb_af8qwPk7TDILBe",
    database: process.env.DB_NAME || "defaultdb",
    port: Number(process.env.DB_PORT || 21996),
    ssl: { rejectUnauthorized: false }
  });
}

function getCookie(res, jar) {
  const raw = res.headers.getSetCookie?.() || res.headers.get("set-cookie");
  if (!raw) return jar;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((c) => c.split(";")[0]).join("; ");
}

async function call(method, path, body, cookieJar) {
  const headers = { "content-type": "application/json" };
  if (cookieJar) headers.cookie = cookieJar;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { res, data };
}

function ok(label, condition, detail) {
  const mark = condition ? "PASS" : "FAIL";
  console.log(`${mark}  ${label}${detail ? ` -> ${detail}` : ""}`);
  if (!condition) process.exitCode = 1;
}

async function main() {
  const pool = aivenPool();
  let cookieJar = "";

  try {
    const health = await call("GET", "/health");
    ok(
      "Backend is talking to Aiven",
      health.data?.dbMode === "aiven",
      `dbMode=${health.data?.dbMode}`
    );
    if (health.data?.dbMode !== "aiven") {
      console.error("Aborting: backend is not connected to Aiven.");
      return;
    }

    // --- 1) Login persists user_profile ---
    const login = await call("POST", "/api/auth/login", {
      username: TEST_USER,
      name: TEST_NAME
    });
    cookieJar = getCookie(login.res, cookieJar);
    ok("API login succeeded", login.res.status === 200);

    const [users] = await pool.query(
      "SELECT username, name FROM user_profile WHERE username = ?",
      [TEST_USER]
    );
    ok(
      "Aiven row in user_profile after login",
      users.length === 1 && users[0].name === TEST_NAME,
      JSON.stringify(users[0])
    );

    // --- 2) Add to reading log creates row with NULL date_finished ---
    const add = await call(
      "POST",
      "/api/reading-log",
      { username: TEST_USER, isbn: ISBN, isFavorite: false },
      cookieJar
    );
    ok("API add-to-reading-log succeeded", add.res.status === 201);
    const entryId = add.data?.entryId;

    const [logRows1] = await pool.query(
      "SELECT username, entry_id, isbn, date_finished, is_favorite FROM reading_log_entry WHERE username = ? AND entry_id = ?",
      [TEST_USER, entryId]
    );
    ok(
      "Aiven row in reading_log_entry after add",
      logRows1.length === 1 && logRows1[0].isbn === ISBN,
      JSON.stringify(logRows1[0])
    );
    ok(
      "date_finished is NULL on initial add",
      logRows1[0]?.date_finished === null,
      `date_finished=${JSON.stringify(logRows1[0]?.date_finished)}`
    );
    ok(
      "is_favorite is 0/false on initial add",
      Number(logRows1[0]?.is_favorite) === 0,
      `is_favorite=${logRows1[0]?.is_favorite}`
    );

    // --- 3) Duplicate add is rejected ---
    const dupe = await call(
      "POST",
      "/api/reading-log",
      { username: TEST_USER, isbn: ISBN, isFavorite: false },
      cookieJar
    );
    ok(
      "API rejects duplicate (409)",
      dupe.res.status === 409,
      `status=${dupe.res.status} body=${JSON.stringify(dupe.data)}`
    );

    // --- 4) Update finished-date persists ---
    const targetDate = "2026-04-27";
    const upd = await call(
      "PATCH",
      `/api/reading-log/${TEST_USER}/${entryId}`,
      { dateFinished: targetDate },
      cookieJar
    );
    ok("API date update succeeded", upd.res.status === 200);

    const [logRows2] = await pool.query(
      "SELECT date_finished FROM reading_log_entry WHERE username = ? AND entry_id = ?",
      [TEST_USER, entryId]
    );
    const stored = logRows2[0]?.date_finished;
    const storedString =
      stored instanceof Date ? stored.toISOString().slice(0, 10) : String(stored).slice(0, 10);
    ok(
      "Aiven row reflects new date_finished",
      storedString === targetDate,
      `date_finished=${storedString}`
    );

    // --- 5) Toggle favorite persists ---
    const fav = await call(
      "PATCH",
      `/api/reading-log/${TEST_USER}/${entryId}/favorite`,
      { isFavorite: true },
      cookieJar
    );
    ok("API favorite toggle succeeded", fav.res.status === 200);

    const [logRows3] = await pool.query(
      "SELECT is_favorite FROM reading_log_entry WHERE username = ? AND entry_id = ?",
      [TEST_USER, entryId]
    );
    ok(
      "Aiven row reflects is_favorite=true",
      Number(logRows3[0]?.is_favorite) === 1,
      `is_favorite=${logRows3[0]?.is_favorite}`
    );

    // --- 6) Clearing the date back to NULL persists ---
    const clr = await call(
      "PATCH",
      `/api/reading-log/${TEST_USER}/${entryId}`,
      { dateFinished: null },
      cookieJar
    );
    ok("API date clear succeeded", clr.res.status === 200);

    const [logRows4] = await pool.query(
      "SELECT date_finished FROM reading_log_entry WHERE username = ? AND entry_id = ?",
      [TEST_USER, entryId]
    );
    ok(
      "Aiven row reflects NULL date_finished after clear",
      logRows4[0]?.date_finished === null,
      `date_finished=${JSON.stringify(logRows4[0]?.date_finished)}`
    );

    // --- 7) Submit review writes to review and updates book.average_rating ---
    const [bookBefore] = await pool.query(
      "SELECT average_rating FROM book WHERE isbn = ?",
      [ISBN]
    );
    const review = await call(
      "POST",
      "/api/reviews",
      {
        username: TEST_USER,
        isbn: ISBN,
        starRating: 1,
        reviewText: "verifyAiven persistence test"
      },
      cookieJar
    );
    ok("API submit-review succeeded", review.res.status === 201);

    const [reviewRows] = await pool.query(
      "SELECT review_id, star_rating, review_text FROM review WHERE username = ? AND isbn = ?",
      [TEST_USER, ISBN]
    );
    ok(
      "Aiven row in review after submit",
      reviewRows.length === 1 && reviewRows[0].star_rating === 1,
      JSON.stringify(reviewRows[0])
    );

    const [bookAfter] = await pool.query(
      "SELECT average_rating FROM book WHERE isbn = ?",
      [ISBN]
    );
    ok(
      "book.average_rating changed after review (was " +
        Number(bookBefore[0]?.average_rating).toFixed(2) +
        ")",
      Number(bookAfter[0]?.average_rating) !== Number(bookBefore[0]?.average_rating),
      `now=${Number(bookAfter[0]?.average_rating).toFixed(2)}`
    );

    // --- 8) Review deletion is enforced and persists ---
    const reviewId = reviewRows[0].review_id;

    const otherUser = `verify_other_${Date.now()}`;
    const otherLogin = await call("POST", "/api/auth/login", {
      username: otherUser,
      name: "Other"
    });
    const otherCookie = getCookie(otherLogin.res, "");
    const forbidden = await call(
      "DELETE",
      `/api/reviews/${reviewId}`,
      null,
      otherCookie
    );
    ok(
      "Other user cannot delete someone else's review (403)",
      forbidden.res.status === 403,
      `status=${forbidden.res.status}`
    );

    const unauth = await call("DELETE", `/api/reviews/${reviewId}`, null, "");
    ok(
      "Anonymous user cannot delete a review (401)",
      unauth.res.status === 401,
      `status=${unauth.res.status}`
    );

    const del = await call(
      "DELETE",
      `/api/reviews/${reviewId}`,
      null,
      cookieJar
    );
    ok("Owner can delete their review (200)", del.res.status === 200);

    const [reviewRowsAfter] = await pool.query(
      "SELECT review_id FROM review WHERE review_id = ?",
      [reviewId]
    );
    ok(
      "Aiven row removed from review after delete",
      reviewRowsAfter.length === 0,
      `rows=${reviewRowsAfter.length}`
    );

    const [bookFinal] = await pool.query(
      "SELECT average_rating FROM book WHERE isbn = ?",
      [ISBN]
    );
    ok(
      "book.average_rating refreshed after delete (was " +
        Number(bookAfter[0]?.average_rating).toFixed(2) +
        ")",
      Number(bookFinal[0]?.average_rating) !== Number(bookAfter[0]?.average_rating),
      `now=${Number(bookFinal[0]?.average_rating).toFixed(2)}`
    );

    await pool.query("DELETE FROM user_profile WHERE username = ?", [otherUser]);
  } finally {
    // Best-effort cleanup so we don't leave verify_ users in the DB.
    try {
      await pool.query("DELETE FROM review WHERE username = ?", [TEST_USER]);
      await pool.query("DELETE FROM reading_log_entry WHERE username = ?", [TEST_USER]);
      await pool.query("DELETE FROM user_profile WHERE username = ?", [TEST_USER]);

      // Refresh the average_rating for the book we touched so it stays accurate.
      const [avgRows] = await pool.query(
        "SELECT COALESCE(AVG(star_rating),0) AS a FROM review WHERE isbn = ?",
        [ISBN]
      );
      const avg = Number(avgRows[0]?.a || 0).toFixed(2);
      await pool.query("UPDATE book SET average_rating = ? WHERE isbn = ?", [avg, ISBN]);
    } catch (err) {
      console.warn("Cleanup warning:", err.message);
    }
    await pool.end();
  }
}

main().catch((err) => {
  console.error("verify failed:", err);
  process.exitCode = 1;
});
