import { API_BASE_URL, apiRequest } from './core/apiClient';

const GOOGLE_OAUTH_START_URL =
  import.meta.env.VITE_GOOGLE_OAUTH_START_URL || `${API_BASE_URL}/auth/google`;
const FREELANCER_OAUTH_START_URL =
  import.meta.env.VITE_FREELANCER_OAUTH_START_URL ||
  `${API_BASE_URL}/auth/freelancer/connect`;

export const authAPI = {
  signUp: async (name, email, password) => {
    return apiRequest('/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  signIn: async (email, password) => {
    return apiRequest('/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signOut: async () => {
    return apiRequest('/auth/sign-out', {
      method: 'POST',
    });
  },

  resendVerification: async email => {
    return apiRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getGoogleOAuthUrl: (state = 'signin') => {
    const separator = GOOGLE_OAUTH_START_URL.includes('?') ? '&' : '?';
    return `${GOOGLE_OAUTH_START_URL}${separator}state=${encodeURIComponent(state)}`;
  },

  getFreelancerOAuthUrl: (state = 'connect', returnTo = null) => {
    const token = localStorage.getItem('token') || '';
    const separator = FREELANCER_OAUTH_START_URL.includes('?') ? '&' : '?';
    let url = `${FREELANCER_OAUTH_START_URL}${separator}state=${encodeURIComponent(state)}&appToken=${encodeURIComponent(token)}`;
    if (returnTo) {
      url += `&returnTo=${encodeURIComponent(returnTo)}`;
    }
    return url;
  },
};

export const parseOAuthUserPayload = userParam => {
  if (!userParam) return null;

  try {
    return JSON.parse(userParam);
  } catch {
    // ignore parse errors
  }

  try {
    return JSON.parse(decodeURIComponent(userParam));
  } catch {
    return null;
  }
};

export default authAPI;