import logo from '../assets/ridecomparelogo.png';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ridesService from '../services/ridesService';
import toast from 'react-hot-toast';

export default function Home() {
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: '', lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCompare = async () => {
    if (!pickup.lat || !dropoff.lat) {
      toast.error('Please enter both pickup and dropoff locations');
      return;
    }

    setLoading(true);
    try {
      const data = await ridesService.compareRides(pickup, dropoff);
      navigate('/compare', { state: { rides: data.rides, pickup, dropoff } });
    } catch (error) {
      toast.error('Failed to compare rides');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <img src={logo} alt="ridecompare logo" className="h-8" />
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Compare rides instantly</h2>
          <p className="text-gray-400 text-lg">
            Find the best price and fastest ride across all platforms
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pickup
            </label>
            <input
              type="text"
              placeholder="Enter pickup location"
              value={pickup.address}
              onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dropoff
            </label>
            <input
              type="text"
              placeholder="Where are you going?"
              value={dropoff.address}
              onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Finding rides...' : '🔍 Compare Rides'}
          </button>
        </div>

        {/* Recent Searches - TODO: Load from API */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🕐 Recent searches
            </h3>
            <button className="text-gray-400 hover:text-white text-sm">
              Clear all
            </button>
          </div>
          <p className="text-gray-500 text-center py-8">No recent searches</p>
        </div>
      </main>
    </div>
  );
}