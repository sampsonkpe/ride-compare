import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 route:", location.pathname);
  }, [location.pathname]);

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 min-h-[50px] px-6 rounded-xl text-sm font-semibold " +
    "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const secondaryBtn =
    "inline-flex items-center justify-center gap-2 min-h-[50px] px-6 rounded-xl text-sm font-semibold " +
    "border border-border bg-card hover:bg-muted transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-lg px-4 py-10">
        <div className="rounded-2xl border border-border bg-card shadow-card p-6 text-center">
          <div className="text-sm text-muted-foreground">Page not found</div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">404</h1>

          <p className="mt-3 text-sm text-muted-foreground">
            The page you tried to open doesn’t exist.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <button onClick={() => navigate("/compare")} className={primaryBtn} type="button">
              Go to Compare
            </button>

            <button onClick={() => navigate(-1)} className={secondaryBtn} type="button">
              Go back
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          {location.pathname}
        </div>
      </div>
    </div>
  );
}