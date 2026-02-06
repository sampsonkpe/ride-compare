import { UserCog, LogOut } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <UserCog className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold">Profile</h2>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-400 mb-2">Email</p>
        <p className="text-white mb-6">{user?.email}</p>

        <button
          onClick={async () => {
            await logout();
            navigate("/auth");
          }}
          className="flex items-center gap-2 text-red-400 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
