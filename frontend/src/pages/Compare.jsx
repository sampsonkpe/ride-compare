import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ridesService from "../services/ridesService";
import toast from "react-hot-toast";
import logo from "../assets/ridecomparelogo.png";

export default function Compare() {
  const [pickup, setPickup] = useState({ address: "", lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: "", lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setHistory([]);
    }
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

  const handleCompare = async () => {
    const pickupAddress = pickup.address.trim();
    const dropoffAddress = dropoff.address.trim();

    if (!pickupAddress || !dropoffAddress) {
      toast.error("Please enter pickup and dropoff locations");
      return;
    }

    setLoading(true);
    try {
      // Phase 1: send address-only payload (lat/lng will be null until Phase 2)
      const pickupPayload = { address: pickupAddress };
      const dropoffPayload = { address: dropoffAddress };

      const data = await ridesService.compareRides(pickupPayload, dropoffPayload);

      navigate("/compare/results", {
        state: {
          rides: data.rides,
          pickup: { address: pickupAddress },
          dropoff: { address: dropoffAddress },
        },
      });

      if (user) loadHistory();
    } catch (error) {
      toast.error("Failed to compare rides");
      console.error(error);
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
    <div className="min-h-screen text-white bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate("/compare")}
            className="flex items-center gap-2"
            aria-label="Go to compare"
          >
            <img src={logo} alt="ridecompare logo" className="h-8" />
          </button>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-400 text-sm">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="text-gray-300 hover:text-white text-sm"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Compare rides instantly</h2>
          <p className="text-gray-400 text-lg">
            Find the best price and fastest ride across all platforms
          </p>
        </div>

        {/* Search */}
        <div className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pickup
            </label>
            <input
              type="text"
              value={pickup.address}
              onChange={(e) =>
                setPickup({ address: e.target.value, lat: null, lng: null })
              }
              placeholder="Enter your pickup location"
              className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dropoff
            </label>
            <input
              type="text"
              value={dropoff.address}
              onChange={(e) =>
                setDropoff({ address: e.target.value, lat: null, lng: null })
              }
              placeholder="Where are you going?"
              className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Finding rides..." : "Compare Rides"}
          </button>
        </div>

        {/* Recent Searches (auth only) */}
        {user && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent searches</h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-gray-400 hover:text-white text-sm"
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
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-4 text-left hover:border-gray-700 transition"
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
