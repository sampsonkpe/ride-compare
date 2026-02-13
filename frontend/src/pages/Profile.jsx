import { useEffect, useMemo, useState, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import favouritesService from "../services/favouritesService";
import LocationInput from "../components/rides/LocationInput";
import {
  User,
  Home,
  Briefcase,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  LogOut,
} from "lucide-react";

const typeIcon = { HOME: Home, WORK: Briefcase, OTHER: MapPin };

function safeType(value) {
  const t = String(value || "").toUpperCase();
  if (t === "HOME" || t === "WORK" || t === "OTHER") return t;
  return "OTHER";
}

function normalizeAddressValue(value) {
  if (!value) return { address: "", lat: null, lng: null };
  if (typeof value === "string") return { address: value, lat: null, lng: null };
  return { address: value.address || "", lat: value.lat ?? null, lng: value.lng ?? null };
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
  return fav?.address || fav?.location?.address || (typeof fav?.location === "string" ? fav.location : "") || "";
}

function extractLabel(fav) {
  return fav?.label || fav?.name || fav?.title || "";
}

function extractType(fav) {
  return safeType(fav?.type || fav?.place_type || fav?.kind || "OTHER");
}

export default function Profile() {
  const { user, logout } = useContext(AuthContext);

  const [favourites, setFavourites] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);

  const [type, setType] = useState("OTHER");
  const [label, setLabel] = useState("");
  const [locationValue, setLocationValue] = useState({ address: "", lat: null, lng: null });

  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    setLoadingPlaces(true);
    try {
      const data = await favouritesService.getFavourites();
      setFavourites(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load saved places");
    } finally {
      setLoadingPlaces(false);
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
      toast.success("Place removed");
    } catch {
      toast.error("Failed to remove place");
    }
  };

  const defaultLabelForType = useMemo(() => {
    if (type === "HOME") return "Home";
    if (type === "WORK") return "Work";
    return "";
  }, [type]);

  const buildPayloadVariants = ({ finalLabel, address, lat, lng, type }) => {
    const v1 = { type, label: finalLabel, address, lat, lng };
    const v2 = { place_type: type, name: finalLabel, address, latitude: lat, longitude: lng };
    const v3 = { type, label: finalLabel, location: { address, lat, lng } };
    return [v1, v2, v3];
  };

  const createWithFallbacks = async (input) => {
    const variants = buildPayloadVariants(input);
    let lastErr = null;
    for (const payload of variants) {
      try {
        const created = await favouritesService.createFavourite(payload);
        return { created };
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
        return { updated };
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  };

  const handleSave = async () => {
    const finalLabel = (label || defaultLabelForType).trim();
    const address = (locationValue.address || "").trim();

    if (!finalLabel) return toast.error("Please enter a label");
    if (!address) return toast.error("Please choose a location");
    if (locationValue.lat == null || locationValue.lng == null) {
      return toast.error("Please select a suggested place so we can get coordinates.");
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
        setFavourites((prev) => prev.map((f) => (f.id === editingId ? updated : f)));
        toast.success("Place updated");
        setIsModalOpen(false);
        return;
      }

      const { created } = await createWithFallbacks(input);
      setFavourites((prev) => [created, ...prev]);
      toast.success("Place saved");
      setIsModalOpen(false);
    } catch (e) {
      const msg = prettyErrorData(e?.response?.data) || "Failed to save place";
      console.error(e);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const iconBtn = "rc-icon-btn";
  const primaryBtn = "rc-btn-primary";
  const destructiveOutline =
    "w-full min-h-[50px] px-6 rounded-xl border border-destructive/30 text-destructive " +
    "hover:bg-destructive/10 transition inline-flex items-center justify-center gap-2 font-semibold " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="pb-10">
      <div className="space-y-6">
        {/* User card */}
        <div className="rc-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-semibold">Signed in as</p>
              <p className="font-semibold truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Saved places header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Saved places</h3>
          <button type="button" onClick={openAddModal} className={primaryBtn}>
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* Saved places list */}
        {loadingPlaces ? (
          <div className="text-muted-foreground">Loading saved places…</div>
        ) : favourites.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center">
            No saved places yet.
          </div>
        ) : (
          <div className="space-y-3">
            {favourites.map((fav) => {
              const t = extractType(fav);
              const Icon = typeIcon[t] || MapPin;

              const title = extractLabel(fav) || (t === "HOME" ? "Home" : t === "WORK" ? "Work" : "Favourite");
              const addressText = extractAddress(fav) || "—";

              return (
                <div key={fav.id} className="rc-card rc-card-hover p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{title}</p>
                        <p className="text-sm text-muted-foreground truncate">{addressText}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" className={iconBtn} onClick={() => openEditModal(fav)} aria-label="Edit">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        className={[iconBtn, "hover:bg-destructive/10"].join(" ")}
                        onClick={() => handleDelete(fav.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sign out */}
        <button
          type="button"
          className={destructiveOutline}
          onClick={async () => {
            await logout();
            window.location.href = "/auth";
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      {/* Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-background/80"
            onClick={closeModal}
            type="button"
            aria-label="Close modal overlay"
          />

          <form
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-card-hover"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h4 className="font-semibold">{mode === "edit" ? "Edit place" : "Save place"}</h4>
              <button type="button" onClick={closeModal} className={iconBtn} disabled={saving} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Type</label>
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
                        disabled={saving}
                        className={[
                          "h-11 rounded-xl border px-3 inline-flex items-center justify-center gap-2 text-sm font-semibold transition",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted",
                        ].join(" ")}
                      >
                        <item.Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Label</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={defaultLabelForType || "e.g. Gym"}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                  disabled={saving}
                />
                <p className="mt-2 text-xs text-muted-foreground">For Home/Work, you can leave this empty.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Location</label>
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

            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="min-h-[50px] px-6 rounded-xl border border-border bg-card hover:bg-muted transition font-semibold
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className={primaryBtn} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}