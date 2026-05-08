import { apiRequest } from './core/apiClient';

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
};

export default supportAPI;
