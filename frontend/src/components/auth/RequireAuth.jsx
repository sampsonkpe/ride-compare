import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthed, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthed) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth?next=${next}`, { replace: true });
    }
  }, [loading, isAuthed, navigate, location.pathname, location.search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-border bg-card shadow-card p-6">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              <div className="min-w-0">
                <div className="font-semibold">Loading your profile…</div>
                <div className="text-sm text-muted-foreground">Just a moment.</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-10 rounded-xl bg-muted animate-pulse-subtle" />
              <div className="h-10 rounded-xl bg-muted animate-pulse-subtle" />
              <div className="h-10 rounded-xl bg-muted animate-pulse-subtle" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return children;
}