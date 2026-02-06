import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";

import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Compare from "./pages/Compare";
import CompareResults from "./pages/CompareResults";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Favourites from "./pages/Favourites";

// Use your RequireAuth component (the corrected one)
import RequireAuth from "./components/auth/RequireAuth";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />

          {/* Keep old auth routes working, but funnel them into /auth */}
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />

          {/* Public compare */}
          <Route path="/compare" element={<Compare />} />
          <Route path="/compare/results" element={<CompareResults />} />

          {/* Protected */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />

          <Route
            path="/favourites"
            element={
              <RequireAuth>
                <Favourites />
              </RequireAuth>
            }
          />

          {/* Add when ready:
          <Route
            path="/history"
            element={
              <RequireAuth>
                <History />
              </RequireAuth>
            }
          />
          */}

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}