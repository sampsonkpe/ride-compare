import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/ridecomparelogo.png";
import { ThemeContext } from "../context/ThemeContext";

const TAGLINE_DELAY_MS = 1200;
const EXIT_START_MS = 4200;
const NAVIGATE_MS = 4500;

export default function Splash() {
  const navigate = useNavigate();
  const themeCtx = useContext(ThemeContext);
  const isDark = themeCtx?.isDark;

  const [showTagline, setShowTagline] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    timersRef.current.push(setTimeout(() => setShowTagline(true), TAGLINE_DELAY_MS));
    timersRef.current.push(setTimeout(() => setIsExiting(true), EXIT_START_MS));
    timersRef.current.push(setTimeout(() => navigate("/compare", { replace: true }), NAVIGATE_MS));

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className={[
          "flex min-h-screen flex-col items-center justify-center px-6",
          "transition-opacity duration-500 ease-out",
          isExiting ? "opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <div className="flex flex-col items-center">
          <img
            src={logo}
            alt="RideCompare"
            className={["h-10 sm:h-12 w-auto select-none splash-float", isDark ? "logo-dark-invert" : ""].join(" ")}
            draggable={false}
          />

          <div
            className={[
              "mt-5 text-center text-base sm:text-lg tracking-wide text-muted-foreground",
              "transition-all duration-700 ease-out",
              showTagline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            ].join(" ")}
          >
            Compare. Choose. Ride.
          </div>
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .splash-float { animation: none !important; }
        }
        .splash-float {
          animation: splashFloat 2200ms ease-in-out infinite;
          will-change: transform;
        }
        @keyframes splashFloat {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}