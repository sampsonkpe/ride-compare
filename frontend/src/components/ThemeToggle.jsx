import { useContext } from "react";
import { Sun, Moon } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";

export default function ThemeToggle() {
  const themeCtx = useContext(ThemeContext);
  const isDark = themeCtx?.isDark;

  return (
    <button
      type="button"
      onClick={() => themeCtx?.toggleTheme?.()}
      className="h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="relative block h-5 w-5">
        <Sun
          className={[
            "absolute inset-0 h-5 w-5 text-primary transition-all duration-200",
            isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          ].join(" ")}
        />
        <Moon
          className={[
            "absolute inset-0 h-5 w-5 text-primary transition-all duration-200",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}