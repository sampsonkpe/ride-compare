import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Clock, AlertTriangle } from "lucide-react";

import uberLogo from "../assets/uberlogo.png";
import yangoLogo from "../assets/yangologo.png";
import boltLogo from "../assets/boltlogo.png";

const LAST_RESULTS_KEY = "ridecompare:last_results_v1";

const PROVIDER_UI = {
  UBER: {
    name: "Uber",
    logo: uberLogo,
    badgeClass: "bg-black text-white",
    cardBorder: "border-white/10",
    buttonClass: "bg-white text-black hover:bg-white/90",
  },
  BOLT: {
    name: "Bolt",
    logo: boltLogo,
    badgeClass: "bg-emerald-600 text-white",
    cardBorder: "border-white/10",
    buttonClass: "bg-emerald-500 text-black hover:bg-emerald-500/90",
  },
  YANGO: {
    name: "Yango",
    logo: yangoLogo,
    badgeClass: "bg-yellow-400 text-black",
    cardBorder: "border-white/10",
    buttonClass: "bg-yellow-400 text-black hover:bg-yellow-400/90",
  },
  DEFAULT: {
    name: "Provider",
    logo: null,
    badgeClass: "bg-white/10 text-white",
    cardBorder: "border-white/10",
    buttonClass: "bg-white text-black hover:bg-white/90",
  },
};

function normalizeProvider(provider) {
  const p = String(provider || "").toUpperCase();
  if (p.includes("UBER")) return "UBER";
  if (p.includes("BOLT")) return "BOLT";
  if (p.includes("YANGO")) return "YANGO";
  return "DEFAULT";
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function CompareResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [error, setError] = useState("");

  // Load from navigation state first, else localStorage (refresh safe)
  useEffect(() => {
    const state = location.state;

    if (state?.rides && Array.isArray(state.rides)) {
      setRides(state.rides);
      setPickup(state.pickup || null);
      setDropoff(state.dropoff || null);
      setError("");
      return;
    }

    try {
      const raw = localStorage.getItem(LAST_RESULTS_KEY);
      if (!raw) {
        setError("No ride data available. Please run a new compare.");
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.rides || !Array.isArray(parsed.rides) || parsed.rides.length === 0) {
        setError("No ride data available. Please run a new compare.");
        return;
      }

      setRides(parsed.rides);
      setPickup(parsed.pickup || null);
      setDropoff(parsed.dropoff || null);
      setError("");
    } catch {
      setError("No ride data available. Please run a new compare.");
    }
  }, [location.state]);

  const pickupText = pickup?.address || "Pickup";
  const dropoffText = dropoff?.address || "Dropoff";

  // Optional: sort by lowest price if numeric
  const sortedRides = useMemo(() => {
    const copy = Array.isArray(rides) ? [...rides] : [];
    copy.sort((a, b) => {
      const ap = toNumber(a?.price);
      const bp = toNumber(b?.price);
      if (ap == null && bp == null) return 0;
      if (ap == null) return 1;
      if (bp == null) return -1;
      return ap - bp;
    });
    return copy;
  }, [rides]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-full bg-white/10 p-3">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate("/compare")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!sortedRides || sortedRides.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No ride data available</p>
          <button
            onClick={() => navigate("/compare")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-black via-gray-950 to-black p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/compare")}
          className="mb-6 inline-flex items-center gap-2 text-gray-300 hover:text-white"
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold">Available rides</h2>
          <p className="text-gray-400 mt-1">
            {pickupText} <span className="mx-2">→</span> {dropoffText}
          </p>
        </div>

        <div className="space-y-4">
          {sortedRides.map((ride, index) => {
            const providerKey = normalizeProvider(ride?.provider);
            const ui = PROVIDER_UI[providerKey] || PROVIDER_UI.DEFAULT;

            const priceNum = toNumber(ride?.price);
            const priceText =
              priceNum == null ? "—" : `GHS ${priceNum.toFixed(2)}`;

            const etaNum = toNumber(ride?.eta_minutes);
            const etaText = etaNum == null ? "--" : `${etaNum}`;

            const serviceType = ride?.service_type || "Service";

            const deepLink = ride?.deep_link || ride?.deeplink || ride?.url || null;

            return (
              <div
                key={index}
                className={`bg-white/5 backdrop-blur-xl border ${ui.cardBorder} rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]`}
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${ui.badgeClass}`}
                      >
                        {ui.logo ? (
                          <img
                            src={ui.logo}
                            alt={`${ui.name} logo`}
                            className="h-4 w-4 object-contain"
                          />
                        ) : null}
                        {ui.name}
                      </span>
                    </div>

                    <p className="mt-2 text-gray-300 truncate">{serviceType}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-bold">{priceText}</p>
                    <p className="text-gray-400 inline-flex items-center gap-1 justify-end mt-1">
                      <Clock className="h-4 w-4" />
                      {etaText} min away
                    </p>
                  </div>
                </div>

                {deepLink ? (
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full mt-4 py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2 ${ui.buttonClass}`}
                  >
                    Continue in App
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <button
                    className={`w-full mt-4 py-3 rounded-lg font-semibold ${ui.buttonClass}`}
                    type="button"
                    onClick={() => {
                    }}
                  >
                    Continue in App
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
