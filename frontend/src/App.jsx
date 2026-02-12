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
import ThemeToggle from "./components/ThemeToggle";
import AppShell from "./components/layout/AppShell";

function TopRightActions() {
  return <ThemeToggle />;
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-center" />
          <Routes>
            {/* Splash: no topbar */}
            <Route path="/" element={<Splash />} />

            {/* Auth: topbar with back */}
            <Route
              path="/auth"
              element={
                <AppShell
                  center
                  topbarProps={{
                    showBack: true,
                    right: <TopRightActions />,
                  }}
                >
                  <Auth />
                </AppShell>
              }
            />

            {/* Old routes redirect */}
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />

            {/* Compare */}
            <Route
              path="/compare"
              element={
                <AppShell
                  topbarProps={{
                    right: <TopRightActions />,
                    tagline: "Compare. Choose. Ride.",
                  }}
                >
                  <Compare />
                </AppShell>
              }
            />

            <Route
              path="/compare/results"
              element={
                <AppShell
                  topbarProps={{
                    showBack: true,
                    backTo: "/compare",
                    right: <TopRightActions />,
                    tagline: "Compare. Choose. Ride.",
                  }}
                >
                  <CompareResults />
                </AppShell>
              }
            />

            {/* Profile (includes saved places section) */}
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <AppShell
                    topbarProps={{
                      showBack: true,
                      backTo: "/compare",
                      right: <TopRightActions />,
                    }}
                  >
                    <Profile />
                  </AppShell>
                </RequireAuth>
              }
            />

            {/* Optional: collapse /favourites into profile */}
            <Route path="/favourites" element={<Navigate to="/profile" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}