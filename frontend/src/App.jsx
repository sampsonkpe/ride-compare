import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Compare from "./pages/Compare";
import CompareResults from "./pages/CompareResults";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Favourites from "./pages/Favourites";

import RequireAuth from "./components/auth/RequireAuth";
import ThemeToggle from "./components/ThemeToggle";

function WithThemeToggle({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Subtle top-right toggle inside layout grid */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end pt-4">
          <ThemeToggle />
        </div>
      </div>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-center" />
          <Routes>
            {/* Splash */}
            <Route path="/" element={<Splash />} />

            {/* Auth */}
            <Route
              path="/auth"
              element={
                <WithThemeToggle>
                  <Auth />
                </WithThemeToggle>
              }
            />

            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />

            {/* Compare */}
            <Route
              path="/compare"
              element={
                <WithThemeToggle>
                  <Compare />
                </WithThemeToggle>
              }
            />

            <Route
              path="/compare/results"
              element={
                <WithThemeToggle>
                  <CompareResults />
                </WithThemeToggle>
              }
            />

            {/* Protected */}
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <WithThemeToggle>
                    <Profile />
                  </WithThemeToggle>
                </RequireAuth>
              }
            />

            <Route
              path="/favourites"
              element={
                <RequireAuth>
                  <WithThemeToggle>
                    <Favourites />
                  </WithThemeToggle>
                </RequireAuth>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}