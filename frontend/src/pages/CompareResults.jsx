import { useMemo, useState } from "react";
import { Clock, ChevronDown, AlertTriangle } from "lucide-react";

import uberLogo from "../assets/uberlogo.png";
import yangoLogo from "../assets/yangologo.png";
import boltLogo from "../assets/boltlogo.png";

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

function rideTypeLabel(providerKey, ride) {
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
  if (!s) return `${providerDisplayName(providerKey)} Economy`;
  if (/uberx/i.test(s)) return "UberX";

  const company = providerDisplayName(providerKey);
  if (s.toLowerCase().includes(company.toLowerCase())) return s;

  return `${company} ${s}`;
}

export default function CompareResults({ embedded = false, rides = [], onClose }) {
  const [sortBy, setSortBy] = useState("price");

  const sortedRides = useMemo(() => {
    const copy = [...(Array.isArray(rides) ? rides : [])];

    copy.sort((a, b) => {
      if (sortBy === "eta") {
        const ae = toNumber(a?.eta_minutes);
        const be = toNumber(b?.eta_minutes);
        if (ae == null && be == null) return 0;
        if (ae == null) return 1;
        if (be == null) return -1;
        return ae - be;
      }

      const ap = toNumber(a?.price);
      const bp = toNumber(b?.price);
      if (ap == null && bp == null) return 0;
      if (ap == null) return 1;
      if (bp == null) return -1;
      return ap - bp;
    });

    return copy;
  }, [rides, sortBy]);

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold " +
    "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const Wrapper = ({ children }) =>
    embedded ? <div className="space-y-4">{children}</div> : <div className="min-h-screen">{children}</div>;

  if (!Array.isArray(rides) || rides.length === 0) {
    return (
      <Wrapper>
        <div className="text-center py-10">
          <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-muted-foreground">No rides returned. Try comparing again.</p>

          {embedded ? (
            <button type="button" onClick={onClose} className={primaryBtn + " mt-5"}>
              Close
            </button>
          ) : null}
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-sm font-semibold text-foreground">Available Rides</div>

        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={[
              "appearance-none rounded-lg px-3 py-1.5 pr-8 text-sm text-foreground outline-none",
              "border border-border/70",
              "bg-card/75 backdrop-blur-md",
              "focus:ring-2 focus:ring-ring",
            ].join(" ")}
            aria-label="Sort results"
          >
            <option value="price">Sort by Price</option>
            <option value="eta">Sort by ETA</option>
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-3">
        {sortedRides.map((ride, index) => {
          const providerKey = normalizeProvider(ride?.provider);
          const company = providerDisplayName(providerKey);

          const logo = PROVIDER_LOGO[providerKey];
          const deepLink = PROVIDER_DEEPLINK[providerKey] || "https://ridecompare.app";

          const etaNum = toNumber(ride?.eta_minutes);
          const etaText = etaNum == null ? "--" : `${etaNum} min away`;

          const priceText = formatMoneyGHS(ride?.price);
          const rideType = rideTypeLabel(providerKey, ride);

          return (
            <div
              key={index}
              className="bg-card/80 backdrop-blur-xl border border-border/70 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                {logo ? (
                  <img
                    src={logo}
                    alt={`${company} logo`}
                    className={[
                      "h-6 w-auto object-contain",
                      providerKey === "UBER" ? "dark:invert dark:brightness-200" : "",
                    ].join(" ")}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">{company}</div>
                )}

                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{etaText}</span>
                </div>
              </div>

              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-muted-foreground truncate">{rideType}</div>
                </div>
                <div className="text-3xl font-bold text-foreground">{priceText}</div>
              </div>

              <a
                href={deepLink}
                target="_blank"
                rel="noreferrer"
                className={primaryBtn + " w-full mt-4"}
              >
                Continue in App
              </a>
            </div>
          );
        })}
      </div>
    </Wrapper>
  );
}