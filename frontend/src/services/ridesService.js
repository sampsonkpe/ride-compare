import api from "./api";

const ridesService = {
  compareRides: async (pickup, dropoff) => {
    const payload = {
      pickup: {
        address: (pickup?.address || "").trim(),
        lat: pickup?.lat != null ? Number(pickup.lat) : null,
        lng: pickup?.lng != null ? Number(pickup.lng) : null,
      },
      dropoff: {
        address: (dropoff?.address || "").trim(),
        lat: dropoff?.lat != null ? Number(dropoff.lat) : null,
        lng: dropoff?.lng != null ? Number(dropoff.lng) : null,
      },
    };

    const response = await api.post("/rides/compare/", payload);
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