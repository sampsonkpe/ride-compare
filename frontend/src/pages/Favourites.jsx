import { useEffect, useState } from "react";
import favouritesService from "../services/favouritesService";
import toast from "react-hot-toast";
import { Home, Briefcase, MapPin, Plus, Trash2 } from "lucide-react";

const typeIcon = {
  HOME: Home,
  WORK: Briefcase,
  OTHER: MapPin,
};

function safeType(value) {
  const t = String(value || "").toUpperCase();
  if (t === "HOME" || t === "WORK" || t === "OTHER") return t;
  return "OTHER";
}

export default function Favourites() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    try {
      const data = await favouritesService.getFavourites();
      setFavourites(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load favourites");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await favouritesService.deleteFavourite(id);
      setFavourites((prev) => prev.filter((p) => p.id !== id));
      toast.success("Favourite removed");
    } catch {
      toast.error("Failed to remove favourite");
    }
  };

  const handleAdd = () => {
    toast("Add favourite flow next");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading favourites…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Favourites</h2>

          <button
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
            type="button"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {favourites.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            No favourites yet
          </div>
        ) : (
          <div className="space-y-4">
            {favourites.map((fav) => {
              const t = safeType(fav.type);
              const Icon = typeIcon[t] || MapPin;

              const title = fav.label || (t === "HOME" ? "Home" : t === "WORK" ? "Work" : "Favourite");
              const address = fav.address || fav.location || "—";

              return (
                <div
                  key={fav.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex justify-between items-center gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-5 w-5 text-gray-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{title}</p>
                      <p className="text-gray-400 text-sm truncate">{address}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(fav.id)}
                    className="text-gray-400 hover:text-red-400 shrink-0"
                    type="button"
                    aria-label="Delete favourite"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}