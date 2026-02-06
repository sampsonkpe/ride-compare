import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import favouritesService from "../services/favouritesService";
import toast from "react-hot-toast";
import LocationInput from "../components/rides/LocationInput";
import {
  Home,
  Briefcase,
  MapPin,
  Plus,
  Trash2,
  X,
  Save,
  Pencil,
} from "lucide-react";

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

function normalizeAddressValue(value) {
  if (!value) return { address: "", lat: null, lng: null };
  if (typeof value === "string") return { address: value, lat: null, lng: null };
  return {
    address: value.address || "",
    lat: value.lat ?? null,
    lng: value.lng ?? null,
  };
}

function prettyErrorData(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch {
    return "Request failed";
  }
}

function extractLatLng(fav) {
  const lat =
    fav?.lat ??
    fav?.pickup_lat ??
    fav?.latitude ??
    fav?.location?.lat ??
    fav?.location?.latitude ??
    null;
  const lng =
    fav?.lng ??
    fav?.pickup_lng ??
    fav?.longitude ??
    fav?.location?.lng ??
    fav?.location?.longitude ??
    null;
  return { lat, lng };
}

function extractAddress(fav) {
  return (
    fav?.address ||
    fav?.location?.address ||
    (typeof fav?.location === "string" ? fav.location : "") ||
    ""
  );
}

function extractLabel(fav) {
  return fav?.label || fav?.name || fav?.title || "";
}

function extractType(fav) {
  return safeType(fav?.type || fav?.place_type || fav?.kind || "OTHER");
}

