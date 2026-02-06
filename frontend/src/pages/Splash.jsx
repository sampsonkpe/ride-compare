import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/ridecomparelogo.png";

const TAGLINE_DELAY_MS = 1200;
const EXIT_START_MS = 4200; // start fade-out a bit before navigating
const NAVIGATE_MS = 4500;   // navigate after fade-out begins

export default function Splash() {
  const navigate = useNavigate();
  const [showTagline, setShowTagline] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    timersRef.current.push(
      setTimeout(() => setShowTagline(true), TAGLINE_DELAY_MS)
    );
    timersRef.current.push(
      setTimeout(() => setIsExiting(true), EXIT_START_MS)
    );
    timersRef.current.push(
      setTimeout(() => navigate("/compare", { replace: true }), NAVIGATE_MS)
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background vignette + subtle glow */}
      <div className="pointer-events-none absolute inset-0">
        {/* Soft top-to-bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14] via-[#0b0f14] to-black" />
        {/* Subtle radial glow (center) */}
        <div className="absolute left-1/2 top-[45%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.06] blur-3xl" />
        {/* Edge vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_60%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Content */}
      <div
        className={[
          "relative z-10 flex min-h-screen flex-col items-center justify-center px-6",
          "transition-opacity duration-500 ease-out",
          isExiting ? "opacity-0" : "opacity-100",
        ].join(" ")}
      >
        {/* Logo lockup */}
        <div className="flex flex-col items-center">
          <img
            src={logo}
            alt="RideCompare"
            className="h-10 sm:h-12 w-auto select-none splash-float"
            draggable={false}
          />

          <div
            className={[
              "mt-5 text-center text-base sm:text-lg tracking-wide text-foreground/65",
              "transition-all duration-700 ease-out",
              showTagline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            ].join(" ")}
          >
            Compare. Choose. Ride.
          </div>
        </div>
      </div>

      {/* Reduced motion support */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .splash-float { animation: none !important; }
        }

        /* Gentle float (Lovable-style) */
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
