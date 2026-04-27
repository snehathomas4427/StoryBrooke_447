// Idempotently seeds the live (Aiven) MySQL database with the canonical
// StoryBrooke fixtures. Safe to run repeatedly: each row is inserted with
// INSERT ... ON DUPLICATE KEY UPDATE so existing rows get refreshed instead
// of erroring out. Reviews are not duplicated because we look them up by
// (username, isbn, time_posted) before inserting.

const mysql = require("mysql2/promise");

const BOOKS = [
  ["4512", "Harry Potter", "JK Rowling", 5, "boy with magic"],
  [
    "6642",
    "Jane Eyre",
    "Charlotte Brontë",
    2,
    "orphaned governess overcomes a traumatic childhood and strict societal limitations to find love, independence, and a sense of belonging"
  ],
  ["1001", "To Kill a Mockingbird", "Harper Lee", 5, "racial injustice in the Deep South"],
  ["1002", "1984", "George Orwell", 5, "dystopian surveillance society"],
  ["1003", "Pride and Prejudice", "Jane Austen", 5, "romance and social class"],
  ["1004", "The Great Gatsby", "F. Scott Fitzgerald", 4, "wealth, love, and tragedy in the 1920s"],
  ["1005", "Moby Dick", "Herman Melville", 3, "obsession with a white whale"],
  ["1006", "The Hobbit", "J.R.R. Tolkien", 5, "hobbit goes on an adventure"],
  ["1007", "Lord of the Flies", "William Golding", 4, "boys stranded on an island"],
  ["1008", "Harry Potter and the Sorcerers Stone", "J.K. Rowling", 5, "wizard discovers he is famous"],
  ["1011", "The Catcher in the Rye", "J.D. Salinger", 4, "teen rebellion and alienation"],
  ["1012", "The Alchemist", "Paulo Coelho", 5, "journey to follow your dreams"],
  ["1013", "The Da Vinci Code", "Dan Brown", 4, "religious mystery and symbols"],
  ["1014", "The Hunger Games", "Suzanne Collins", 5, "fight for survival in a dystopia"],
  ["1015", "Catching Fire", "Suzanne Collins", 5, "rebellion grows in the districts"],
  ["1016", "Mockingjay", "Suzanne Collins", 5, "final war against the Capitol"],
  ["1017", "The Book Thief", "Markus Zusak", 5, "girl steals books in Nazi Germany"],
  ["1018", "Animal Farm", "George Orwell", 5, "farm animals overthrow humans"],
  ["1019", "The Chronicles of Narnia", "C.S. Lewis", 3, "children discover magical world"],
  ["1020", "The Fault in Our Stars", "John Green", 4, "teen romance with illness"]
];

const PROFILES = [
  ["bookLover", "Andrew Garfield", "2025-01-10"],
  ["alex99", "Alex Johnson", "2024-11-02"],
  ["maria7", "Maria Garcia", "2025-02-14"],
  ["johnnyB", "John Brown", "2024-09-21"],
  ["lisa_k", "Lisa Kim", "2025-03-01"],
  ["danielx", "Daniel Xu", "2024-12-12"],
  ["emilyw", "Emily Wilson", "2025-01-18"],
  ["chrisP", "Chris Patel", "2024-10-30"],
  ["nina_s", "Nina Singh", "2025-02-05"],
  ["mikeT", "Michael Turner", "2024-08-19"],
  ["oliviaR", "Olivia Reed", "2025-03-10"],
  ["ethanL", "Ethan Lee", "2024-07-25"],
  ["sophiaM", "Sophia Martinez", "2025-01-28"],
  ["liamH", "Liam Harris", "2024-09-14"],
  ["avaG", "Ava Green", "2025-02-20"],
  ["noahB", "Noah Bennett", "2024-11-11"],
  ["isabellaC", "Isabella Clark", "2025-03-15"],
  ["jackD", "Jack Davis", "2024-12-01"],
  ["miaF", "Mia Foster", "2025-01-05"],
  ["loganW", "Logan White", "2024-10-08"]
];

const REVIEWS = [
  ["bookLover", "1001", 5, "Amazing classic!", "2025-01-12 10:30:00"],
  ["alex99", "1002", 5, "Very thought-provoking", "2025-02-01 14:20:00"],
  ["maria7", "1003", 4, "Great romance story", "2025-02-10 09:15:00"],
  ["johnnyB", "1004", 4, "Loved the symbolism", "2025-02-15 18:45:00"],
  ["lisa_k", "1005", 3, "A bit slow but good", "2025-03-01 12:00:00"],
  ["danielx", "1006", 5, "Fantastic adventure", "2025-03-03 16:10:00"],
  ["emilyw", "1007", 4, "Very deep meaning", "2025-03-05 11:25:00"],
  ["chrisP", "1008", 5, "Magical and fun", "2025-03-07 13:40:00"],
  ["nina_s", "1011", 4, "Relatable teen struggles", "2025-03-10 17:00:00"],
  ["mikeT", "1012", 5, "Life changing book", "2025-03-12 19:30:00"],
  ["oliviaR", "1013", 4, "Interesting mystery", "2025-03-14 08:20:00"],
  ["ethanL", "1014", 5, "Very exciting!", "2025-03-16 20:10:00"],
  ["sophiaM", "1015", 5, "Even better sequel", "2025-03-18 21:45:00"],
  ["liamH", "1016", 5, "Great conclusion", "2025-03-20 09:50:00"],
  ["avaG", "1017", 5, "Very emotional", "2025-03-22 10:05:00"],
  ["noahB", "1018", 5, "Powerful message", "2025-03-24 14:15:00"],
  ["isabellaC", "1019", 3, "Good fantasy world", "2025-03-26 16:30:00"],
  ["jackD", "1020", 4, "Sad but beautiful", "2025-03-28 18:00:00"],
  ["bookLover", "1001", 5, "Still a masterpiece", "2025-03-29 12:10:00"],
  ["alex99", "1002", 5, "Scarily relevant", "2025-03-30 13:25:00"]
];

