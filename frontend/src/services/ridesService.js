import api from './api';

const ridesService = {
  // Compare rides across providers
  compareRides: async (pickup, dropoff) => {
    const response = await api.post('/rides/compare/', { pickup, dropoff });
    return response.data;
  },

  // Get search history
  getHistory: async () => {
    const response = await api.get('/rides/history/');
    return response.data;
  },

  // Delete specific history item
  deleteHistory: async (id) => {
    const response = await api.delete(`/rides/history/${id}/`);
    return response.data;
  },

  // Clear all history
  clearHistory: async () => {
    const response = await api.delete('/rides/history/clear/');
    return response.data;
  },
};

export default ridesService;