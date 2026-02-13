import { useMemo, useState } from "react";
import { Clock, AlertTriangle, ChevronDown } from "lucide-react";

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

export default function CompareResults({
  embedded = false,
  rides = [],
  pickup = null,
  dropoff = null,
  onClose,
}) {
  const [sortBy, setSortBy] = useState("price"); // default: price (per spec)

  const pickupText = pickup?.address || "Pickup";
  const dropoffText = dropoff?.address || "Dropoff";

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

  // Embedded layout only (sheet)
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
      {/* Top row: route left, sort right */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground font-medium">Route</div>
          <div className="text-sm font-semibold truncate">
            {pickupText} <span className="mx-1 text-muted-foreground">→</span> {dropoffText}
          </div>
        </div>

        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-sm text-foreground
                       focus:ring-2 focus:ring-primary outline-none"
            aria-label="Sort results"
          >
            <option value="price">Sort by Price</option>
            <option value="eta">Sort by ETA</option>
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {sortedRides.map((ride, index) => {
          const providerKey = normalizeProvider(ride?.provider);
          const company = providerDisplayName(providerKey);

          const logo = PROVIDER_LOGO[providerKey];
          const typeOnly = typeOnlyLabel(ride);
          const category = `${company} ${typeOnly}`.trim();

          const priceText = formatMoneyGHS(ride?.price);

          const etaNum = toNumber(ride?.eta_minutes);
          const etaText = etaNum == null ? "--" : `${etaNum}`;

          const deepLink = PROVIDER_DEEPLINK[providerKey] || "https://ridecompare.app";

          return (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover
                         transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* row 1 */}
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

                <div className="text-sm text-muted-foreground">{category}</div>
              </div>

              {/* price */}
              <div className="mt-3 text-3xl font-bold text-foreground">{priceText}</div>

              {/* eta */}
              <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {etaText} min away
              </div>

              {/* cta */}
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