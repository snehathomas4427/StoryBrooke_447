// fake in memory db that mimics mysql2 promise
// only kicks in when aiven is unreachable so we can still demo the app offline
// stores everything in plain js maps and arrays

const profiles = new Map();
const books = new Map();
const reviews = [];
const readingLog = [];

function noop() {
  return [{}, []];
}

// wipes all the in memory data
function reset() {
  profiles.clear();
  books.clear();
  reviews.length = 0;
  readingLog.length = 0;
}

// fills the in memory db with the same sample data we use on aiven
// so the app looks the same in both modes
function seed() {
  books.set("isbn-1", {
    isbn: "isbn-1",
    title: "The Hobbit",
    author: "J. R. R. Tolkien",
    average_rating: 4.5,
    summary: "Bilbo's adventure."
  });
  books.set("isbn-2", {
    isbn: "isbn-2",
    title: "Beloved",
    author: "Toni Morrison",
    average_rating: 4.2,
    summary: "A haunting tale of memory."
  });

  // Books that mirror insert_data.sql so the in-memory dev mode looks like
  // the real cloud DB content.
  const sampleBooks = [
    ["4512", "Harry Potter", "JK Rowling", 5, "boy with magic"],
    ["6642", "Jane Eyre", "Charlotte Brontë", 2, "orphaned governess overcomes a traumatic childhood and strict societal limitations to find love, independence, and a sense of belonging"],
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
  for (const [isbn, title, author, rating, summary] of sampleBooks) {
    books.set(isbn, {
      isbn,
      title,
      author,
      average_rating: rating,
      summary
    });
  }

  const sampleProfiles = [
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
  for (const [username, name, date_joined] of sampleProfiles) {
    profiles.set(username, { username, name, date_joined });
  }

  const sampleReviews = [
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
    ["miaF", "1001", 5, "Still a masterpiece", "2025-03-29 12:10:00"],
    ["loganW", "1002", 5, "Scarily relevant", "2025-03-30 13:25:00"]
  ];
  for (const [username, isbn, star_rating, review_text, time_posted] of sampleReviews) {
    reviews.push({
      review_id: reviews.length + 1,
      username,
      isbn,
      star_rating,
      review_text,
      time_posted
    });
  }

  const sampleLog = [
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
  const entryCounters = new Map();
  for (const [username, isbn, date_finished] of sampleLog) {
    const next = (entryCounters.get(username) || 0) + 1;
    entryCounters.set(username, next);
    readingLog.push({
      username,
      entry_id: next,
      isbn,
      date_finished,
      is_favorite: false
    });
  }
}

// pattern matches on the start of the sql string to figure out what real query is being asked
// then emulates it on the in memory data
// not a full sql parser just enough cases to cover the routes in server js
async function query(sql, params = []) {
  const text = String(sql).trim();
  const lower = text.toLowerCase();

  if (lower.startsWith("create table")) return noop();

  if (lower === "select 1") return [[{ 1: 1 }], []];

  if (lower.startsWith("select username, name, date_joined from user_profile")) {
    const username = params[0];
    const row = profiles.get(username);
    return [row ? [row] : [], []];
  }

  if (lower.startsWith("insert into user_profile")) {
    const [username, name, date_joined] = params;
    profiles.set(username, { username, name, date_joined });
    return [{ affectedRows: 1 }, []];
  }

  if (lower.startsWith("select coalesce(avg(star_rating)")) {
    const isbn = params[0];
    const ratings = reviews.filter((r) => r.isbn === isbn).map((r) => r.star_rating);
    const avg = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;
    return [[{ avg_rating: avg }], []];
  }

  if (lower.startsWith("update book set average_rating")) {
    const [avg, isbn] = params;
    const book = books.get(isbn);
    if (book) book.average_rating = Number(avg);
    return [{ affectedRows: book ? 1 : 0 }, []];
  }

  if (lower.startsWith("insert into book")) {
    const [isbn, title, author, summary] = params;
    books.set(isbn, {
      isbn,
      title,
      author,
      average_rating: 0,
      summary: summary || null
    });
    return [{ affectedRows: 1 }, []];
  }

  if (lower.startsWith("select isbn, title, author, average_rating from book")) {
    const list = Array.from(books.values()).map((b) => ({
      isbn: b.isbn,
      title: b.title,
      author: b.author,
      average_rating: b.average_rating
    }));
    if (lower.includes("where")) {
      const q = String(params[0] || "").replace(/%/g, "").toLowerCase();
      return [
        list.filter(
          (b) =>
            b.isbn.toLowerCase().includes(q) ||
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q)
        ),
        []
      ];
    }
    return [list, []];
  }

  if (lower.startsWith("select isbn, title, author, average_rating, summary from book")) {
    const isbn = params[0];
    const b = books.get(isbn);
    return [b ? [b] : [], []];
  }

  if (lower.startsWith("select review_id, username, star_rating")) {
    const isbn = params[0];
    return [
      reviews
        .filter((r) => r.isbn === isbn)
        .map((r) => ({
          review_id: r.review_id,
          username: r.username,
          star_rating: r.star_rating,
          review_text: r.review_text,
          time_posted: r.time_posted
        })),
      []
    ];
  }

  if (lower.startsWith("insert into review")) {
    const [username, isbn, star_rating, review_text] = params;
    const nextId = reviews.reduce((m, r) => Math.max(m, Number(r.review_id) || 0), 0) + 1;
    reviews.push({
      review_id: nextId,
      username,
      isbn,
      star_rating: Number(star_rating),
      review_text,
      time_posted: new Date().toISOString()
    });
    return [{ affectedRows: 1, insertId: nextId }, []];
  }

  if (lower.startsWith("select username, isbn from review where review_id")) {
    const reviewId = Number(params[0]);
    const row = reviews.find((r) => Number(r.review_id) === reviewId);
    return [row ? [{ username: row.username, isbn: row.isbn }] : [], []];
  }

  if (lower.startsWith("delete from review where review_id")) {
    const reviewId = Number(params[0]);
    const idx = reviews.findIndex((r) => Number(r.review_id) === reviewId);
    if (idx >= 0) reviews.splice(idx, 1);
    return [{ affectedRows: idx >= 0 ? 1 : 0 }, []];
  }

  if (lower.startsWith("select coalesce(max(entry_id)")) {
    const username = params[0];
    const max = readingLog
      .filter((r) => r.username === username)
      .reduce((m, r) => Math.max(m, r.entry_id), 0);
    return [[{ max_entry_id: max }], []];
  }

  if (
    lower.startsWith("select entry_id from reading_log_entry where username") &&
    lower.includes("is_favorite")
  ) {
    const [username, isbn, excludeEntryId] = params;
    const matches = readingLog
      .filter(
        (r) =>
          r.username === username &&
          r.isbn === isbn &&
          r.is_favorite &&
          (excludeEntryId === undefined || r.entry_id !== Number(excludeEntryId))
      )
      .map((r) => ({ entry_id: r.entry_id }));
    return [matches.slice(0, 1), []];
  }

  if (lower.startsWith("select entry_id, is_favorite from reading_log_entry where username")) {
    const [username, isbn] = params;
    const row = readingLog.find((r) => r.username === username && r.isbn === isbn);
    return [
      row ? [{ entry_id: row.entry_id, is_favorite: !!row.is_favorite }] : [],
      []
    ];
  }

  if (lower.startsWith("select isbn from reading_log_entry where username")) {
    const [username, entryId] = params;
    const row = readingLog.find(
      (r) => r.username === username && r.entry_id === Number(entryId)
    );
    return [row ? [{ isbn: row.isbn }] : [], []];
  }

  if (lower.startsWith("insert into reading_log_entry")) {
    const [username, entry_id, isbn, date_finished, is_favorite] = params;
    readingLog.push({
      username,
      entry_id: Number(entry_id),
      isbn,
      date_finished,
      is_favorite: !!is_favorite
    });
    return [{ affectedRows: 1 }, []];
  }

  if (lower.startsWith("update reading_log_entry set is_favorite")) {
    if (lower.includes("where username = ? and entry_id = ?") && params.length === 2) {
      const [username, entry_id] = params;
      const row = readingLog.find(
        (r) => r.username === username && r.entry_id === Number(entry_id)
      );
      if (row) row.is_favorite = true;
      return [{ affectedRows: row ? 1 : 0 }, []];
    }
    const [is_favorite, username, entry_id] = params;
    const row = readingLog.find(
      (r) => r.username === username && r.entry_id === Number(entry_id)
    );
    if (row) row.is_favorite = !!is_favorite;
    return [{ affectedRows: row ? 1 : 0 }, []];
  }

  if (lower.startsWith("update reading_log_entry set date_finished")) {
    const [date_finished, username, entry_id] = params;
    const row = readingLog.find(
      (r) => r.username === username && r.entry_id === Number(entry_id)
    );
    if (row) row.date_finished = date_finished;
    return [{ affectedRows: row ? 1 : 0 }, []];
  }

  if (lower.startsWith("select rle.entry_id")) {
    const username = params[0];
    return [
      readingLog
        .filter((r) => r.username === username)
        .map((r) => {
          const b = books.get(r.isbn) || {};
          return {
            entry_id: r.entry_id,
            date_finished: r.date_finished,
            is_favorite: r.is_favorite,
            isbn: r.isbn,
            title: b.title,
            author: b.author,
            average_rating: b.average_rating
          };
        }),
      []
    ];
  }

  if (lower.startsWith("select b.isbn, b.title, b.author, b.average_rating")) {
    const username = params[0];
    return [
      readingLog
        .filter((r) => r.username === username && r.is_favorite)
        .map((r) => {
          const b = books.get(r.isbn) || {};
          return {
            isbn: r.isbn,
            title: b.title,
            author: b.author,
            average_rating: b.average_rating
          };
        }),
      []
    ];
  }

  if (lower.startsWith("select count(*) as total_reviews")) {
    const username = params[0];
    const total = reviews.filter((r) => r.username === username).length;
    return [[{ total_reviews: total }], []];
  }

  return [[], []];
}

const pool = {
  query,
  end: async () => {}
};

module.exports = {
  createPool: () => pool,
  __store: { profiles, books, reviews, readingLog, reset, seed }
};
