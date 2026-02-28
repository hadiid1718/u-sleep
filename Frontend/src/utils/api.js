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

    // Guard against non-JSON responses (e.g. HTML 404 pages)
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw Object.assign(
        new Error(`Server returned non-JSON response (${response.status}). Is the backend running?`),
        { statusCode: response.status }
      );
    }

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
  // Get all users with pagination and search
  getAllUsers: async ({ page = 1, limit = 10, search = '' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);

    return apiRequest(`/users?${params.toString()}`, {
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

// =====================================================
// PRODUCT API ENDPOINTS
// =====================================================

/**
 * Get all active products (public)
 */
export const getProducts = () => apiRequest('/products');

/**
 * Get all products including inactive (admin)
 */
export const getAllProducts = () => apiRequest('/products/all');

/**
 * Get a product by ID
 */
export const getProductById = (id) => apiRequest(`/products/${id}`);

/**
 * Create a new product (admin)
 */
export const createProduct = (productData) =>
  apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });

/**
 * Update a product (admin)
 */
export const updateProduct = (id, productData) =>
  apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });

/**
 * Delete a product (admin)
 */
export const deleteProduct = (id) =>
  apiRequest(`/products/${id}`, {
    method: 'DELETE',
  });

/**
 * Seed default products (admin)
 */
export const seedProducts = () =>
  apiRequest('/products/seed', {
    method: 'POST',
  });

// =====================================================
// JOB API ENDPOINTS
// =====================================================

