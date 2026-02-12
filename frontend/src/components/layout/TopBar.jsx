import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  LogIn,
  LogOut,
  User,
  MapPin,
  X,
} from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import logo from "../../assets/ridecomparelogo.png";
import ThemeToggle from "../ThemeToggle";

export default function TopBar({
  variant = "app", // "app" | "auth" | "profile"
  onOpenAlerts, // optional
}) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);

  const logoEl = (
    <button
      type="button"
      onClick={() => navigate("/compare")}
      className="inline-flex items-center"
      aria-label="Go to Compare"
    >
      <img
        src={logo}
        alt="RideCompare"
        className="h-7 md:h-8 w-auto select-none dark:invert dark:brightness-200"
        draggable={false}
      />
    </button>
  );

  const rightActions = useMemo(() => {
    const iconBtn =
      "p-2 rounded-full hover:bg-muted transition-colors " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

    if (!user) {
      return (
        <div className="flex items-center gap-2">
          {typeof onOpenAlerts === "function" ? (
            <button type="button" className={iconBtn} onClick={onOpenAlerts} aria-label="Open alerts">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
          ) : null}

          <ThemeToggle />

          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            Sign in
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {typeof onOpenAlerts === "function" ? (
          <button type="button" className={iconBtn} onClick={onOpenAlerts} aria-label="Open alerts">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>
        ) : null}

        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            className={[
              iconBtn,
              "bg-primary/10",
              menuOpen ? "ring-2 ring-ring" : "",
            ].join(" ")}
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

              <div className="absolute right-0 mt-2 z-50 w-64 rounded-xl border border-border bg-card shadow-card-hover overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user?.email}</p>
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
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Sign out
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }, [user, onOpenAlerts, navigate, logout, menuOpen]);

  // Header variants
  if (variant === "auth") {
    return (
      <header className="w-full py-4 px-4 md:py-6 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {logoEl}

          <div className="w-9" />
        </div>
      </header>
    );
  }

  if (variant === "profile") {
    return (
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-lg mx-auto h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/compare")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="font-semibold">Profile</div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  // default: app header
  return (
    <header className="w-full py-4 px-4 md:py-6">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        {/* left */}
        <div className="flex items-center gap-2">{logoEl}</div>

        {/* centre */}
        <div className="hidden sm:block text-xs md:text-sm text-muted-foreground">
          Compare. Choose. Ride.
        </div>

        {/* right */}
        {rightActions}
      </div>
    </header>
  );
}