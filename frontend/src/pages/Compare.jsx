import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ridesService from "../services/ridesService";
import toast from "react-hot-toast";
import logo from "../assets/ridecomparelogo.png";
import LocationInput from "../components/rides/LocationInput";
import { LogIn, LogOut, UserCog } from "lucide-react";

function loadGoogleMapsScript() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env");

  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
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
    script.onload = () => resolve();
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

    geocoder.geocode(
      {
        address: trimmed,
        region: "GH",
      },
      (results, status) => {
        if (status !== "OK" || !results?.[0]?.geometry?.location) {
          resolve(null);
          return;
        }

        const loc = results[0].geometry.location;
        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
        });
      }
    );
  });
}

function stringifyErrorData(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch {
    return "Request failed";
  }
}

export default function Compare() {
  const [pickup, setPickup] = useState({ address: "", lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: "", lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const pickupRef = useRef(null);

  // Prefill from Favourites navigation state
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
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const ensureCoords = async (loc) => {
    const address = loc?.address?.trim();
    if (!address) return null;

    if (loc.lat != null && loc.lng != null) {
      return {
        address,
        lat: Number(loc.lat),
        lng: Number(loc.lng),
      };
    }

    const coords = await geocodeAddress(address);
    if (!coords) return null;

    return { address, lat: Number(coords.lat), lng: Number(coords.lng) };
  };

  const handleCompare = async () => {
    const pickupAddress = pickup.address?.trim();
    const dropoffAddress = dropoff.address?.trim();

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

      if (!pickupFinal) {
        toast.error(
          "Could not find pickup location. Please select a suggestion."
        );
        return;
      }
      if (!dropoffFinal) {
        toast.error(
          "Could not find dropoff location. Please select a suggestion."
        );
        return;
      }

      const data = await ridesService.compareRides(pickupFinal, dropoffFinal);

      navigate("/compare/results", {
        state: {
          rides: data.rides,
          pickup: pickupFinal,
          dropoff: dropoffFinal,
        },
      });

      if (user) loadHistory();
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.error("Compare failed:", {
        status,
        data,
        pickup,
        dropoff,
      });

      toast.error(stringifyErrorData(data) || "Failed to compare rides");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await ridesService.clearHistory();
      setHistory([]);
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  const handleHistoryClick = (item) => {
    setPickup({
      address: item.pickup_address,
      lat: item.pickup_lat,
      lng: item.pickup_lng,
    });
    setDropoff({
      address: item.dropoff_address,
      lat: item.dropoff_lat,
      lng: item.dropoff_lng,
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen text-foreground bg-gradient-to-b from-black via-gray-950 to-black">
      <header className="border-b border-border-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate("/compare")}
            className="flex items-center gap-2"
            aria-label="Go to compare"
            type="button"
          >
            <img src={logo} alt="ridecompare logo" className="h-8 invert" />
          </button>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-400 text-sm">{user?.email}</span>

                <button
                  onClick={() => navigate("/profile")}
                  className="text-gray-400 hover:text-foreground text-sm inline-flex items-center gap-2"
                  type="button"
                  aria-label="Profile"
                  title="Profile"
                >
                  <UserCog className="w-4 h-4" />
                  Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-foreground text-sm inline-flex items-center gap-2"
                  type="button"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="text-gray-300 hover:text-foreground text-sm inline-flex items-center gap-2"
                type="button"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Compare rides instantly</h2>
          <p className="text-gray-400 text-lg">
            Find the best price and fastest ride across all platforms
          </p>
        </div>

        <div className="rounded-2xl p-6 border border-border/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pickup
            </label>
            <LocationInput
              value={pickup}
              onChange={setPickup}
              placeholder="Enter pickup location"
              icon="pickup"
              showCurrentLocation
              inputRef={pickupRef}
              onLocationError={() =>
                toast.error("Location access denied or unavailable")
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dropoff
            </label>
            <LocationInput
              value={dropoff}
              onChange={setDropoff}
              placeholder="Where are you going?"
              icon="dropoff"
              onLocationError={() =>
                toast.error("Location search is unavailable right now")
              }
            />
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-foreground font-semibold rounded-lg transition disabled:opacity-50"
            type="button"
          >
            {loading ? "Finding rides..." : "Compare Rides"}
          </button>
        </div>

        {user && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent searches</h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-gray-400 hover:text-foreground text-sm"
                  type="button"
                >
                  Clear all
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent searches</p>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full bg-gray-900 border border-border-800 rounded-lg p-4 text-left hover:border-border-700 transition"
                    type="button"
                  >
                    <p className="font-medium">{item.pickup_address}</p>
                    <p className="text-gray-400 text-sm">
                      → {item.dropoff_address}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
