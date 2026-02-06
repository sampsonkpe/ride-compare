import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { UserCog, MapPin, LogOut } from "lucide-react";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-foreground p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserCog className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Profile</h2>
          </div>

          <p className="text-gray-300">{user?.email}</p>
        </div>

        <button
          onClick={() => navigate("/favourites")}
          className="w-full bg-white/5 hover:bg-white/10 border border-border/10 rounded-2xl p-5 flex items-center justify-between"
          type="button"
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-300" />
            <span className="font-semibold">Favourites</span>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400"
          type="button"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}