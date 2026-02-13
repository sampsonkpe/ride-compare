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
  const [sortBy, setSortBy] = useState("price"); // default: price

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

  const Wrapper = ({ children }) =>
    embedded ? <div className="space-y-4">{children}</div> : <div className="min-h-screen">{children}</div>;

  const primaryBtn =
    "rc-btn-primary w-full"; // from index.css utilities

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
      {/* Top row: sort (route is handled by pill + sheet subtitle) */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-semibold">Results</div>

        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-card border border-border rounded-xl px-3 py-2 pr-8 text-sm text-foreground
                       focus:ring-2 focus:ring-ring outline-none"
            aria-label="Sort results"
          >
            <option value="price">Sort by Price</option>
            <option value="eta">Sort by ETA</option>
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {sortedRides.map((ride, index) => {
          const providerKey = normalizeProvider(ride?.provider);
          const company = providerDisplayName(providerKey);

          const logo = PROVIDER_LOGO[providerKey];
          const rideType = typeOnlyLabel(ride);

          const priceText = formatMoneyGHS(ride?.price);

          const etaNum = toNumber(ride?.eta_minutes);
          const etaText = etaNum == null ? "--" : `${etaNum}`;

          const deepLink = PROVIDER_DEEPLINK[providerKey] || "https://ridecompare.app";

          const isUber = providerKey === "UBER";

          return (
            <div
              key={index}
              className="rc-card rc-card-hover p-5"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              {/* Top row: COMPANY left, ETA right */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {logo ? (
                    <img
                      src={logo}
                      alt={`${company} logo`}
                      className={[
                        "h-6 w-auto object-contain select-none",
                        isUber ? "rc-logo-invert-dark" : "",
                      ].join(" ")}
                      draggable={false}
                    />
                  ) : (
                    <div className="text-sm font-semibold">{company}</div>
                  )}
                </div>

                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                  <Clock className="w-4 h-4" />
                  {etaText} min
                </div>
              </div>

              {/* Bottom row: RIDE TYPE left, PRICE right */}
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-semibold">Ride</div>
                  <div className="text-sm font-semibold truncate">{rideType}</div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground font-semibold">Price</div>
                  <div className="text-2xl font-bold leading-tight">{priceText}</div>
                </div>
              </div>

              {/* CTA across */}
              <a
                href={deepLink}
                target="_blank"
                rel="noreferrer"
                className={primaryBtn + " mt-4"}
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