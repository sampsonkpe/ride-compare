import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 route:", location.pathname);
  }, [location.pathname]);

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold " +
    "bg-primary text-primary-foreground hover:opacity-90 transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h1 className="text-4xl font-bold mb-3">404</h1>
          <p className="text-muted-foreground mb-6">Oops! Page not found</p>

          <button onClick={() => navigate("/compare")} className={primaryBtn} type="button">
            Return to Compare
          </button>
        </div>
      </div>
    </div>
  );
}