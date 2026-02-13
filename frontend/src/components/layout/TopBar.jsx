import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, LogOut, User, MapPin } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import logo from "../../assets/ridecomparelogo.png";
import ThemeToggle from "../ThemeToggle";

export default function TopBar({ variant = "app", onOpenAlerts }) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  const iconBtn = "rc-icon-btn";
  const headerBase =
    "sticky top-0 z-50 h-14 border-b border-border bg-background/85 backdrop-blur-lg";

  const LogoButton = (
    <button type="button" onClick={() => navigate("/compare")} className="inline-flex items-center">
      <img
        src={logo}
        alt="RideCompare"
        className="h-7 w-auto select-none rc-logo-invert-dark"
        draggable={false}
      />
    </button>
  );

  const AlertsButton =
    typeof onOpenAlerts === "function" ? (
      <button type="button" className={iconBtn} onClick={onOpenAlerts} aria-label="Open alerts">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </button>
    ) : null;

  const rightActions = useMemo(() => {
    if (!user) {
      return (
        <div className="flex items-center gap-2">
          {AlertsButton}
          <ThemeToggle />
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="h-10 px-4 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {AlertsButton}
        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            className={[iconBtn, "bg-primary/10", menuOpen ? "ring-2 ring-ring" : ""].join(" ")}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="User menu"
          >
            <User className="h-5 w-5 text-primary" />
          </button>

          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu overlay"
              />

              <div className="absolute right-0 mt-2 z-50 w-64 rounded-2xl border border-border bg-card shadow-card-hover overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground font-semibold">Signed in as</p>
                  <p className="text-sm font-semibold truncate">{user?.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors inline-flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Profile & places
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    navigate("/auth");
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors inline-flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-semibold">Sign out</span>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }, [user, AlertsButton, logout, menuOpen, navigate]);

  if (variant === "auth") {
    return (
      <header className={headerBase}>
        <div className="mx-auto max-w-lg h-14 px-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className={iconBtn} aria-label="Go back" type="button">
            <ChevronLeft className="h-5 w-5" />
          </button>

          {LogoButton}

          <div className="w-10" />
        </div>
      </header>
    );
  }

  if (variant === "profile") {
    return (
      <header className={headerBase}>
        <div className="mx-auto max-w-lg h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/compare")}
            className={iconBtn}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="font-semibold">Profile</div>

          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className={headerBase}>
      <div className="mx-auto max-w-lg h-14 px-4 flex items-center justify-between gap-3">
        {LogoButton}
        <div className="hidden sm:block text-xs text-muted-foreground font-medium">
          Compare. Choose. Ride.
        </div>
        {rightActions}
      </div>
    </header>
  );
}