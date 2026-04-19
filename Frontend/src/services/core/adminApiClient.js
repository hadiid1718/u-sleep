export const ADMIN_API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const ADMIN_TOKEN_KEY = 'adminToken';

export const setAdminToken = token => {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
};

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

export const clearAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const adminApiRequest = async (endpoint, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = getAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${ADMIN_API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw Object.assign(
        new Error(
          `Server returned non-JSON response (${response.status}). Is the backend running?`
        ),
        { statusCode: response.status }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        `Error ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      error.response = data;
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Admin API Error:', error);

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