const READING_LOG = [
  ["bookLover", "1001", "2025-01-10"],
  ["alex99", "1002", "2025-01-11"],
  ["maria7", "1003", "2025-01-12"],
  ["johnnyB", "1004", "2025-01-13"],
  ["lisa_k", "1005", "2025-01-14"],
  ["danielx", "1006", "2025-01-15"],
  ["emilyw", "1007", "2025-01-16"],
  ["chrisP", "1008", "2025-01-17"],
  ["nina_s", "1011", "2025-01-18"],
  ["mikeT", "1012", "2025-01-19"],
  ["oliviaR", "1013", "2025-01-20"],
  ["ethanL", "1014", "2025-01-21"],
  ["sophiaM", "1015", "2025-01-22"],
  ["liamH", "1016", "2025-01-23"],
  ["avaG", "1017", "2025-01-24"],
  ["noahB", "1018", "2025-01-25"],
  ["isabellaC", "1019", "2025-01-26"],
  ["jackD", "1020", "2025-01-27"],
  ["miaF", "1001", "2025-01-28"],
  ["loganW", "1002", "2025-01-29"]
];

async function ensureSchema(pool) {
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

async function seedBooks(pool) {
  for (const [isbn, title, author, rating, summary] of BOOKS) {
    await pool.query(
      `INSERT INTO book (isbn, title, author, average_rating, summary)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         author = VALUES(author),
         average_rating = VALUES(average_rating),
         summary = VALUES(summary)`,
      [isbn, title, author, rating, summary]
    );
  }
}

async function seedProfiles(pool) {
  for (const [username, name, dateJoined] of PROFILES) {
    await pool.query(
      `INSERT INTO user_profile (username, name, date_joined)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), date_joined = VALUES(date_joined)`,
      [username, name, dateJoined]
    );
  }
}

async function seedReviews(pool) {
  for (const [username, isbn, starRating, reviewText, timePosted] of REVIEWS) {
    const [existing] = await pool.query(
      `SELECT review_id FROM review WHERE username = ? AND isbn = ? AND time_posted = ? LIMIT 1`,
      [username, isbn, timePosted]
    );
    if (existing.length > 0) continue;
    await pool.query(
      `INSERT INTO review (username, isbn, star_rating, review_text, time_posted)
       VALUES (?, ?, ?, ?, ?)`,
      [username, isbn, starRating, reviewText, timePosted]
    );
  }
}

async function refreshAverageRatings(pool) {
  for (const [isbn] of BOOKS) {
    const [rows] = await pool.query(
      `SELECT COALESCE(AVG(star_rating), 0) AS avg_rating FROM review WHERE isbn = ?`,
      [isbn]
    );
    const avg = Number(rows[0]?.avg_rating || 0).toFixed(2);
    if (Number(avg) > 0) {
      await pool.query(`UPDATE book SET average_rating = ? WHERE isbn = ?`, [avg, isbn]);
    }
  }
}

async function seedReadingLog(pool) {
  const counters = new Map();
  for (const [username, isbn, dateFinished] of READING_LOG) {
    const [existing] = await pool.query(
      `SELECT entry_id FROM reading_log_entry WHERE username = ? AND isbn = ? LIMIT 1`,
      [username, isbn]
    );
    if (existing.length > 0) continue;

    if (!counters.has(username)) {
      const [maxRows] = await pool.query(
        `SELECT COALESCE(MAX(entry_id), 0) AS max_entry_id FROM reading_log_entry WHERE username = ?`,
        [username]
      );
      counters.set(username, Number(maxRows[0].max_entry_id));
    }
    const next = counters.get(username) + 1;
    counters.set(username, next);

    await pool.query(
      `INSERT INTO reading_log_entry (username, entry_id, isbn, date_finished, is_favorite)
       VALUES (?, ?, ?, ?, FALSE)`,
      [username, next, isbn, dateFinished]
    );
  }
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "mysql-493f1ce-snehavechoor-9509.b.aivencloud.com",
    user: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD || "AVNS_kOsb_af8qwPk7TDILBe",
    database: process.env.DB_NAME || "defaultdb",
    port: Number(process.env.DB_PORT || 21996),
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 10000
  });

  try {
    console.log("Pinging Aiven...");
    await pool.query("SELECT 1");
    console.log("Connected. Ensuring schema...");
    await ensureSchema(pool);

    console.log("Seeding books...");
    await seedBooks(pool);

    console.log("Seeding profiles...");
    await seedProfiles(pool);

    console.log("Seeding reviews...");
    await seedReviews(pool);

    console.log("Refreshing average ratings...");
    await refreshAverageRatings(pool);

    console.log("Seeding reading log...");
    await seedReadingLog(pool);

    const [bookCount] = await pool.query(`SELECT COUNT(*) AS n FROM book`);
    const [reviewCount] = await pool.query(`SELECT COUNT(*) AS n FROM review`);
    const [logCount] = await pool.query(`SELECT COUNT(*) AS n FROM reading_log_entry`);
    const [userCount] = await pool.query(`SELECT COUNT(*) AS n FROM user_profile`);

    console.log("Seed complete:");
    console.log(`  user_profile      : ${userCount[0].n}`);
    console.log(`  book              : ${bookCount[0].n}`);
    console.log(`  review            : ${reviewCount[0].n}`);
    console.log(`  reading_log_entry : ${logCount[0].n}`);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
