import { useLocation, useNavigate } from 'react-router-dom';

export default function Compare() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rides, pickup, dropoff } = location.state || {};

  if (!rides) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No ride data available</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-blue-500 hover:underline"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold mb-6">Available rides</h2>

        <div className="space-y-4">
          {rides.map((ride, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-{ride.provider === 'YANGO' ? 'red' : ride.provider === 'BOLT' ? 'green' : 'black'}-500">
                    {ride.provider}
                  </h3>
                  <p className="text-gray-400">{ride.service_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">GHS {ride.price}</p>
                  <p className="text-gray-400">{ride.eta_minutes} min away</p>
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