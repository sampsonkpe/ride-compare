import { useState, useContext, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

export default function Compare() {
  const [pickup, setPickup] = useState({ address: "", lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: "", lat: null, lng: null });
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetData, setSheetData] = useState({ rides: [], pickup: null, dropoff: null });

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const pickupRef = useRef(null);

  useEffect(() => {
    const incomingPickup = location.state?.pickup;
    const incomingDropoff = location.state?.dropoff;

    if (incomingPickup?.address) {
      setPickup({
        address: incomingPickup.address,
        lat: incomingPickup.lat ?? null,
        lng: incomingPickup.lng ?? null,
      });
    }
    if (incomingDropoff?.address) {
      setDropoff({
        address: incomingDropoff.address,
        lat: incomingDropoff.lat ?? null,
        lng: incomingDropoff.lng ?? null,
      });
    }

    if (incomingPickup || incomingDropoff) {
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

  const handleCompare = async () => {
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

  const pickupText = sheetData?.pickup?.address || pickup?.address || "Pickup";
  const dropoffText = sheetData?.dropoff?.address || dropoff?.address || "Dropoff";

  const greetingName = useMemo(() => {
    const full = user?.full_name || user?.name || "";
    const first = String(full).trim().split(" ")[0];
    return first || "";
  }, [user]);

  const greeting = useMemo(() => timeGreeting(greetingName), [greetingName]);
  const tagline = "Where would you like to go today?";

  const canCompare = Boolean(pickup?.address?.trim()) && Boolean(dropoff?.address?.trim()) && !loading;

  return (
    <>
      <div className="text-center mb-7 md:mb-9 animate-fade-in-up">
        <h1 className="text-xl md:text-3xl font-semibold mb-2">{greeting}</h1>
        <p className="text-muted-foreground text-sm md:text-base">{tagline}</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-card space-y-4 animate-fade-in-up">
        <div>
          <LocationInput
            label="Pickup"
            value={pickup}
            onChange={setPickup}
            placeholder="Enter pickup location"
            icon="pickup"
            showCurrentLocation
            inputRef={pickupRef}
            onLocationError={() => toast.error("Location access unavailable")}
          />
        </div>

        <div>
          <LocationInput
            label="Dropoff"
            value={dropoff}
            onChange={setDropoff}
            placeholder="Where are you going?"
            icon="dropoff"
            onLocationError={() => toast.error("Location search unavailable")}
          />
        </div>

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
        onAddStop={() => toast("Stops are coming next👀")}
        snapPoints={[0.18, 0.66, 0.92]}
        initialSnap={1}
        maxWidthClass="max-w-lg"
      >
        <CompareResults
          embedded
          rides={sheetData.rides}
          onClose={() => setSheetOpen(false)}
        />
      </BottomSheet>
    </>
  );
}