export default function Favourites() {
  const navigate = useNavigate();

  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // modal mode
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);

  const [type, setType] = useState("OTHER");
  const [label, setLabel] = useState("");
  const [locationValue, setLocationValue] = useState({
    address: "",
    lat: null,
    lng: null,
  });

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

  const resetModal = () => {
    setMode("create");
    setEditingId(null);
    setType("OTHER");
    setLabel("");
    setLocationValue({ address: "", lat: null, lng: null });
  };

  const openAddModal = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const openEditModal = (fav) => {
    const t = extractType(fav);
    const lbl = extractLabel(fav);
    const addr = extractAddress(fav);
    const { lat, lng } = extractLatLng(fav);

    setMode("edit");
    setEditingId(fav.id);
    setType(t);
    setLabel(lbl);
    setLocationValue({ address: addr, lat, lng });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
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

  const defaultLabelForType = useMemo(() => {
    if (type === "HOME") return "Home";
    if (type === "WORK") return "Work";
    return "";
  }, [type]);

  // Payload fallback variants (create + update)
  const buildPayloadVariants = ({ finalLabel, address, lat, lng, type }) => {
    const v1 = { type, label: finalLabel, address, lat, lng };
    const v2 = {
      place_type: type,
      name: finalLabel,
      address,
      latitude: lat,
      longitude: lng,
    };
    const v3 = { type, label: finalLabel, location: { address, lat, lng } };
    return [v1, v2, v3];
  };

  const createWithFallbacks = async (input) => {
    const variants = buildPayloadVariants(input);
    let lastErr = null;

    for (const payload of variants) {
      try {
        const created = await favouritesService.createFavourite(payload);
        return { created, usedPayload: payload };
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  };

  const updateWithFallbacks = async (id, input) => {
    const variants = buildPayloadVariants(input);
    let lastErr = null;

    for (const payload of variants) {
      try {
        const updated = await favouritesService.updateFavourite(id, payload);
        return { updated, usedPayload: payload };
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  };

  const handleSave = async () => {
    const finalLabel = (label || defaultLabelForType).trim();
    const address = (locationValue.address || "").trim();

    if (!finalLabel) {
      toast.error("Please enter a label");
      return;
    }
    if (!address) {
      toast.error("Please choose a location");
      return;
    }
    // Ensure coords exist (prevents saving free-typed text)
    if (locationValue.lat == null || locationValue.lng == null) {
      toast.error("Please select a suggested place so we can get coordinates.");
      return;
    }

    setSaving(true);
    try {
      const input = {
        finalLabel,
        address,
        lat: Number(locationValue.lat),
        lng: Number(locationValue.lng),
        type,
      };

      if (mode === "edit" && editingId != null) {
        const { updated } = await updateWithFallbacks(editingId, input);

        setFavourites((prev) =>
          prev.map((f) => (f.id === editingId ? updated : f))
        );

        toast.success("Favourite updated");
        setIsModalOpen(false);
        return;
      }

      const { created } = await createWithFallbacks(input);
      setFavourites((prev) => [created, ...prev]);

      toast.success("Favourite saved");
      setIsModalOpen(false);
    } catch (e) {
      const msg = prettyErrorData(e?.response?.data) || "Failed to save favourite";
      console.error(e);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const useAsPickup = (fav) => {
    const address = extractAddress(fav);
    const { lat, lng } = extractLatLng(fav);

    if (!address) {
      toast.error("This favourite has no address");
      return;
    }

    navigate("/compare", {
      state: {
        pickup: { address, lat: lat ?? null, lng: lng ?? null },
      },
    });
  };

  const useAsDropoff = (fav) => {
    const address = extractAddress(fav);
    const { lat, lng } = extractLatLng(fav);

    if (!address) {
      toast.error("This favourite has no address");
      return;
    }

    navigate("/compare", {
      state: {
        dropoff: { address, lat: lat ?? null, lng: lng ?? null },
      },
    });
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="text-gray-300 hover:text-white"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold">Favourites</h2>
          </div>

          <button
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
            type="button"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {favourites.length === 0 ? (
          <div className="text-center text-gray-400 py-16">No favourites yet</div>
        ) : (
          <div className="space-y-4">
            {favourites.map((fav) => {
              const t = extractType(fav);
              const Icon = typeIcon[t] || MapPin;

              const title =
                extractLabel(fav) ||
                (t === "HOME" ? "Home" : t === "WORK" ? "Work" : "Favourite");

              const addressText = extractAddress(fav) || "—";

              return (
                <div
                  key={fav.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-5 w-5 text-gray-300 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{title}</p>
                        <p className="text-gray-400 text-sm truncate">
                          {addressText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditModal(fav)}
                        className="text-gray-300 hover:text-white"
                        type="button"
                        aria-label="Edit favourite"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(fav.id)}
                        className="text-gray-400 hover:text-red-400"
                        type="button"
                        aria-label="Delete favourite"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => useAsPickup(fav)}
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      type="button"
                    >
                      Use as pickup
                    </button>
                    <button
                      onClick={() => useAsDropoff(fav)}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold"
                      type="button"
                    >
                      Use as dropoff
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute inset-0 bg-black/70"
            onClick={closeModal}
            type="button"
            aria-label="Close modal overlay"
          />

          {/* CHANGED: div -> form to prevent bubbling/submits hitting Compare */}
          <form
            className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.7)]"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold">
                {mode === "edit" ? "Edit favourite" : "Add favourite"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-300 hover:text-white"
                type="button"
                aria-label="Close"
                disabled={saving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "HOME", label: "Home", Icon: Home },
                    { key: "WORK", label: "Work", Icon: Briefcase },
                    { key: "OTHER", label: "Other", Icon: MapPin },
                  ].map((item) => {
                    const active = type === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setType(item.key)}
                        className={`rounded-xl border px-3 py-3 inline-flex items-center justify-center gap-2 text-sm font-semibold transition ${
                          active
                            ? "border-blue-500 bg-blue-600/20 text-white"
                            : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                        disabled={saving}
                      >
                        <item.Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Label
                </label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={defaultLabelForType || "e.g. Gym"}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
                  disabled={saving}
                />
                <p className="mt-2 text-xs text-gray-500">
                  For Home/Work, you can leave this empty.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <LocationInput
                  value={normalizeAddressValue(locationValue)}
                  onChange={(v) => setLocationValue(normalizeAddressValue(v))}
                  placeholder="Search a place"
                  icon="pickup"
                  showCurrentLocation
                  onLocationError={() => toast.error("Location search unavailable")}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold"
                type="button"
                disabled={saving}
              >
                Cancel
              </button>

              {/* CHANGED: type submit so Enter works, still isolated */}
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                type="submit"
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
