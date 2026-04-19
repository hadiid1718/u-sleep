import { apiRequest } from './core/apiClient';

const normalizeJobKeywords = payloadOrKeywords => {
  if (Array.isArray(payloadOrKeywords)) return payloadOrKeywords;
  if (typeof payloadOrKeywords === 'string' && payloadOrKeywords.trim()) {
    return [payloadOrKeywords];
  }
  if (payloadOrKeywords && typeof payloadOrKeywords === 'object') {
    const value = payloadOrKeywords.keywords;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value];
  }
  return [];
};

const buildJobSearchBody = (payloadOrKeywords, filters = {}) => {
  const keywords = normalizeJobKeywords(payloadOrKeywords);
  if (
    payloadOrKeywords &&
    typeof payloadOrKeywords === 'object' &&
    !Array.isArray(payloadOrKeywords)
  ) {
    return {
      keywords,
      body: {
        ...payloadOrKeywords,
        keywords,
        filters,
      },
    };
  }

  return {
    keywords,
    body: {
      keywords,
      filters,
    },
  };
};

export const jobAPI = {
  searchJobs: async (payloadOrKeywords, filters = {}) => {
    const { keywords, body } = buildJobSearchBody(payloadOrKeywords, filters);
    if (!keywords || keywords.length === 0) {
      return {
        success: false,
        error: { message: 'At least one keyword is required', statusCode: 400 },
      };
    }
    return apiRequest('/jobs/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  searchJobsWithAI: async (payloadOrKeywords, filters = {}) => {
    const { keywords, body } = buildJobSearchBody(payloadOrKeywords, filters);
    if (!keywords || keywords.length === 0) {
      return {
        success: false,
        error: { message: 'At least one keyword is required', statusCode: 400 },
      };
    }
    return apiRequest('/jobs/search-with-ai', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getSearchDiagnostics: async (payloadOrKeywords, filters = {}) => {
    const { keywords, body } = buildJobSearchBody(payloadOrKeywords, filters);
    if (!keywords || keywords.length === 0) {
      return {
        success: false,
        error: { message: 'At least one keyword is required', statusCode: 400 },
      };
    }
    return apiRequest('/jobs/diagnostics', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getFilteredJobs: async ({ page = 1, limit = 20, status = 'all' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    return apiRequest(`/jobs/filtered?${params.toString()}`, {
      method: 'GET',
    });
  },

  getJobDetail: async jobId => {
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

  translateJobDescription: async (
    jobId,
    targetLanguage,
    { aiService = 'gemini' } = {}
  ) => {
    if (!jobId) {
      return {
        success: false,
        error: { message: 'Job ID is required', statusCode: 400 },
      };
    }

    if (!targetLanguage || !String(targetLanguage).trim()) {
      return {
        success: false,
        error: { message: 'targetLanguage is required', statusCode: 400 },
      };
    }

    return apiRequest(`/jobs/${jobId}/translate-description`, {
      method: 'POST',
      body: JSON.stringify({ targetLanguage, aiService }),
    });
  },

  markJobAsMatched: async jobId => {
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

  getFreelancerWorkflow: async ({
    keywords = [],
    selectedRole = '',
    rateType = '',
  } = {}) => {
    const params = new URLSearchParams();
    const normalizedKeywords = Array.isArray(keywords)
      ? keywords.filter(Boolean)
      : [];

    if (normalizedKeywords.length > 0) {
      params.append('keywords', normalizedKeywords.join(','));
    }
    if (selectedRole) params.append('selectedRole', selectedRole);
    if (rateType) params.append('rateType', rateType);

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/jobs/freelancer/workflow${suffix}`, {
      method: 'GET',
    });
  },
};

export default jobAPI;
