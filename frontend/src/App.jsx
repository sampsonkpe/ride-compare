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

import RequireAuth from "./components/auth/RequireAuth";
import AppShell from "./components/layout/AppShell";

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-center" />
          <Routes>
            {/* Splash stays full screen */}
            <Route path="/" element={<Splash />} />

            {/* Auth (single page: login + signup) */}
            <Route
              path="/auth"
              element={
                <AppShell header="auth" maxWidth="max-w-sm">
                  <Auth />
                </AppShell>
              }
            />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />

            {/* Compare */}
            <Route
              path="/compare"
              element={
                <AppShell header="app" maxWidth="max-w-lg">
                  <Compare />
                </AppShell>
              }
            />
            <Route
              path="/compare/results"
              element={
                <AppShell header="app" maxWidth="max-w-lg">
                  <CompareResults />
                </AppShell>
              }
            />

            {/* Profile + places (merged) */}
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <AppShell header="profile" maxWidth="max-w-lg" padded={false}>
                    <Profile />
                  </AppShell>
                </RequireAuth>
              }
            />

            {/* Merge: favourites no longer a page */}
            <Route path="/favourites" element={<Navigate to="/profile" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}