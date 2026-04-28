// blocks the rest of the app until the user is signed in
// shows a loading state first then either the children or the login form

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginGate({ children }) {
  const { isAuthenticated, status, login } = useAuth();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-brand-500">
        Loading session...
      </div>
    );
  }

  if (isAuthenticated) return children;

  // hits the login endpoint
  // if the username is new the backend just creates a new profile on the fly
  async function onSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    const trimmedUser = username.trim();
    const trimmedName = name.trim();
    if (!trimmedUser) {
      setErrorMessage("Please enter a username.");
      return;
    }
    setSubmitting(true);
    const result = await login({ username: trimmedUser, name: trimmedName });
    setSubmitting(false);
    if (!result.ok) setErrorMessage(result.error || "Could not sign in.");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="card flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Welcome to StoryBrooke</h1>
          <p className="mt-1 text-sm text-brand-600">
            Sign in with a username to keep your reading log, favorites, and reviews
            tied to your profile.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-700">
            Username
            <input
              className="input"
              placeholder="reader42"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-700">
            Display name
            <input
              className="input"
              placeholder="Optional - shown the first time you sign in"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </label>
          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Signing in..." : "Continue"}
          </button>
          <p className="text-xs text-brand-500">
            New username? We'll create your profile automatically.
          </p>
        </form>
      </div>
    </div>
  );
}
