const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Api request wrapper with error handling
const apiRequest = async (endpoint, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization token if available
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      error.response = data;
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);
    
    // Return structured error object
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
        statusCode: error.statusCode || 500,
        details: error.response || null,
      },
    };
  }
};

// =====================================================
// AUTH API ENDPOINTS
// =====================================================

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

  adminLogin: async (username, password) => {
    return apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  getAdminProfile: async () => {
    return apiRequest('/auth/admin/profile', {
      method: 'GET',
    });
  },
};

// =====================================================
// DEMO API ENDPOINTS
// =====================================================

export const demoAPI = {
  // Get all available dates for scheduling
  getAvailableDates: async () => {
    return apiRequest('/demo/available-dates', {
      method: 'GET',
    });
  },

  // Get available time slots for a specific date
  getAvailableTimes: async (date) => {
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

  // Schedule a new demo
  scheduleDemo: async (demoData) => {
    const { email, name, company, phone, demoDate, timeSlot } = demoData;

    // Validate required fields
    if (!email || !demoDate || !timeSlot) {
      return {
        success: false,
        error: {
          message: 'Email, demo date, and time slot are required',
          statusCode: 400,
        },
      };
    }

    // Validate email format
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

  // Get all demos (admin only) with pagination and filters
  getAllDemos: async ({ page = 1, limit = 9, status = '', date = '', email = '' } = {}) => {
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

  // Get specific demo by ID
  getDemoById: async (demoId) => {
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

  // Update demo status
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

  // Cancel demo
  cancelDemo: async (demoId) => {
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

// =====================================================
// USER API ENDPOINTS (Admin)
// =====================================================

export const userAPI = {
  // Get all users
  getAllUsers: async () => {
    return apiRequest('/users', {
      method: 'GET',
    });
  },

  // Get user by ID
  getUserById: async (userId) => {
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

  // Update user
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

  // Delete user
  deleteUser: async (userId) => {
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

  // Flag a user account (terms violation)
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

  // Unflag a user account
  unflagUser: async (userId) => {
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

// =====================================================
// ERROR HANDLING UTILITIES
// =====================================================

export const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && error.error && error.error.message) {
    return error.error.message;
  }
  
  if (error && error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const handleApiError = (apiResponse) => {
  if (!apiResponse.success) {
    return getErrorMessage(apiResponse);
  }
  return null;
};

// =====================================================
// TOKEN MANAGEMENT
// =====================================================

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

export const clearToken = () => {
  localStorage.removeItem('token');
};

export const getToken = () => {
  return localStorage.getItem('token');
};
