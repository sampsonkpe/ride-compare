import api from "./api";

const DEFAULT_PATHS = [
  "/favourites/",
  "/favorites/",
  "/places/",
  "/saved-places/",
  "/profile/places/",
];

const OVERRIDE = import.meta.env.VITE_FAVOURITES_PATH;

const PATHS = OVERRIDE ? [String(OVERRIDE)] : DEFAULT_PATHS;

function isWrongSerializerError(data) {
  return (
    data &&
    typeof data === "object" &&
    ("pickup_address" in data ||
      "pickup_lat" in data ||
      "pickup_lng" in data ||
      "dropoff_address" in data ||
      "dropoff_lat" in data ||
      "dropoff_lng" in data)
  );
}

async function detectEndpoint() {
  for (const path of PATHS) {
    try {
      await api.get(path);
      return path;
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 405) return path;
    }
  }
  return PATHS[0] || "/favourites/";
}

function buildPayloadVariants({ type, label, address, lat, lng }) {
  const v1 = { type, label, address, lat, lng };
  const v2 = { place_type: type, name: label, address, latitude: lat, longitude: lng };
  const v3 = { type, label, location: { address, lat, lng } };
  return [v1, v2, v3];
}

async function postWithFallbacks(basePath, favouriteData) {
  const variants = buildPayloadVariants(favouriteData);
  let lastErr = null;

  for (const payload of variants) {
    try {
      const response = await api.post(basePath, payload);
      return response.data;
    } catch (err) {
      lastErr = err;
      const data = err?.response?.data;

      if (isWrongSerializerError(data)) {
        console.error("[favourites] Wrong endpoint/route mapped to compare serializer.", {
          basePath,
          data,
        });
        throw err;
      }

      const status = err?.response?.status;
      if (status && ![400, 404, 415].includes(status)) break;
    }
  }

  throw lastErr;
}

async function putWithFallbacks(basePath, id, favouriteData) {
  const variants = buildPayloadVariants(favouriteData);
  let lastErr = null;

  for (const payload of variants) {
    try {
      const response = await api.put(`${basePath}${id}/`, payload);
      return response.data;
    } catch (err) {
      lastErr = err;
      const data = err?.response?.data;

      if (isWrongSerializerError(data)) {
        console.error("[favourites] Wrong endpoint/route mapped to compare serializer.", {
          basePath,
          id,
          data,
        });
        throw err;
      }

      const status = err?.response?.status;
      if (status && ![400, 404, 415].includes(status)) break;
    }
  }

  throw lastErr;
}

const favouritesService = {
  getFavourites: async () => {
    const basePath = await detectEndpoint();
    const response = await api.get(basePath);
    return response.data;
  },

  createFavourite: async (favouriteData) => {
    const basePath = await detectEndpoint();
    return postWithFallbacks(basePath, favouriteData);
  },

  updateFavourite: async (id, favouriteData) => {
    const basePath = await detectEndpoint();
    return putWithFallbacks(basePath, id, favouriteData);
  },

  deleteFavourite: async (id) => {
    const basePath = await detectEndpoint();
    const response = await api.delete(`${basePath}${id}/`);
    return response.data;
  },
};

export default favouritesService;