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
    <div className="min-h-screen">
      <div className="fixed right-4 top-4 z-[60]">
        <ThemeToggle />
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
            {/* Public */}
            <Route path="/" element={<Splash />} />

            <Route
              path="/auth"
              element={
                <WithThemeToggle>
                  <Auth />
                </WithThemeToggle>
              }
            />

            {/* Keep old auth routes working, but funnel them into /auth */}
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />

            {/* Public compare */}
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

            {/* Catch all (no toggle here) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