export const jobAPI = {
  /**
   * Search jobs from Upwork API (non-blocking)
   * POST /api/v1/jobs/search
   */
  searchJobs: async (keywords, filters = {}) => {
    if (!keywords || (Array.isArray(keywords) && keywords.length === 0)) {
      return {
        success: false,
        error: { message: 'At least one keyword is required', statusCode: 400 },
      };
    }
    return apiRequest('/jobs/search', {
      method: 'POST',
      body: JSON.stringify({ keywords, filters }),
    });
  },

  /**
   * Search jobs with AI analysis and scoring
   * POST /api/v1/jobs/search-with-ai
   */
  searchJobsWithAI: async (keywords, filters = {}) => {
    if (!keywords || (Array.isArray(keywords) && keywords.length === 0)) {
      return {
        success: false,
        error: { message: 'At least one keyword is required', statusCode: 400 },
      };
    }
    return apiRequest('/jobs/search-with-ai', {
      method: 'POST',
      body: JSON.stringify({ keywords, filters }),
    });
  },

  /**
   * Get filtered and cached jobs for user
   * GET /api/v1/jobs/filtered?page=&limit=&status=
   */
  getFilteredJobs: async ({ page = 1, limit = 20, status = 'pending' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    return apiRequest(`/jobs/filtered?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Get single job details
   * GET /api/v1/jobs/:jobId
   */
  getJobDetail: async (jobId) => {
    if (!jobId) {
      return {
        success: false,
        error: { message: 'Job ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/jobs/${jobId}`, {
      method: 'GET',
    });
  },

  /**
   * Mark job as matched
   * PUT /api/v1/jobs/:jobId/match
   */
  markJobAsMatched: async (jobId) => {
    if (!jobId) {
      return {
        success: false,
        error: { message: 'Job ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/jobs/${jobId}/match`, {
      method: 'PUT',
    });
  },

  /**
   * Mark job as rejected with feedback
   * PUT /api/v1/jobs/:jobId/reject
   */
  markJobAsRejected: async (jobId, reason = '') => {
    if (!jobId) {
      return {
        success: false,
        error: { message: 'Job ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/jobs/${jobId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },
};

// =====================================================
// PROPOSAL API ENDPOINTS
// =====================================================

export const proposalAPI = {
  /**
   * Generate proposal for a job (non-blocking)
   * POST /api/v1/proposals/job/:jobId/generate
   */
  generateProposal: async (jobId, aiService = 'openai') => {
    if (!jobId) {
      return {
        success: false,
        error: { message: 'Job ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/job/${jobId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ aiService }),
    });
  },

  /**
   * Get single proposal details
   * GET /api/v1/proposals/:proposalId
   */
  getProposal: async (proposalId) => {
    if (!proposalId) {
      return {
        success: false,
        error: { message: 'Proposal ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/${proposalId}`, {
      method: 'GET',
    });
  },

  /**
   * Get all proposals for user with pagination
   * GET /api/v1/proposals?page=&limit=&status=&sortBy=
   */
  getUserProposals: async ({ page = 1, limit = 10, status = '', sortBy = '-createdAt' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    params.append('sortBy', sortBy);
    return apiRequest(`/proposals?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Get proposal statistics
   * GET /api/v1/proposals/stats/summary
   */
  getProposalStats: async () => {
    return apiRequest('/proposals/stats/summary', {
      method: 'GET',
    });
  },

  /**
   * Get top performing templates by acceptance rate
   * GET /api/v1/proposals/stats/top-templates
   */
  getTopTemplates: async () => {
    return apiRequest('/proposals/stats/top-templates', {
      method: 'GET',
    });
  },

  /**
   * Get job category performance
   * GET /api/v1/proposals/stats/category-performance
   */
  getJobCategoryPerformance: async () => {
    return apiRequest('/proposals/stats/category-performance', {
      method: 'GET',
    });
  },

  /**
   * Send proposal to Upwork
   * POST /api/v1/proposals/:proposalId/send
   */
  sendProposal: async (proposalId, { bidAmount, estimatedDuration, deliveryDate } = {}) => {
    if (!proposalId) {
      return {
        success: false,
        error: { message: 'Proposal ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/${proposalId}/send`, {
      method: 'POST',
      body: JSON.stringify({ bidAmount, estimatedDuration, deliveryDate }),
    });
  },

  /**
   * Update proposal status
   * PATCH /api/v1/proposals/:proposalId/status
   */
  updateProposalStatus: async (proposalId, status, notes = '') => {
    if (!proposalId || !status) {
      return {
        success: false,
        error: { message: 'Proposal ID and status are required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/${proposalId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  /**
   * Upgrade proposal with case study
   * POST /api/v1/proposals/:proposalId/upgrade
   */
  upgradeProposal: async (proposalId, caseStudy) => {
    if (!proposalId || !caseStudy) {
      return {
        success: false,
        error: { message: 'Proposal ID and case study are required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/${proposalId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ caseStudy }),
    });
  },

  /**
   * Copy proposal content
   * POST /api/v1/proposals/:proposalId/copy
   */
  copyProposal: async (proposalId) => {
    if (!proposalId) {
      return {
        success: false,
        error: { message: 'Proposal ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/${proposalId}/copy`, {
      method: 'POST',
    });
  },

  /**
   * Rate proposal quality
   * POST /api/v1/proposals/:proposalId/rate
   */
  rateProposal: async (proposalId, rating, feedback = '') => {
    if (!proposalId || !rating) {
      return {
        success: false,
        error: { message: 'Proposal ID and rating are required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/${proposalId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
  },

  /**
   * Delete proposal
   * DELETE /api/v1/proposals/:proposalId
   */
  deleteProposal: async (proposalId) => {
    if (!proposalId) {
      return {
        success: false,
        error: { message: 'Proposal ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/${proposalId}`, {
      method: 'DELETE',
    });
  },
};

// =====================================================
// COMPARISON API ENDPOINTS
// =====================================================

export const comparisonAPI = {
  /** Get active comparisons (public) */
  getComparisons: () => apiRequest('/comparisons'),

  /** Get all comparisons including inactive (admin) */
  getAllComparisons: () => apiRequest('/comparisons/all'),

  /** Create a comparison row (admin) */
  createComparison: (data) =>
    apiRequest('/comparisons', { method: 'POST', body: JSON.stringify(data) }),

  /** Update a comparison row (admin) */
  updateComparison: (id, data) =>
    apiRequest(`/comparisons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  /** Delete a comparison row (admin) */
  deleteComparison: (id) =>
    apiRequest(`/comparisons/${id}`, { method: 'DELETE' }),

  /** Seed default comparisons (admin) */
  seedComparisons: () =>
    apiRequest('/comparisons/seed', { method: 'POST' }),
};

// =====================================================
// REVIEW VIDEO API ENDPOINTS
// =====================================================

export const reviewVideoAPI = {
  /** Get the latest active review video (public) */
  getLatest: () => apiRequest('/review-video/latest'),

  /** Upload a new review video (admin) */
  upload: (data) =>
    apiRequest('/review-video/upload', { method: 'POST', body: JSON.stringify(data) }),

  /** Get all review videos (admin) */
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/review-video/all${query ? `?${query}` : ''}`);
  },

  /** Update a review video (admin) */
  update: (id, data) =>
    apiRequest(`/review-video/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  /** Set a video as active (admin) */
  setActive: (id) =>
    apiRequest(`/review-video/${id}/set-active`, { method: 'PATCH' }),

  /** Delete a review video (admin) */
  delete: (id) =>
    apiRequest(`/review-video/${id}`, { method: 'DELETE' }),
};

// =====================================================
// PAYMENT API ENDPOINTS
// =====================================================

export const paymentAPI = {
  /** Create a Stripe checkout session */
  createCheckoutSession: (plan, frequency = 'monthly') =>
    apiRequest('/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan, frequency }),
    }),

  /** Verify a checkout session (after payment) */
  verifySession: (sessionId) =>
    apiRequest(`/payments/verify-session/${sessionId}`),

  /** Get current user's payment history */
  getMyPayments: ({ page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    return apiRequest(`/payments/my-payments?${params.toString()}`);
  },

  /** Get revenue stats (admin) */
  getRevenueStats: ({ subPage = 1, subLimit = 2, payPage = 1, payLimit = 2 } = {}) => {
    const params = new URLSearchParams();
    params.append('subPage', subPage);
    params.append('subLimit', subLimit);
    params.append('payPage', payPage);
    params.append('payLimit', payLimit);
    return apiRequest(`/payments/revenue-stats?${params.toString()}`);
  },

  /** Get current user's coin balance */
  getCoinBalance: () =>
    apiRequest('/payments/coin-balance'),
};
