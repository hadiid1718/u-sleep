import { apiRequest } from './core/apiClient';

export const proposalAPI = {
  generateProposal: async (jobId, aiService = 'gemini', jobData = null) => {
    if (!jobId) {
      return {
        success: false,
        error: { message: 'Job ID is required', statusCode: 400 },
      };
    }
    return apiRequest(`/proposals/job/${jobId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ aiService, jobData }),
    });
  },

  getProposal: async proposalId => {
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

  getUserProposals: async ({
    page = 1,
    limit = 10,
    status = '',
    sortBy = '-createdAt',
  } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    params.append('sortBy', sortBy);
    return apiRequest(`/proposals?${params.toString()}`, {
      method: 'GET',
    });
  },

  getProposalStats: async () => {
    return apiRequest('/proposals/stats/summary', {
      method: 'GET',
    });
  },

  getTopTemplates: async () => {
    return apiRequest('/proposals/stats/top-templates', {
      method: 'GET',
    });
  },

  getJobCategoryPerformance: async () => {
    return apiRequest('/proposals/stats/category-performance', {
      method: 'GET',
    });
  },

  sendProposal: async (
    proposalId,
    { bidAmount, estimatedDuration, deliveryDate } = {}
  ) => {
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

  updateProposalStatus: async (proposalId, status, notes = '') => {
    if (!proposalId || !status) {
      return {
        success: false,
        error: {
          message: 'Proposal ID and status are required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/proposals/${proposalId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  upgradeProposal: async (proposalId, caseStudy) => {
    if (!proposalId || !caseStudy) {
      return {
        success: false,
        error: {
          message: 'Proposal ID and case study are required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/proposals/${proposalId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ caseStudy }),
    });
  },

  copyProposal: async proposalId => {
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

  rateProposal: async (proposalId, rating, feedback = '') => {
    if (!proposalId || !rating) {
      return {
        success: false,
        error: {
          message: 'Proposal ID and rating are required',
          statusCode: 400,
        },
      };
    }
    return apiRequest(`/proposals/${proposalId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
  },

  deleteProposal: async proposalId => {
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

export default proposalAPI;
