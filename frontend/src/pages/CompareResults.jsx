import { useLocation, useNavigate } from "react-router-dom";

export default function CompareResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const { rides, pickup, dropoff } = location.state || {};

  if (!rides || !Array.isArray(rides) || rides.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No ride data available</p>
          <button
            onClick={() => navigate("/compare")}
            className="px-6 py-2 bg-blue-600 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const pickupText = pickup?.address || "Pickup";
  const dropoffText = dropoff?.address || "Dropoff";

  const providerClass = (provider) => {
    if (provider === "YANGO") return "text-red-500";
    if (provider === "BOLT") return "text-green-500";
    if (provider === "UBER") return "text-blue-500";
    return "text-white";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/compare")}
          className="mb-6 text-blue-500 hover:underline"
        >
          ← Back
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold">Available rides</h2>
          <p className="text-gray-400 mt-1">
            {pickupText} <span className="mx-2">→</span> {dropoffText}
          </p>
        </div>

        <div className="space-y-4">
          {rides.map((ride, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <h3 className={`text-xl font-bold ${providerClass(ride.provider)}`}>
                    {ride.provider}
                  </h3>
                  <p className="text-gray-400 truncate">
                    {ride.service_type || "Service"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold">
                    GHS {Number(ride.price).toFixed(2)}
                  </p>
                  <p className="text-gray-400">
                    {ride.eta_minutes ?? "--"} min away
                  </p>
                </div>
              </div>

              <button className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">
                Continue in App
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
