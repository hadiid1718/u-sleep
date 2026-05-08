import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const billingClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

billingClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const parseApiError = (error, fallbackMessage) => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage;

  return {
    message,
    statusCode: error?.response?.status || 500,
    details: error?.response?.data || null,
  };
};

export const billingService = {
  async getPlans() {
    try {
      const response = await billingClient.get('/billing/plans');
      return { success: true, data: response.data?.data || [] };
    } catch (error) {
      return {
        success: false,
        error: parseApiError(error, 'Failed to load billing plans'),
      };
    }
  },

  async getSubscription() {
    try {
      const response = await billingClient.get('/billing/subscription');
      return { success: true, data: response.data?.data || null };
    } catch (error) {
      return {
        success: false,
        error: parseApiError(error, 'Failed to load subscription'),
      };
    }
  },

  async createCheckoutSession(planId) {
    try {
      const response = await billingClient.post('/billing/create-checkout-session', {
        planId,
      });

      return {
        success: true,
        data: response.data?.data || null,
      };
    } catch (error) {
      return {
        success: false,
        error: parseApiError(error, 'Failed to create checkout session'),
      };
    }
  },

  async createPortalSession() {
    try {
      const response = await billingClient.post('/billing/create-portal-session');
      return {
        success: true,
        data: response.data?.data || null,
      };
    } catch (error) {
      return {
        success: false,
        error: parseApiError(error, 'Failed to open billing portal'),
      };
    }
  },

  async cancelSubscription() {
    try {
      const response = await billingClient.post('/billing/cancel');
      return {
        success: true,
        data: response.data?.data || null,
        message: response.data?.message || 'Subscription canceled',
      };
    } catch (error) {
      return {
        success: false,
        error: parseApiError(error, 'Failed to cancel subscription'),
      };
    }
  },

  async finalizeCheckoutSession(sessionId) {
    try {
      const response = await billingClient.post('/billing/checkout-session/complete', {
        sessionId,
      });

      return {
        success: true,
        data: response.data?.data || null,
      };
    } catch (error) {
      return {
        success: false,
        error: parseApiError(error, 'Failed to finalize checkout session'),
      };
    }
  },
};

export default billingService;
