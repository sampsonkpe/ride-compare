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

  const card =
    "bg-card border border-border rounded-2xl shadow-card";

  const rowBtn =
    "w-full rounded-2xl border border-border bg-card shadow-card p-5 " +
    "flex items-center justify-between transition hover:opacity-90 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const destructiveBtn =
    "w-full h-11 px-4 rounded-xl border border-border bg-card shadow-card " +
    "inline-flex items-center gap-2 text-sm font-semibold text-destructive " +
    "hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className={`${card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Profile</h2>
            </div>

            <p className="text-muted-foreground">{user?.email}</p>
          </div>

          <button onClick={() => navigate("/favourites")} className={rowBtn} type="button">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Favourites</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </button>

          <button onClick={handleLogout} className={destructiveBtn} type="button">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}