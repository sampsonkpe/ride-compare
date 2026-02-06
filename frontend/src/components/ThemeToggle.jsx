import { useContext } from "react";
import { Moon, Sun } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";

export default function ThemeToggle() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;

  const { isDark, toggleTheme } = ctx;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        "inline-flex items-center justify-center",
        "w-10 h-10 rounded-full",
        "border transition-colors",
        // neutral styling that works on both light/dark pages
        "bg-white/90 text-slate-800 border-black/10 hover:bg-white",
        "dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/15",
        "backdrop-blur",
      ].join(" ")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
