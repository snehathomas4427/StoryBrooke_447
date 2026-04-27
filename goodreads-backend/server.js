const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const session = require("express-session");

const app = express();
const PORT = 3000;

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = new Set([
  FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(
  session({
    name: "storybrooke.sid",
    secret: process.env.SESSION_SECRET || "storybrooke-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30
    }
  })
);

let pool;
let dbMode = "unknown";

function createRealPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || "mysql-493f1ce-snehavechoor-9509.b.aivencloud.com",
    user: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD || "AVNS_kOsb_af8qwPk7TDILBe",
    database: process.env.DB_NAME || "defaultdb",
    port: Number(process.env.DB_PORT || 21996),
    ssl: {
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000
  });
}

function createStubPool() {
  // Falls back to an in-memory store so the dev server stays usable when
  // the cloud DB is unreachable (e.g. offline).
  const stub = require("./stubMysql.js");
  stub.__store.reset();
  stub.__store.seed();
  return stub.createPool();
}

async function setupPool() {
  if (process.env.DB_MODE === "memory") {
    console.warn("[storybrooke] DB_MODE=memory: using in-memory database.");
    pool = createStubPool();
    dbMode = "memory";
    return;
  }

  const realPool = createRealPool();
  try {
    await Promise.race([
      realPool.query("SELECT 1"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB ping timed out")), 8000)
      )
    ]);
    pool = realPool;
    dbMode = "aiven";
    console.log("[storybrooke] Connected to Aiven MySQL.");
  } catch (err) {
    console.warn(
      `[storybrooke] Could not reach cloud DB (${err.message}). Falling back to in-memory database.`
    );
    try {
      await realPool.end();
    } catch {
      /* ignore */
    }
    pool = createStubPool();
    dbMode = "memory";
  }
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profile (
      username VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      date_joined DATE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS book (
      isbn VARCHAR(20) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      average_rating DECIMAL(3,2) DEFAULT 0,
      summary TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS review (
      review_id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      isbn VARCHAR(20) NOT NULL,
      star_rating INT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
      review_text TEXT,
      time_posted DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_review_user FOREIGN KEY (username) REFERENCES user_profile(username),
      CONSTRAINT fk_review_book FOREIGN KEY (isbn) REFERENCES book(isbn)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reading_log_entry (
      username VARCHAR(50) NOT NULL,
      entry_id INT NOT NULL,
      isbn VARCHAR(20) NOT NULL,
      date_finished DATE,
      is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (username, entry_id),
      CONSTRAINT fk_log_user FOREIGN KEY (username) REFERENCES user_profile(username),
      CONSTRAINT fk_log_book FOREIGN KEY (isbn) REFERENCES book(isbn)
    )
  `);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

// Returns { value: string|null } on success, or { error: string } if invalid.
// `value` will be null when the caller wants to clear the date.
function parseFinishedDate(raw) {
  if (raw === null || raw === undefined || raw === "") {
    return { value: null };
  }
  const asString = String(raw).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asString)) {
    return { error: "dateFinished must be a YYYY-MM-DD date or null" };
  }
  if (asString > todayIsoDate()) {
    return { error: "Date finished cannot be in the future." };
  }
  return { value: asString };
}

async function refreshBookAverageRating(isbn) {
  const [rows] = await pool.query(
    `SELECT COALESCE(AVG(star_rating), 0) AS avg_rating FROM review WHERE isbn = ?`,
    [isbn]
  );
  const avg = Number(rows[0]?.avg_rating || 0).toFixed(2);
  await pool.query(`UPDATE book SET average_rating = ? WHERE isbn = ?`, [avg, isbn]);
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, dbMode });
  } catch (error) {
    res.status(500).json({ ok: false, dbMode, error: error.message });
  }
});

app.post("/api/profiles", async (req, res) => {
  try {
    const { username, name, dateJoined } = req.body;
    if (!username || !name) {
      return res.status(400).json({ error: "username and name are required" });
    }

    const joined = dateJoined || new Date().toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO user_profile (username, name, date_joined) VALUES (?, ?, ?)`,
      [username, name, joined]
    );
    res.status(201).json({ message: "Profile created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/profiles/:username/dashboard", async (req, res) => {
  try {
    const { username } = req.params;

    const [profileRows] = await pool.query(
      `SELECT username, name, date_joined FROM user_profile WHERE username = ?`,
      [username]
    );
    if (!profileRows.length) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const [readingLog] = await pool.query(
      `
      SELECT rle.entry_id, rle.date_finished, rle.is_favorite, b.isbn, b.title, b.author, b.average_rating
      FROM reading_log_entry rle
      JOIN book b ON b.isbn = rle.isbn
      WHERE rle.username = ?
      ORDER BY rle.date_finished DESC, rle.entry_id DESC
      `,
      [username]
    );

    const [favorites] = await pool.query(
      `
      SELECT b.isbn, b.title, b.author, b.average_rating
      FROM reading_log_entry rle
      JOIN book b ON b.isbn = rle.isbn
      WHERE rle.username = ? AND rle.is_favorite = TRUE
      ORDER BY b.title
      `,
      [username]
    );

    const [reviewCountRows] = await pool.query(
      `SELECT COUNT(*) AS total_reviews FROM review WHERE username = ?`,
      [username]
    );

    res.json({
      profile: profileRows[0],
      stats: {
        booksRead: readingLog.length,
        favoriteCount: favorites.length,
        reviewCount: reviewCountRows[0].total_reviews
      },
      readingLog,
      favorites
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const { isbn, title, author, summary } = req.body;
    if (!isbn || !title || !author) {
      return res.status(400).json({ error: "isbn, title and author are required" });
    }

    await pool.query(
      `INSERT INTO book (isbn, title, author, summary, average_rating) VALUES (?, ?, ?, ?, 0)`,
      [isbn, title, author, summary || null]
    );
    res.status(201).json({ message: "Book created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/books/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit || 20), 50);

    if (!q) {
      const [books] = await pool.query(
        `SELECT isbn, title, author, average_rating FROM book ORDER BY title LIMIT ?`,
        [limit]
      );
      return res.json(books);
    }

    const likeValue = `%${q}%`;
    const [books] = await pool.query(
      `
      SELECT isbn, title, author, average_rating
      FROM book
      WHERE isbn LIKE ? OR title LIKE ? OR author LIKE ?
      ORDER BY
        CASE
          WHEN isbn = ? THEN 0
          WHEN title LIKE ? THEN 1
          ELSE 2
        END,
        title
      LIMIT ?
      `,
      [likeValue, likeValue, likeValue, q, `${q}%`, limit]
    );
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/books/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;
    const [books] = await pool.query(
      `SELECT isbn, title, author, average_rating, summary FROM book WHERE isbn = ?`,
      [isbn]
    );
    if (!books.length) {
      return res.status(404).json({ error: "Book not found" });
    }

    const [reviews] = await pool.query(
      `
      SELECT review_id, username, star_rating, review_text, time_posted
      FROM review
      WHERE isbn = ?
      ORDER BY time_posted DESC
      `,
      [isbn]
    );

    res.json({ ...books[0], reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const { username, isbn, starRating, reviewText } = req.body;
    if (!username || !isbn || !starRating) {
      return res.status(400).json({ error: "username, isbn and starRating are required" });
    }
    if (Number(starRating) < 1 || Number(starRating) > 5) {
      return res.status(400).json({ error: "starRating must be between 1 and 5" });
    }

    await pool.query(
      `
      INSERT INTO review (username, isbn, star_rating, review_text, time_posted)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [username, isbn, starRating, reviewText || null]
    );
    await refreshBookAverageRating(isbn);
    res.status(201).json({ message: "Review added" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/reviews/:reviewId", async (req, res) => {
  try {
    const reviewIdNum = Number(req.params.reviewId);
    if (!Number.isFinite(reviewIdNum)) {
      return res.status(400).json({ error: "Invalid review id" });
    }

    const sessionUsername = req.session?.user?.username;
    if (!sessionUsername) {
      return res.status(401).json({ error: "Please sign in to delete reviews." });
    }

    const [rows] = await pool.query(
      `SELECT username, isbn FROM review WHERE review_id = ?`,
      [reviewIdNum]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    const review = rows[0];
    if (review.username !== sessionUsername) {
      return res
        .status(403)
        .json({ error: "You can only delete your own reviews." });
    }

    await pool.query(`DELETE FROM review WHERE review_id = ?`, [reviewIdNum]);
    await refreshBookAverageRating(review.isbn);
    res.json({ message: "Review deleted", reviewId: reviewIdNum });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reading-log", async (req, res) => {
  try {
    const { username, isbn, dateFinished, isFavorite } = req.body;
    if (!username || !isbn) {
      return res.status(400).json({ error: "username and isbn are required" });
    }

    const parsed = parseFinishedDate(dateFinished);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const [existingEntries] = await pool.query(
      `SELECT entry_id, is_favorite FROM reading_log_entry WHERE username = ? AND isbn = ? LIMIT 1`,
      [username, isbn]
    );
    if (existingEntries.length > 0) {
      const existing = existingEntries[0];
      if (isFavorite && !existing.is_favorite) {
        await pool.query(
          `UPDATE reading_log_entry SET is_favorite = TRUE WHERE username = ? AND entry_id = ?`,
          [username, existing.entry_id]
        );
        return res.status(200).json({
          message: "Book is already in your reading log; marked as favorite.",
          entryId: existing.entry_id,
          alreadyInLog: true
        });
      }
      const message = isFavorite
        ? "this book is already in your favorites"
        : "this book is already in your reading log";
      return res.status(409).json({ error: message, entryId: existing.entry_id });
    }

    const [maxEntryIdRows] = await pool.query(
      `SELECT COALESCE(MAX(entry_id), 0) AS max_entry_id FROM reading_log_entry WHERE username = ?`,
      [username]
    );
    const nextEntryId = Number(maxEntryIdRows[0].max_entry_id) + 1;

    await pool.query(
      `
      INSERT INTO reading_log_entry (username, entry_id, isbn, date_finished, is_favorite)
      VALUES (?, ?, ?, ?, ?)
      `,
      [username, nextEntryId, isbn, parsed.value, Boolean(isFavorite)]
    );

    res.status(201).json({ message: "Reading log entry created", entryId: nextEntryId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/reading-log/:username/:entryId", async (req, res) => {
  try {
    const { username, entryId } = req.params;
    const entryIdNum = Number(entryId);
    if (!Number.isFinite(entryIdNum)) {
      return res.status(400).json({ error: "Invalid entry id" });
    }

    if (!Object.prototype.hasOwnProperty.call(req.body || {}, "dateFinished")) {
      return res.status(400).json({ error: "dateFinished is required" });
    }

    const parsed = parseFinishedDate(req.body.dateFinished);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const [result] = await pool.query(
      `UPDATE reading_log_entry SET date_finished = ? WHERE username = ? AND entry_id = ?`,
      [parsed.value, username, entryIdNum]
    );
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: "Reading log entry not found" });
    }
    res.json({ message: "Reading log entry updated", dateFinished: parsed.value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/reading-log/:username/:entryId/favorite", async (req, res) => {
  try {
    const { username, entryId } = req.params;
    const { isFavorite } = req.body;
    const entryIdNum = Number(entryId);

    if (isFavorite) {
      const [entryRows] = await pool.query(
        `SELECT isbn FROM reading_log_entry WHERE username = ? AND entry_id = ?`,
        [username, entryIdNum]
      );
      if (entryRows.length > 0) {
        const isbn = entryRows[0].isbn;
        const [existingFavorites] = await pool.query(
          `SELECT entry_id FROM reading_log_entry WHERE username = ? AND isbn = ? AND is_favorite = TRUE AND entry_id <> ? LIMIT 1`,
          [username, isbn, entryIdNum]
        );
        if (existingFavorites.length > 0) {
          return res
            .status(409)
            .json({ error: "this book is already in your favorites" });
        }
      }
    }

    await pool.query(
      `UPDATE reading_log_entry SET is_favorite = ? WHERE username = ? AND entry_id = ?`,
      [Boolean(isFavorite), username, entryIdNum]
    );
    res.json({ message: "Favorite updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const usernameRaw = req.body?.username;
    const nameRaw = req.body?.name;
    const username = typeof usernameRaw === "string" ? usernameRaw.trim() : "";
    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }
    if (username.length > 50) {
      return res.status(400).json({ error: "username must be 50 characters or fewer" });
    }

    const [existing] = await pool.query(
      `SELECT username, name, date_joined FROM user_profile WHERE username = ?`,
      [username]
    );

    let profile;
    if (existing.length > 0) {
      profile = existing[0];
    } else {
      const fallbackName =
        typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim() : username;
      const today = new Date().toISOString().slice(0, 10);
      await pool.query(
        `INSERT INTO user_profile (username, name, date_joined) VALUES (?, ?, ?)`,
        [username, fallbackName, today]
      );
      profile = { username, name: fallbackName, date_joined: today };
    }

    req.session.user = {
      username: profile.username,
      name: profile.name,
      dateJoined: profile.date_joined
    };

    res.json({ user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/me", (req, res) => {
  if (req.session?.user) {
    return res.json({ user: req.session.user });
  }
  res.json({ user: null });
});

app.post("/api/auth/logout", (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.clearCookie("storybrooke.sid");
    res.json({ ok: true });
  });
});

setupPool()
  .then(() => initDb())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error.message);
    process.exit(1);
  });