import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function LogoMark() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-cream-50 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5v-17z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 7h7M9 10.5h7M9 14h5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-serif text-xl font-semibold tracking-tight text-brand-900">
        Story<span className="text-brand-500">Brooke</span>
      </span>
    </span>
  );
}

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (location.pathname !== "/") setSearchTerm("");
  }, [location.pathname]);

  function onSubmit(event) {
    event.preventDefault();
    const q = searchTerm.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link to="/" className="self-start">
          <LogoMark />
        </Link>

        <form onSubmit={onSubmit} className="flex-1 sm:max-w-md">
          <label className="sr-only" htmlFor="navbar-search">
            Search books
          </label>
          <div className="relative">
            <input
              id="navbar-search"
              className="input pl-10"
              placeholder="Search by title, author, or ISBN"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </form>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `btn-ghost ${isActive ? "bg-cream-100 text-brand-800" : ""}`
            }
          >
            Browse
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `btn-ghost ${isActive ? "bg-cream-100 text-brand-800" : ""}`
            }
          >
            Dashboard
          </NavLink>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-brand-600 sm:inline">
                Hi, <span className="font-semibold text-brand-800">{user?.name || user?.username}</span>
              </span>
              <button type="button" className="btn-secondary" onClick={logout}>
                Sign out
              </button>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
