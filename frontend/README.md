# StoryBrooke Frontend

A modern React + Vite + Tailwind CSS frontend for StoryBrooke, integrated with the
existing Express + MySQL backend in `../goodreads-backend`.

## Stack

- React 18 + React Router 6 (SPA routing)
- Vite 5 (dev server / build)
- Tailwind CSS 3 (styling system)
- Axios (HTTP client, with credentials for session cookies)

## Folder structure

```
frontend/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   ├── client.js        # Axios instance with credentials
    │   ├── auth.js          # /api/auth/{login,me,logout}
    │   ├── books.js         # /api/books, /api/books/search
    │   ├── reviews.js       # /api/reviews
    │   ├── readingLog.js    # /api/reading-log + favorite toggle
    │   └── dashboard.js     # /api/profiles/:username/dashboard
    ├── components/
    │   ├── Navbar.jsx
    │   ├── BookCard.jsx
    │   ├── ReviewCard.jsx
    │   ├── StarRating.jsx
    │   ├── EmptyState.jsx
    │   ├── LoadingState.jsx
    │   └── LoginGate.jsx
    ├── context/
    │   └── AuthContext.jsx  # session state + login/logout
    └── pages/
        ├── SearchPage.jsx
        ├── BookDetailPage.jsx
        └── DashboardPage.jsx
```

## Getting started

You need two terminals — one for the backend, one for the frontend. Run each
command on its own line.

**Windows PowerShell** (5.1 does not support `&&`; use `;` or run separately):

```powershell
# Terminal 1 — backend
cd goodreads-backend
npm install
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

**macOS / Linux / PowerShell 7+ / Git Bash**:

```bash
# Terminal 1 — backend
cd goodreads-backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && cp .env.example .env && npm run dev
```

The frontend dev server runs on http://localhost:5173 and talks to the backend
at `VITE_API_BASE_URL` (default `http://localhost:3000`).

## Running tests

```powershell
# Backend smoke tests (uses an in-memory MySQL stub, no DB required)
cd goodreads-backend
npm test

# Frontend API client tests (uses a local mock HTTP server)
cd frontend
npm test
```

## Example API calls

```js
// GET books matching a query
await axios.get("http://localhost:3000/api/books/search", {
  params: { q: "tolkien", limit: 24 },
  withCredentials: true
});

// POST a new review (requires the session cookie set by /api/auth/login)
await axios.post(
  "http://localhost:3000/api/reviews",
  { username: "reader42", isbn: "9780547928227", starRating: 5, reviewText: "Excellent" },
  { withCredentials: true }
);
```

## Routes

- `/` — Home / Search
- `/books/:isbn` — Book Detail (rate, review, mark finished, favorite)
- `/dashboard` — User Dashboard (reading log, favorites, want-to-read)
