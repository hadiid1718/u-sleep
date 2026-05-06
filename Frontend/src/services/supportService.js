import { apiRequest } from './core/apiClient';
import { adminApiRequest } from './core/adminApiClient';

export const supportAPI = {
  getUserChats: async () => {
    return apiRequest('/support/chats', { method: 'GET' });
  },

  postUserMessage: async (message) => {
    return apiRequest('/support/chats', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Admin endpoints
  adminListAllChats: async (page = 1, limit = 10) => {
    return adminApiRequest(`/support/admin/chats?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  adminListUserMessages: async (userId, page = 1, limit = 20) => {
    return adminApiRequest(`/support/chats/${userId}?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  adminPostReply: async (userId, message) => {
    return adminApiRequest(`/support/chats/${userId}/reply`, { 
      method: 'POST', 
      body: JSON.stringify({ message }) 
    });
  },

  adminMarkAsRead: async (userId) => {
    return adminApiRequest(`/support/chats/${userId}/read`, { method: 'PATCH' });
  },
};

export default supportAPI;
