import api from "./api";

function buildPayloadVariants(pickup, dropoff) {
  const p = {
    address: (pickup?.address || "").trim(),
    lat: pickup?.lat != null ? Number(pickup.lat) : null,
    lng: pickup?.lng != null ? Number(pickup.lng) : null,
  };

  const d = {
    address: (dropoff?.address || "").trim(),
    lat: dropoff?.lat != null ? Number(dropoff.lat) : null,
    lng: dropoff?.lng != null ? Number(dropoff.lng) : null,
  };

  // Variant 1: simple nested structure
  const v1 = { pickup: p, dropoff: d };

  // Variant 2: common DRF serializer naming
  const v2 = {
    pickup_address: p.address,
    pickup_lat: p.lat,
    pickup_lng: p.lng,
    dropoff_address: d.address,
    dropoff_lat: d.lat,
    dropoff_lng: d.lng,
  };

  // Variant 3: latitude/longitude naming
  const v3 = {
    pickup: { address: p.address, latitude: p.lat, longitude: p.lng },
    dropoff: { address: d.address, latitude: d.lat, longitude: d.lng },
  };

  return [v1, v2, v3];
}

async function postCompareWithFallbacks(pickup, dropoff) {
  const variants = buildPayloadVariants(pickup, dropoff);
  let lastErr = null;

  for (const payload of variants) {
    try {
      const response = await api.post("/rides/compare/", payload);
      return response.data;
    } catch (err) {
      lastErr = err;

      const status = err?.response?.status;
      if (status && ![400, 404, 415].includes(status)) break;
    }
  }

  throw lastErr;
}

function normaliseStops(stops = []) {
  const arr = Array.isArray(stops) ? stops : [];
  return arr.map((s) => ({
    kind: String(s?.kind || "").toUpperCase(),
    address: (s?.address || "").trim(),
    lat: s?.lat != null ? Number(s.lat) : null,
    lng: s?.lng != null ? Number(s.lng) : null,
  }));
}

const ridesService = {
  // Legacy compare (pickup/dropoff)
  compareRides: async (pickup, dropoff) => {
    return postCompareWithFallbacks(pickup, dropoff);
  },

  // New multi-stop compare (stops[])
  compareRoute: async (stops) => {
    const payloadStops = normaliseStops(stops);

    const response = await api.post("/rides/compare/", { stops: payloadStops });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get("/rides/history/");
    return response.data;
  },

  deleteHistory: async (id) => {
    const response = await api.delete(`/rides/history/${id}/`);
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.delete("/rides/history/clear/");
    return response.data;
  },
};

export default ridesService;