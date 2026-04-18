import { apiRequest } from './core/apiClient';

export const reviewVideoAPI = {
  getLatest: () => apiRequest('/review-video/latest'),

  upload: data =>
    apiRequest('/review-video/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/review-video/all${query ? `?${query}` : ''}`);
  },

  update: (id, data) =>
    apiRequest(`/review-video/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setActive: id =>
    apiRequest(`/review-video/${id}/set-active`, { method: 'PATCH' }),

  delete: id => apiRequest(`/review-video/${id}`, { method: 'DELETE' }),
};

export default reviewVideoAPI;
