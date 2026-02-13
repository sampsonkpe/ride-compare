import { useState, useContext, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Plus } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import ridesService from "../services/ridesService";
import toast from "react-hot-toast";
import LocationInput from "../components/rides/LocationInput";

import BottomSheet from "../components/overlays/BottomSheet";
import CompareResults from "./CompareResults";

async function geocodeAddressIfAvailable(address) {
  const trimmed = (address || "").trim();
  if (!trimmed) return null;
  if (!window.google?.maps?.Geocoder) return null;

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

function getFirstName(user) {
  const full = (user?.full_name || user?.name || "").trim();
  if (full) return full.split(/\s+/)[0];
  const email = (user?.email || "").trim();
  if (email && email.includes("@")) return email.split("@")[0];
  return "";
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function RoutePill({ text, onClose, onAddStop }) {
  return (
    <div
      className="w-full rc-card px-3 py-2"
      style={{ boxShadow: "0 18px 55px rgba(0,0,0,0.30)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onClose}
          className="rc-icon-btn"
          aria-label="Close sheet"
          title="Close"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold text-foreground">{text}</div>
          <div className="text-xs text-muted-foreground font-medium">Available rides</div>
        </div>

        <button
          type="button"
          onClick={onAddStop}
          className="rc-icon-btn"
          aria-label="Add stop"
          title="Stops coming soon"
        >
          <Plus className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
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

    const coords = await geocodeAddressIfAvailable(address);
    if (!coords) return null;

    return { address, lat: Number(coords.lat), lng: Number(coords.lng) };
  };

  const pickupAddress = (pickup?.address || "").trim();
  const dropoffAddress = (dropoff?.address || "").trim();
  const isFormValid = pickupAddress.length > 0 && dropoffAddress.length > 0;

  const handleCompare = async () => {
    if (!isFormValid) return;

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

  const routePillText = useMemo(() => {
    const left = (pickupText || "Pickup").split(",")[0]?.trim() || "Pickup";
    const right = (dropoffText || "Dropoff").split(",")[0]?.trim() || "Dropoff";
    return `${left} → ${right}`;
  }, [pickupText, dropoffText]);

  const name = getFirstName(user);
  const greeting = `${timeGreeting()}${name ? `, ${name}!` : "!"}`;
  const tagline = "Where would you like to go today?";

  return (
    <>
      {/* Greeting (centred) */}
      <div className="text-center mb-6 animate-fade-in-up">
        <h1 className="text-[22px] md:text-3xl font-extrabold leading-tight mb-1">
          {greeting}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-medium">
          {tagline}
        </p>
      </div>

      {/* Form */}
      <div className="rc-card p-5 space-y-4 animate-fade-in-up">
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

        <LocationInput
          label="Dropoff"
          value={dropoff}
          onChange={setDropoff}
          placeholder="Where are you going?"
          icon="dropoff"
          onLocationError={() => toast.error("Location search unavailable")}
        />

        <button
          onClick={handleCompare}
          disabled={!isFormValid || loading}
          className={["rc-btn-primary", (!isFormValid || loading) ? "rc-btn-disabled" : ""].join(" ")}
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
          <p className="text-xs text-muted-foreground text-center font-medium">
            Tip: Sign in to save places and alerts.
          </p>
        ) : null}
      </div>

      {/* Floating route pill */}
      {sheetOpen ? (
        <div className="fixed left-0 right-0 z-[10001] px-4" style={{ top: 72 }}>
          <div className="mx-auto w-full max-w-lg">
            <RoutePill
              text={routePillText}
              onClose={() => setSheetOpen(false)}
              onAddStop={() => toast("Stops coming next.", { icon: "➕" })}
            />
          </div>
        </div>
      ) : null}

      {/* Bottom sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Available rides"
        subtitle={null}
        snapPoints={[0.18, 0.66, 0.92]}
        initialSnap={1}
        maxWidthClass="max-w-lg"
      >
        <CompareResults embedded rides={sheetData.rides} />
      </BottomSheet>
    </>
  );
}