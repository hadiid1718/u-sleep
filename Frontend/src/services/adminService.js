import { adminApiRequest } from './core/adminApiClient';

export const adminAuthAPI = {
  signIn: async (email, password) => {
    return adminApiRequest('/auth/admin/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async () => {
    return adminApiRequest('/admin/me', { method: 'GET' });
  },
};

export const adminAPI = {
  getMetrics: async () => {
    return adminApiRequest('/admin/metrics', { method: 'GET' });
  },
  getUsers: async ({ page = 1, limit = 10, search = '', status = '' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return adminApiRequest(`/admin/users?${params.toString()}`, {
      method: 'GET',
    });
  },
  updateUser: async (userId, payload) => {
    return adminApiRequest(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateUserStatus: async (userId, payload) => {
    return adminApiRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteUser: async userId => {
    return adminApiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },
  getCases: async ({ page = 1, limit = 10, status = '' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    return adminApiRequest(`/admin/cases?${params.toString()}`, {
      method: 'GET',
    });
  },
  createCase: async payload => {
    return adminApiRequest('/admin/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  resolveCase: async (caseId, payload) => {
    return adminApiRequest(`/admin/cases/${caseId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  getViolationSettings: async () => {
    return adminApiRequest('/admin/settings/violations', {
      method: 'GET',
    });
  },
  updateViolationSettings: async payload => {
    return adminApiRequest('/admin/settings/violations', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
