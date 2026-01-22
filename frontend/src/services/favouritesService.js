import api from './api';

const favouritesService = {
  // Get all favourites
  getFavourites: async () => {
    const response = await api.get('/favourites/');
    return response.data;
  },

  // Create new favourite
  createFavourite: async (favouriteData) => {
    const response = await api.post('/favourites/', favouriteData);
    return response.data;
  },

  // Update favourite
  updateFavourite: async (id, favouriteData) => {
    const response = await api.put(`/favourites/${id}/`, favouriteData);
    return response.data;
  },

  // Delete favourite
  deleteFavourite: async (id) => {
    const response = await api.delete(`/favourites/${id}/`);
    return response.data;
  },
};

export default favouritesService;