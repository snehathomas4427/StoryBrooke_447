import { Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar.jsx";
import { LoginGate } from "./components/LoginGate.jsx";
import { SearchPage } from "./pages/SearchPage.jsx";
import { BookDetailPage } from "./pages/BookDetailPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";

export default function App() {
  return (
    <LoginGate>
      <div className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/books/:isbn" element={<BookDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-brand-100 bg-cream-50 py-6 text-center text-xs text-brand-500">
          StoryBrooke · A book review and reading tracker
        </footer>
      </div>
    </LoginGate>
  );
}
