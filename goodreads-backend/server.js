const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
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
  queueLimit: 0
});

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
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
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

app.post("/api/reading-log", async (req, res) => {
  try {
    const { username, isbn, dateFinished, isFavorite } = req.body;
    if (!username || !isbn) {
      return res.status(400).json({ error: "username and isbn are required" });
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
      [username, nextEntryId, isbn, dateFinished || null, Boolean(isFavorite)]
    );

    res.status(201).json({ message: "Reading log entry created", entryId: nextEntryId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/reading-log/:username/:entryId/favorite", async (req, res) => {
  try {
    const { username, entryId } = req.params;
    const { isFavorite } = req.body;
    await pool.query(
      `UPDATE reading_log_entry SET is_favorite = ? WHERE username = ? AND entry_id = ?`,
      [Boolean(isFavorite), username, Number(entryId)]
    );
    res.json({ message: "Favorite updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error.message);
    process.exit(1);
  });