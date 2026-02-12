import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, AlertTriangle, ChevronDown } from "lucide-react";

import uberLogo from "../assets/uberlogo.png";
import yangoLogo from "../assets/yangologo.png";
import boltLogo from "../assets/boltlogo.png";

const LAST_RESULTS_KEY = "ridecompare:last_results_v1";

const PROVIDER_DEEPLINK = {
  UBER: "https://m.uber.com/go/home",
  BOLT: "https://bolt.eu/en-gh/rides/",
  YANGO: "https://yango.com/en_int",
};

const PROVIDER_LOGO = {
  UBER: uberLogo,
  BOLT: boltLogo,
  YANGO: yangoLogo,
};

function normalizeProvider(provider) {
  const p = String(provider || "").toUpperCase();
  if (p.includes("UBER")) return "UBER";
  if (p.includes("BOLT")) return "BOLT";
  if (p.includes("YANGO")) return "YANGO";
  return "UNKNOWN";
}

function providerDisplayName(key) {
  if (key === "UBER") return "Uber";
  if (key === "BOLT") return "Bolt";
  if (key === "YANGO") return "Yango";
  return "App";
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatMoneyGHS(value) {
  const n = toNumber(value);
  if (n == null) return "—";
  return `GHS ${n.toFixed(2)}`;
}

function typeOnlyLabel(ride) {
  const raw =
    ride?.ride_type ||
    ride?.rideType ||
    ride?.service_type ||
    ride?.serviceType ||
    ride?.product_name ||
    ride?.productName ||
    ride?.name ||
    "Economy";

  const s = String(raw).trim();
  if (!s) return "Economy";
  if (/uberx/i.test(s)) return "X";
  return s;
}

export default function CompareResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("eta");

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
      if (!parsed?.rides?.length) {
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

  const sortedRides = useMemo(() => {
    const copy = [...rides];
    copy.sort((a, b) => {
      if (sortBy === "price") {
        const ap = toNumber(a?.price);
        const bp = toNumber(b?.price);
        if (ap == null && bp == null) return 0;
        if (ap == null) return 1;
        if (bp == null) return -1;
        return ap - bp;
      }

      const ae = toNumber(a?.eta_minutes);
      const be = toNumber(b?.eta_minutes);
      if (ae == null && be == null) return 0;
      if (ae == null) return 1;
      if (be == null) return -1;
      return ae - be;
    });
    return copy;
  }, [rides, sortBy]);

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold " +
    "bg-primary text-primary-foreground hover:opacity-90 transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const ghostBtn =
    "inline-flex items-center gap-2 h-10 px-3 rounded-xl text-sm font-medium " +
    "text-muted-foreground hover:text-foreground hover:bg-accent transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-muted-foreground mb-5">{error}</p>
          <button
            onClick={() => navigate("/compare")}
            className={primaryBtn}
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <button onClick={() => navigate("/compare")} className={ghostBtn} type="button">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 h-11 shadow-card">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none appearance-none pr-7"
              aria-label="Sort results"
            >
              <option value="eta">Sort by ETA</option>
              <option value="price">Sort by Price</option>
            </select>
            <ChevronDown className="h-4 w-4 text-muted-foreground -ml-6 pointer-events-none" />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold">Available rides</h2>
          <p className="text-muted-foreground mt-1">
            {pickupText} <span className="mx-2">→</span> {dropoffText}
          </p>
        </div>

        <div className="space-y-4">
          {sortedRides.map((ride, index) => {
            const providerKey = normalizeProvider(ride?.provider);
            const company = providerDisplayName(providerKey);

            const logo = PROVIDER_LOGO[providerKey];
            const typeOnly = typeOnlyLabel(ride);
            const rideTypeFull = `${company} ${typeOnly}`.trim();

            const priceText = formatMoneyGHS(ride?.price);
            const etaNum = toNumber(ride?.eta_minutes);
            const etaText = etaNum == null ? "--" : `${etaNum}`;

            const deepLink = PROVIDER_DEEPLINK[providerKey] || "https://ridecompare.app";

            return (
              <div
                key={index}
                className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt={`${company} logo`}
                        className={`h-14 w-auto object-contain ${
                          providerKey === "UBER" ? "logo-dark-invert" : ""
                        }`}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">{company}</div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold leading-tight">{priceText}</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-muted-foreground text-sm justify-end">
                      <Clock className="h-4 w-4" />
                      {etaText} min
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{rideTypeFull}</div>
                  </div>
                </div>

                <a
                  href={deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className={`${primaryBtn} w-full mt-4`}
                >
                  Continue in App
                </a>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}