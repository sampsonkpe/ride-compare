import { useNavigate } from "react-router-dom";
import logo from "../assets/ridecomparelogo.png";

export default function Auth() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="w-full p-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/compare")}
          className="text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <img src={logo} alt="RideCompare" className="h-8" />
        <div className="w-10" />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-2">Auth (Phase 1)</h1>
          <p className="text-gray-400 mb-6">
            Next we'll recreate Lovable's toggle login/signup here.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-blue-600 rounded-lg font-semibold"
            >
              Go to Login (temporary)
            </button>
            <button
              onClick={() => navigate("/register")}
              className="w-full py-3 bg-gray-800 rounded-lg font-semibold"
            >
              Go to Register (temporary)
            </button>

            <button
              onClick={() => navigate("/compare")}
              className="w-full py-3 text-gray-300 hover:text-white"
            >
              Continue without signing in →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}