import { apiRequest } from './core/apiClient';

const buildQuery = params => {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export const notificationAPI = {
  getNotifications: async ({
    page = 1,
    limit = 20,
    group,
    type,
    priority,
    read,
  } = {}) => {
    return apiRequest(
      `/notifications${buildQuery({
        page,
        limit,
        group,
        type,
        priority,
        read,
      })}`,
      {
        method: 'GET',
      }
    );
  },

  getSummary: async () => {
    return apiRequest('/notifications/summary', {
      method: 'GET',
    });
  },

  markAsRead: async notificationId => {
    if (!notificationId) {
      return {
        success: false,
        error: { message: 'Notification ID is required', statusCode: 400 },
      };
    }

    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  markAllRead: async group => {
    return apiRequest('/notifications/read-all', {
      method: 'PATCH',
      body: JSON.stringify(group ? { group } : {}),
    });
  },

  deleteOne: async notificationId => {
    if (!notificationId) {
      return {
        success: false,
        error: { message: 'Notification ID is required', statusCode: 400 },
      };
    }

    return apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  deleteAll: async group => {
    return apiRequest('/notifications/all', {
      method: 'DELETE',
      body: JSON.stringify(group ? { group } : {}),
    });
  },
};

export default notificationAPI;
