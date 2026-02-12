import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import logo from "../../assets/ridecomparelogo.png";

export default function TopBar({
  showBack = false,
  backTo = -1,
  left = null,
  right = null,
  center = null,
  tagline = null,
  sticky = true,
}) {
  const navigate = useNavigate();
  const themeCtx = useContext(ThemeContext);
  const isDark = themeCtx?.isDark;

  return (
    <header
      className={[
        sticky ? "sticky top-0 z-50" : "",
        "border-b border-border/60",
        "bg-background/70 backdrop-blur-xl",
      ].join(" ")}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left */}
        <div className="w-20 flex items-center justify-start">
          {left ? (
            left
          ) : showBack ? (
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="inline-flex items-center justify-center rounded-full p-2 hover:bg-accent transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        {/* Centre */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          {center ? (
            center
          ) : (
            <img
              src={logo}
              alt="RideCompare"
              className={["h-6 sm:h-7 w-auto select-none", isDark ? "logo-dark-invert" : ""].join(" ")}
              draggable={false}
            />
          )}
        </div>

        {/* Right */}
        <div className="w-64 flex items-center justify-end gap-2">
          {tagline ? (
            <span className="hidden md:inline text-sm text-muted-foreground mr-2">{tagline}</span>
          ) : null}
          {right}
        </div>
      </div>
    </header>
  );
}