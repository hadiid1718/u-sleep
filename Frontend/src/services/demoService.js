import { apiRequest } from './core/apiClient';

export const demoAPI = {
  getAvailableDates: async () => {
    return apiRequest('/demo/available-dates', {
      method: 'GET',
    });
  },

  getAvailableTimes: async date => {
    if (!date) {
      return {
        success: false,
        error: {
          message: 'Date is required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/demo/available-times/${date}`, {
      method: 'GET',
    });
  },

  scheduleDemo: async demoData => {
    const { email, name, company, phone, demoDate, timeSlot } = demoData;

    if (!email || !demoDate || !timeSlot) {
      return {
        success: false,
        error: {
          message: 'Email, demo date, and time slot are required',
          statusCode: 400,
        },
      };
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: {
          message: 'Please enter a valid email address',
          statusCode: 400,
        },
      };
    }

    return apiRequest('/demo/schedule', {
      method: 'POST',
      body: JSON.stringify({
        email,
        name: name || null,
        company: company || null,
        phone: phone || null,
        demoDate,
        timeSlot,
      }),
    });
  },

  getAllDemos: async ({
    page = 1,
    limit = 9,
    status = '',
    date = '',
    email = '',
  } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    if (date) params.append('date', date);
    if (email) params.append('email', email);

    return apiRequest(`/demo/all?${params.toString()}`, {
      method: 'GET',
    });
  },

  getDemoById: async demoId => {
    if (!demoId) {
      return {
        success: false,
        error: {
          message: 'Demo ID is required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/demo/${demoId}`, {
      method: 'GET',
    });
  },

  updateDemoStatus: async (demoId, status, notes = '') => {
    if (!demoId || !status) {
      return {
        success: false,
        error: {
          message: 'Demo ID and status are required',
          statusCode: 400,
        },
      };
    }

    return apiRequest(`/demo/${demoId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  cancelDemo: async demoId => {
    if (!demoId) {
      return {
        success: false,
        error: {
          message: 'Demo ID is required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/demo/${demoId}`, {
      method: 'DELETE',
    });
  },
};

export default demoAPI;
