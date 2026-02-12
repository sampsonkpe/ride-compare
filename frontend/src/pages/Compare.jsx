import { useState, useContext, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import ridesService from "../services/ridesService";
import toast from "react-hot-toast";
import logo from "../assets/ridecomparelogo.png";
import LocationInput from "../components/rides/LocationInput";
import { LogIn, LogOut, UserCog } from "lucide-react";

// NEW
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
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps"))
      );
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
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }

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

export default function Compare() {
  const [pickup, setPickup] = useState({ address: "", lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: "", lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // NEW: sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetData, setSheetData] = useState({
    rides: [],
    pickup: null,
    dropoff: null,
  });

  const { user, logout } = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);
  const isDark = themeCtx?.isDark;

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

  useEffect(() => {
    if (user) loadHistory();
    else setHistory([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadHistory = async () => {
    try {
      const data = await ridesService.getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  };

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

      // NEW: open bottom sheet instead of navigating
      setSheetData({
        rides: Array.isArray(data?.rides) ? data.rides : [],
        pickup: pickupFinal,
        dropoff: dropoffFinal,
      });
      setSheetOpen(true);

      if (user) loadHistory();
    } catch (err) {
      console.error("Compare failed:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });

      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const headerRight = useMemo(() => {
    const ghostBtn =
      "inline-flex items-center gap-2 h-10 px-3 rounded-xl text-sm font-medium " +
      "text-muted-foreground hover:text-foreground hover:bg-accent transition " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

    if (user) {
      return (
        <>
          <span className="hidden sm:inline text-muted-foreground text-sm">
            {user.email}
          </span>

          <button
            onClick={() => navigate("/profile")}
            className={ghostBtn}
            type="button"
          >
            <UserCog className="h-4 w-4" />
            Profile
          </button>

          <button
            onClick={async () => {
              await logout();
              navigate("/auth");
            }}
            className={ghostBtn}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </>
      );
    }

    return (
      <button onClick={() => navigate("/auth")} className={ghostBtn} type="button">
        <LogIn className="h-4 w-4" />
        Sign in
      </button>
    );
  }, [user, navigate, logout]);

  const pickupText = sheetData?.pickup?.address || pickup?.address || "Pickup";
  const dropoffText = sheetData?.dropoff?.address || dropoff?.address || "Dropoff";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/compare")}
            className="flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
          >
            <img
              src={logo}
              alt="RideCompare"
              className={`!h-8 !w-auto object-contain ${isDark ? "logo-dark-invert" : ""}`}
            />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">{headerRight}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Compare rides instantly
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Find the best price across all platforms
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Pickup
            </label>
            <LocationInput
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
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Dropoff
            </label>
            <LocationInput
              value={dropoff}
              onChange={setDropoff}
              placeholder="Where are you going?"
              icon="dropoff"
              onLocationError={() => toast.error("Location search unavailable")}
            />
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold
              bg-primary text-primary-foreground hover:opacity-90 transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              disabled:opacity-50 disabled:pointer-events-none"
            type="button"
          >
            {loading ? "Finding rides…" : "Compare Rides"}
          </button>
        </div>
      </main>

      {/* Bottom pull-up sheet (collapsed when opened) */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Available rides"
        subtitle={`${pickupText} → ${dropoffText}`}
        initialSnap={0}
        snapPoints={[0.18, 0.58, 0.92]}
      >

        <CompareResults
          embedded
          rides={sheetData.rides}
          pickup={sheetData.pickup}
          dropoff={sheetData.dropoff}
        />
      </BottomSheet>
    </div>
  );
}