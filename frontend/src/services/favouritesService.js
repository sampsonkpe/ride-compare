import api from "./api";

function normaliseFavouriteInput(input = {}) {
  const type = String(input.type || input.place_type || input.kind || "OTHER")
    .toUpperCase()
    .trim();

  const label = String(input.label ?? input.name ?? "").trim();

  const address =
    String(
      input.address ??
        input.location?.address ??
        input.formatted_address ??
        ""
    ).trim();

  const latRaw =
    input.lat ??
    input.location?.lat ??
    input.latitude ??
    input.location?.latitude ??
    null;

  const lngRaw =
    input.lng ??
    input.location?.lng ??
    input.longitude ??
    input.location?.longitude ??
    null;

  const lat = latRaw == null ? null : Number(latRaw);
  const lng = lngRaw == null ? null : Number(lngRaw);

  return { type, label, address, lat, lng };
}

const favouritesService = {
  async getFavourites() {
    const res = await api.get("/favourites/");
    return res.data;
  },

  async createFavourite(favouriteData) {
    const body = normaliseFavouriteInput(favouriteData);
    const res = await api.post("/favourites/", body);
    return res.data;
  },

  async updateFavourite(id, favouriteData) {
    const body = normaliseFavouriteInput(favouriteData);
    const res = await api.patch(`/favourites/${id}/`, body);
    return res.data;
  },

  async deleteFavourite(id) {
    const res = await api.delete(`/favourites/${id}/`);
    return res.data;
  },
};

export default favouritesService;