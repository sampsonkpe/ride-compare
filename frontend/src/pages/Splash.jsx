import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/ridecomparelogo.png";

export default function Splash() {
  const navigate = useNavigate();
  const [showTagline, setShowTagline] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const taglineTimer = setTimeout(() => setShowTagline(true), 1200);
    const fadeTimer = setTimeout(() => setFadeOut(true), 4000);
    const completeTimer = setTimeout(() => navigate("/auth", { replace: true }), 4500);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [navigate]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={logo}
        alt="RideCompare"
        className="h-14 md:h-16 animate-bounce"
      />
      <p
        className={`mt-6 text-lg md:text-xl tracking-wide text-gray-300 font-semibold transition-all duration-500 ${
          showTagline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        Compare. Choose. Ride.
      </p>
    </div>
  );
}