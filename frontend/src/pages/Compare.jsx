import { useState, useContext, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowUpDown, Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import ridesService from "../services/ridesService";
import toast from "react-hot-toast";
import LocationInput from "../components/rides/LocationInput";

import BottomSheet from "../components/overlays/BottomSheet";
import CompareResults from "./CompareResults";

function loadGoogleMapsScript() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env");

  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

async function geocodeAddress(address) {
  const trimmed = (address || "").trim();
  if (!trimmed) return null;

  await loadGoogleMapsScript();

  return new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: trimmed, region: "GH" }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) return resolve(null);
      const loc = results[0].geometry.location;
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
}

function extractErrorMessage(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (data?.detail) return String(data.detail);
  if (data?.error) return String(data.error);
  if (typeof data === "string" && data.trim()) return data;

  if (data && typeof data === "object") {
    try {
      return `Request failed (${status}): ${JSON.stringify(data)}`;
    } catch {
      return `Request failed (${status})`;
    }
  }

  if (err?.message) return err.message;
  return "Failed to compare rides";
}

function timeGreeting(name = "") {
  const h = new Date().getHours();
  const base = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  if (!name) return `${base}!`;
  return `${base}, ${name}!`;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isFilledPlace(p) {
  return Boolean(p?.address && String(p.address).trim());
}

export default function Compare() {
  const [stops, setStops] = useState(() => [
    { id: makeId(), kind: "PICKUP", value: { address: "", lat: null, lng: null } },
    { id: makeId(), kind: "DROPOFF", value: { address: "", lat: null, lng: null } },
  ]);

  const [activeStopId, setActiveStopId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetData, setSheetData] = useState({
    rides: [],
    pickup: null,
    dropoff: null,
  });

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const pickupRef = useRef(null);

  const pickupStop = useMemo(() => stops.find((s) => s.kind === "PICKUP") || null, [stops]);
  const dropoffStop = useMemo(() => stops.find((s) => s.kind === "DROPOFF") || null, [stops]);
  const stopRows = useMemo(() => stops.filter((s) => s.kind === "STOP"), [stops]);

  const stopCount = stopRows.length;
  const canAddStop = stopCount < 3;
  const hasStops = stopCount > 0;

  useEffect(() => {
    const incomingPickup = location.state?.pickup;
    const incomingDropoff = location.state?.dropoff;

    if (incomingPickup?.address || incomingDropoff?.address) {
      setStops((prev) => {
        const next = [...prev];
        const pIdx = next.findIndex((s) => s.kind === "PICKUP");
        const dIdx = next.findIndex((s) => s.kind === "DROPOFF");

        if (incomingPickup?.address && pIdx >= 0) {
          next[pIdx] = {
            ...next[pIdx],
            value: {
              address: incomingPickup.address,
              lat: incomingPickup.lat ?? null,
              lng: incomingPickup.lng ?? null,
            },
          };
        }

        if (incomingDropoff?.address && dIdx >= 0) {
          next[dIdx] = {
            ...next[dIdx],
            value: {
              address: incomingDropoff.address,
              lat: incomingDropoff.lat ?? null,
              lng: incomingDropoff.lng ?? null,
            },
          };
        }

        return next;
      });

      navigate("/compare", { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureCoords = async (loc) => {
    const address = loc?.address?.trim();
    if (!address) return null;

    if (loc.lat != null && loc.lng != null) {
      return { address, lat: Number(loc.lat), lng: Number(loc.lng) };
    }

    const coords = await geocodeAddress(address);
    if (!coords) return null;

    return { address, lat: Number(coords.lat), lng: Number(coords.lng) };
  };

  const setStopValue = useCallback((stopId, nextValue) => {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, value: nextValue } : s)));
  }, []);

  const addStop = useCallback(() => {
    setStops((prev) => {
      const currentStops = prev.filter((s) => s.kind === "STOP").length;
      if (currentStops >= 3) return prev;

      const dropIdx = prev.findIndex((s) => s.kind === "DROPOFF");
      if (dropIdx < 0) return prev;

      const newStop = { id: makeId(), kind: "STOP", value: { address: "", lat: null, lng: null } };
      const next = [...prev.slice(0, dropIdx), newStop, ...prev.slice(dropIdx)];

      return next;
    });
  }, []);

  const removeStop = useCallback((stopId) => {
    setStops((prev) => {
      const target = prev.find((s) => s.id === stopId);
      if (!target || target.kind !== "STOP") return prev;
      return prev.filter((s) => s.id !== stopId);
    });
  }, []);

  const moveStop = useCallback((stopId, dir) => {
    setStops((prev) => {
      const idx = prev.findIndex((s) => s.id === stopId);
      if (idx < 0) return prev;

      const cur = prev[idx];
      if (cur.kind !== "STOP") return prev;

      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;

      const neighbour = prev[swapIdx];
      if (!neighbour || neighbour.kind !== "STOP") return prev;

      const next = [...prev];
      next[idx] = neighbour;
      next[swapIdx] = cur;
      return next;
    });
  }, []);

  const swapPickupDropoff = useCallback(() => {
    setStops((prev) => {
      const pIdx = prev.findIndex((s) => s.kind === "PICKUP");
      const dIdx = prev.findIndex((s) => s.kind === "DROPOFF");
      if (pIdx < 0 || dIdx < 0) return prev;

      const next = [...prev];
      const p = next[pIdx];
      const d = next[dIdx];

      next[pIdx] = { ...p, value: d.value };
      next[dIdx] = { ...d, value: p.value };

      return next;
    });
  }, []);

  const allFilled = useMemo(() => stops.every((s) => isFilledPlace(s.value)), [stops]);

  const canCompare = allFilled && !loading;

  const handleCompare = async () => {
    if (!allFilled) {
      toast.error("Please enter all locations first");
      return;
    }

    if (hasStops) {
      toast("Multi-stop pricing will be enabled once the backend supports it.");
      return;
    }

    const pickup = pickupStop?.value;
    const dropoff = dropoffStop?.value;

    const pickupAddress = pickup?.address?.trim();
    const dropoffAddress = dropoff?.address?.trim();

    if (!pickupAddress || !dropoffAddress) {
      toast.error("Please enter pickup and dropoff locations");
      return;
    }

    setLoading(true);
    try {
      const [pickupFinal, dropoffFinal] = await Promise.all([
        ensureCoords({ ...pickup, address: pickupAddress }),
        ensureCoords({ ...dropoff, address: dropoffAddress }),
      ]);

      if (!pickupFinal || !dropoffFinal) {
        toast.error("Please select a suggested place so we can get coordinates.");
        return;
      }

      const data = await ridesService.compareRides(pickupFinal, dropoffFinal);
      const ridesArr = Array.isArray(data?.rides) ? data.rides : [];

      setSheetData({ rides: ridesArr, pickup: pickupFinal, dropoff: dropoffFinal });
      setSheetOpen(true);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const pickupText = sheetData?.pickup?.address || pickupStop?.value?.address || "Pickup";
  const dropoffText = sheetData?.dropoff?.address || dropoffStop?.value?.address || "Dropoff";

  const greetingName = useMemo(() => {
    const full = user?.full_name || user?.name || "";
    const first = String(full).trim().split(" ")[0];
    return first || "";
  }, [user]);

  const greeting = useMemo(() => timeGreeting(greetingName), [greetingName]);
  const tagline = "Where would you like to go today?";

  return (
    <>
      <div className="text-center mb-7 md:mb-9 animate-fade-in-up">
        <h1 className="text-xl md:text-3xl font-semibold mb-2">{greeting}</h1>
        <p className="text-muted-foreground text-sm md:text-base">{tagline}</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-card space-y-4 animate-fade-in-up">
        {/* PICKUP */}
        {pickupStop ? (
          <LocationInput
            label="Pickup"
            value={pickupStop.value}
            onChange={(v) => setStopValue(pickupStop.id, v)}
            placeholder="Enter pickup location"
            icon="pickup"
            showCurrentLocation
            inputRef={pickupRef}
            onFocus={() => setActiveStopId(pickupStop.id)}
            onLocationError={() => toast.error("Location access unavailable")}
          />
        ) : null}

        {/* STOPS */}
        {stopRows.map((s, idx) => {
          const isFirstStop = idx === 0;
          const isLastStop = idx === stopRows.length - 1;

          return (
            <div key={s.id} className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-xl p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Stop {idx + 1}
                </label>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveStop(s.id, "up")}
                    disabled={isFirstStop}
                    className={[
                      "p-2 rounded-lg transition",
                      "hover:bg-muted/60",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isFirstStop ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-label="Move stop up"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveStop(s.id, "down")}
                    disabled={isLastStop}
                    className={[
                      "p-2 rounded-lg transition",
                      "hover:bg-muted/60",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isLastStop ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-label="Move stop down"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeStop(s.id)}
                    className="p-2 rounded-lg hover:bg-muted/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Remove stop"
                    title="Remove stop"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <LocationInput
                label={null}
                value={s.value}
                onChange={(v) => setStopValue(s.id, v)}
                placeholder="Add a stop"
                icon="stop"
                onFocus={() => setActiveStopId(s.id)}
                onLocationError={() => toast.error("Location search unavailable")}
              />
            </div>
          );
        })}

        {/* DROPOFF */}
        {dropoffStop ? (
          <LocationInput
            label="Dropoff"
            value={dropoffStop.value}
            onChange={(v) => setStopValue(dropoffStop.id, v)}
            placeholder="Where are you going?"
            icon="dropoff"
            onFocus={() => setActiveStopId(dropoffStop.id)}
            onLocationError={() => toast.error("Location search unavailable")}
          />
        ) : null}

        {/* Swap + Add Stop row (right under Dropoff as per spec) */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={swapPickupDropoff}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowUpDown className="w-4 h-4" />
            Swap
          </button>

          <button
            type="button"
            onClick={addStop}
            disabled={!canAddStop}
            className={[
              "inline-flex items-center gap-2 text-xs font-medium transition",
              canAddStop ? "text-primary hover:opacity-90" : "text-muted-foreground/70 cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            ].join(" ")}
            title={canAddStop ? "Add stop" : "Max stops reached"}
          >
            <Plus className="w-4 h-4" />
            Add Stop
          </button>
        </div>

        {/* Compare */}
        <button
          onClick={handleCompare}
          disabled={!canCompare}
          className={[
            "w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-6 rounded-xl text-sm font-semibold",
            canCompare
              ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              : "bg-card/60 text-muted-foreground border border-border/60 cursor-not-allowed",
            "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          ].join(" ")}
          type="button"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Finding rides…
            </>
          ) : (
            "Compare Rides"
          )}
        </button>

        {!user ? (
          <p className="text-xs text-muted-foreground text-center">
            Tip: Sign in to save places and alerts.
          </p>
        ) : null}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        pickupText={pickupText}
        dropoffText={dropoffText}
        onAddStop={canAddStop ? addStop : undefined}
        snapPoints={[0.18, 0.66, 0.92]}
        initialSnap={1}
        maxWidthClass="max-w-lg"
      >
        <CompareResults embedded rides={sheetData.rides} onClose={() => setSheetOpen(false)} />
      </BottomSheet>
    </>
  );
}