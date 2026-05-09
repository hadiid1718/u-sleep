import { apiRequest } from './core/apiClient';

// ==========================================
// TERMS AND CONDITIONS SERVICES
// ==========================================

/**
 * Get active terms and conditions
 */
export const fetchActiveTerms = async () => {
  try {
    const response = await apiRequest('/suspension/terms/active', { method: 'GET' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get terms by version
 */
export const fetchTermsByVersion = async (version) => {
  try {
    const response = await apiRequest(`/suspension/terms/version/${version}`, { method: 'GET' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Accept terms and conditions
 */
export const acceptTerms = async (version) => {
  try {
    const response = await apiRequest('/suspension/terms/accept', { method: 'POST', body: JSON.stringify({ version }) });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Check if user has accepted latest terms
 */
export const checkTermsAcceptance = async () => {
  try {
    const response = await apiRequest('/suspension/terms/check', { method: 'GET' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ==========================================
// SUSPENSION APPEAL SERVICES
// ==========================================

/**
 * Submit a suspension appeal
 */
export const submitSuspensionAppeal = async (appealData) => {
  try {
    const response = await apiRequest('/suspension/appeal/submit', { method: 'POST', body: JSON.stringify(appealData) });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get user's appeals
 */
export const fetchUserAppeals = async () => {
  try {
    const response = await apiRequest('/suspension/appeals/my', { method: 'GET' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get specific appeal details
 */
export const fetchAppealDetails = async (appealId) => {
  try {
    const response = await apiRequest(`/suspension/appeal/${appealId}`, { method: 'GET' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Add reply to appeal
 */
export const addAppealReply = async (appealId, message) => {
  try {
    const response = await apiRequest(`/suspension/appeal/${appealId}/reply`, { method: 'POST', body: JSON.stringify({ message }) });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ==========================================
// ADMIN SERVICES
// ==========================================

/**
 * Get all appeals (admin)
 */
export const fetchAllAppeals = async (status = '', page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('limit', String(limit));
    const response = await apiRequest(`/suspension/admin/appeals?${params.toString()}`, { method: 'GET' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Review and respond to appeal (admin)
 */
export const reviewAppeal = async (appealId, reviewData) => {
  try {
    const response = await apiRequest(`/suspension/admin/appeal/${appealId}/review`, { method: 'POST', body: JSON.stringify(reviewData) });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Create or update terms (admin)
 */
export const createUpdateTerms = async (termsData) => {
  try {
    const response = await apiRequest('/suspension/admin/terms', { method: 'POST', body: JSON.stringify(termsData) });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get all terms versions (admin)
 */
export const fetchAllTermsVersions = async () => {
  try {
    const response = await apiRequest('/suspension/admin/terms/versions', { method: 'GET' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Add violation rule (admin)
 */
export const addViolationRule = async (version, ruleData) => {
  try {
    const response = await apiRequest(`/suspension/admin/terms/${version}/rule`, { method: 'POST', body: JSON.stringify(ruleData) });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
