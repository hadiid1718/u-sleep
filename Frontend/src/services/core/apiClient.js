export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiRequest = async (endpoint, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    console.error('API Error:', error);

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

export const getErrorMessage = error => {
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

export const handleApiError = apiResponse => {
  if (!apiResponse.success) {
    return getErrorMessage(apiResponse);
  }
  return null;
};

export const setToken = token => {
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