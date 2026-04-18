import { apiRequest } from './core/apiClient';

export const comparisonAPI = {
  getComparisons: () => apiRequest('/comparisons'),
  getAllComparisons: () => apiRequest('/comparisons/all'),
  createComparison: data =>
    apiRequest('/comparisons', { method: 'POST', body: JSON.stringify(data) }),
  updateComparison: (id, data) =>
    apiRequest(`/comparisons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteComparison: id =>
    apiRequest(`/comparisons/${id}`, { method: 'DELETE' }),
  seedComparisons: () =>
    apiRequest('/comparisons/seed', { method: 'POST' }),
};

export default comparisonAPI;
