import { useState, useContext, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowUpDown, Plus, ChevronUp, ChevronDown, Trash2, Home, Briefcase, MapPin, CircleDot, Clock, X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import ridesService from "../services/ridesService";
import favouritesService from "../services/favouritesService";

import toast from "react-hot-toast";
import LocationInput from "../components/rides/LocationInput";

import BottomSheet from "../components/overlays/BottomSheet";
import CompareResults from "./CompareResults";
import { createPortal } from "react-dom";

/* ✅ ADDED */
function formatScheduledLabel(dateStr) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  return date.toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

  const [favourites, setFavourites] = useState([]);
  const [selectedFavourite, setSelectedFavourite] = useState(null);
  const [favSheetOpen, setFavSheetOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const pickupRef = useRef(null);

  const pickupStop = useMemo(() => stops.find((s) => s.kind === "PICKUP") || null, [stops]);
  const dropoffStop = useMemo(() => stops.find((s) => s.kind === "DROPOFF") || null, [stops]);
  const stopRows = useMemo(() => stops.filter((s) => s.kind === "STOP"), [stops]);

  const stopCount = stopRows.length;
  const canAddStop = stopCount < 3;

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

  useEffect(() => {
    if (!user) return;

    const loadFavourites = async () => {
      try {
        const data = await favouritesService.getFavourites();
        setFavourites(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    loadFavourites();
  }, [user]);

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

  const applyFavouriteTo = useCallback((type) => {
    if (!selectedFavourite) return;

    const value = {
      address: selectedFavourite.address,
      lat: selectedFavourite.lat,
      lng: selectedFavourite.lng,
    };

    setStops((prev) => {
      const next = [...prev];

      if (type === "PICKUP") {
        const idx = next.findIndex((s) => s.kind === "PICKUP");
        if (idx >= 0) next[idx] = { ...next[idx], value };
      }

      if (type === "DROPOFF") {
        const idx = next.findIndex((s) => s.kind === "DROPOFF");
        if (idx >= 0) next[idx] = { ...next[idx], value };
      }

      if (type === "STOP") {
        const dropIdx = next.findIndex((s) => s.kind === "DROPOFF");
        if (dropIdx >= 0) {
          const newStop = {
            id: makeId(),
            kind: "STOP",
            value,
          };
          next.splice(dropIdx, 0, newStop);
        }
      }

      return next;
    });

    setFavSheetOpen(false);
    setSelectedFavourite(null);
  }, [selectedFavourite]);

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

    if (!pickupStop || !dropoffStop) {
      toast.error("Pickup and dropoff are required");
      return;
    }

    setLoading(true);
    try {
      const stopsFinal = await Promise.all(
        stops.map(async (s) => {
          const address = s?.value?.address?.trim() || "";
          const resolved = await ensureCoords({ ...s.value, address });
          if (!resolved) return null;

          return {
            kind: s.kind,
            address: resolved.address,
            lat: resolved.lat,
            lng: resolved.lng,
          };
        })
      );

      if (stopsFinal.some((s) => !s)) {
        toast.error("Please select a suggested place so we can get coordinates.");
        return;
      }

      const pickupFinal = stopsFinal[0];
      const dropoffFinal = stopsFinal[stopsFinal.length - 1];

      const data = await ridesService.compareRoute(stopsFinal, {
        pickup_time: scheduledAt,
      });

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

        {/* Swap + Add Stop row */}
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

        {/* Schedule for later */}
        <div className="pt-2">
          {!scheduledAt ? (
            <button
              type="button"
              onClick={() => setScheduleOpen(true)}
              className="w-full flex items-center gap-2 px-3 h-11 rounded-xl border border-border/70 bg-card/70 text-sm font-medium hover:bg-muted/80 transition"
            >
              <Clock className={`w-4 h-4 ${scheduledAt ? "text-primary" : "text-muted-foreground"}`} />
              Schedule for later
            </button>
          ) : (
            <div className="w-full flex items-center justify-between px-3 h-11 rounded-xl 
              border border-primary/20 bg-primary/10 text-sm backdrop-blur-sm">

              {/* LEFT */}
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-4 h-4 text-primary shrink-0" />

                <span className="font-medium text-primary truncate">
                  {formatScheduledLabel(scheduledAt)}
                </span>
              </div>

              {/* RIGHT (clear) */}
              <button
                onClick={() => setScheduledAt(null)}
                className="ml-2 p-1 rounded-full hover:bg-primary/20 transition"
                aria-label="Clear schedule"
              >
                <X className="w-4 h-4 text-primary" />
              </button>
            </div>
          )}
        </div>

        {/* Saved Places */}
        {user && favourites.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {[...favourites]
              .sort((a, b) => {
                const order = { HOME: 0, WORK: 1, OTHER: 2 };
                const ta = (a.type || "").toUpperCase();
                const tb = (b.type || "").toUpperCase();
                return (order[ta] ?? 3) - (order[tb] ?? 3);
              })
              .map((fav) => {
              const type = (fav.type || "").toUpperCase();

              let Icon = MapPin;
              let iconColor = "text-purple-400";

              if (type === "HOME") {
                Icon = Home;
                iconColor = "text-blue-400";
              }

              if (type === "WORK") {
                Icon = Briefcase;
                iconColor = "text-emerald-400";
              }

              return (
                <button
                  key={fav.id}
                  onClick={() => {
                    setSelectedFavourite(fav);
                    setFavSheetOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 h-10 rounded-xl border border-border/80 bg-card/70 text-sm font-medium hover:bg-muted/80 transition"
                >
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                  {fav.label || fav.address}
                </button>
              );
            }
            )}
          </div>
        )}

      {favSheetOpen && selectedFavourite &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            
            {/* FULLSCREEN backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setFavSheetOpen(false)}
            />

            {/* Modal */}
            <div
              className="relative z-10 w-[90%] max-w-sm rounded-2xl bg-card/95 border border-border/60 shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3">
                <p className="text-sm font-semibold">
                  {selectedFavourite.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedFavourite.address}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => applyFavouriteTo("PICKUP")}
                  className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl 
                  bg-muted/30 hover:bg-primary/15 active:bg-primary/25
                  border border-transparent hover:border-primary/40
                  transition-all duration-150 active:scale-[0.98] text-sm"
                >
                  <CircleDot className="w-4 h-4 text-primary group-hover:scale-110 transition" />
                  <span className="group-hover:text-primary font-medium">
                    Set as Pickup
                  </span>
                </button>

                <button
                  onClick={() => applyFavouriteTo("DROPOFF")}
                  className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 hover:bg-primary/15 active:bg-primary/25
                  border border-transparent hover:border-primary/40
                  transition-all duration-150 active:scale-[0.98] text-sm"
                >
                  <MapPin className="w-4 h-4 text-destructive group-hover:scale-110 transition" />
                  <span className="group-hover:text-destructive font-medium">
                    Set as Dropoff
                  </span>
                </button>

                <button
                  onClick={() => applyFavouriteTo("STOP")}
                  className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 hover:bg-primary/15 active:bg-primary/25
                  border border-transparent hover:border-primary/40
                  transition-all duration-150 active:scale-[0.98] text-sm"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition" />
                  <span className="group-hover:text-primary font-medium">
                    Add as Stop
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

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

      {scheduleOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setScheduleOpen(false)}
            />

            <div
              className="relative z-10 w-[90%] max-w-sm rounded-2xl bg-card border border-border/60 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold mb-3">Schedule ride</h3>

              <input
                type="datetime-local"
                className="w-full h-11 px-3 rounded-xl border border-border/70 bg-card"
                onChange={(e) => setScheduledAt(new Date(e.target.value).toISOString())}
              />

              <button
                onClick={() => setScheduleOpen(false)}
                className="mt-4 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Confirm Schedule
              </button>
            </div>
          </div>,
          document.body
        )
      }

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