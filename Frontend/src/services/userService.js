import { apiRequest } from './core/apiClient';

export const userAPI = {
  getAllUsers: async ({ page = 1, limit = 10, search = '' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);

    return apiRequest(`/users?${params.toString()}`, {
      method: 'GET',
    });
  },

  getUserById: async userId => {
    if (!userId) {
      return {
        success: false,
        error: {
          message: 'User ID is required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/users/${userId}`, {
      method: 'GET',
    });
  },

  updateUser: async (userId, userData) => {
    if (!userId) {
      return {
        success: false,
        error: {
          message: 'User ID is required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async userId => {
    if (!userId) {
      return {
        success: false,
        error: {
          message: 'User ID is required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  flagUser: async (userId, flagReason = '') => {
    if (!userId) {
      return {
        success: false,
        error: {
          message: 'User ID is required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/users/${userId}/flag`, {
      method: 'PUT',
      body: JSON.stringify({ isFlagged: true, flagReason }),
    });
  },

  unflagUser: async userId => {
    if (!userId) {
      return {
        success: false,
        error: {
          message: 'User ID is required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/users/${userId}/flag`, {
      method: 'PUT',
      body: JSON.stringify({ isFlagged: false }),
    });
  },
};

export default userAPI;
