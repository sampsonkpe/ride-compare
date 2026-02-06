import { BrowserRouter as Router, Routes, Route, Navigate, RouterContextProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";

import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Compare from "./pages/Compare";
import CompareResults from "./pages/CompareResults";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Favourites from "./pages/Favourites";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" replace />;
}

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
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/favourites"
            element={
              <ProtectedRoute>
                <Favourites />
                </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}