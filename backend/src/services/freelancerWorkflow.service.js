class FreelancerWorkflowService {
  normalizeText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeKeywords(keywords) {
    if (Array.isArray(keywords)) {
      return keywords
        .map(keyword => this.normalizeText(keyword).toLowerCase())
        .filter(Boolean);
    }

    if (typeof keywords === 'string' && keywords.trim()) {
      return keywords
        .split(',')
        .map(keyword => this.normalizeText(keyword).toLowerCase())
        .filter(Boolean);
    }

    return [];
  }

  deriveBidRange(job) {
    if (!job) {
      return {
        mode: 'fixed',
        suggestedMin: null,
        suggestedMax: null,
      };
    }

    if (job.budgetType === 'hourly' && job.hourlyRate) {
      const min = Number(job.hourlyRate.min || 0);
      const max = Number(job.hourlyRate.max || min || 0);

      return {
        mode: 'hourly',
        suggestedMin: min > 0 ? min : null,
        suggestedMax: max > 0 ? max : null,
      };
    }

    const amount = Number(job.budget?.amount || 0);
    if (amount <= 0) {
      return {
        mode: 'fixed',
        suggestedMin: null,
        suggestedMax: null,
      };
    }

    return {
      mode: 'fixed',
      suggestedMin: Math.round(amount * 0.8),
      suggestedMax: Math.round(amount * 1.1),
    };
  }

  buildDiscoverySteps() {
    return [
      {
        id: 'connect-account',
        title: 'Connect Freelancer account',
        detail:
          'Authenticate account and keep bidding balance available before sending bids.',
      },
      {
        id: 'targeted-search',
        title: 'Search active projects',
        detail:
          'Use niche keywords, project type (fixed/hourly), and budget filters to narrow high-fit jobs.',
      },
      {
        id: 'shortlist',
        title: 'Shortlist by budget and timeline',
        detail:
          'Prioritize projects with realistic budget, clear scope, and manageable bid competition.',
      },
      {
        id: 'draft-bid',
        title: 'Draft bid package',
        detail:
          'Prepare bid amount, delivery estimate, and a personalized proposal matching client requirements.',
      },
      {
        id: 'submit-track',
        title: 'Submit and track status',
        detail:
          'Place bid, monitor messages/awards, and refine strategy from accepted or rejected bids.',
      },
    ];
  }

  buildProposalSteps(job) {
    const bidRange = this.deriveBidRange(job);
    const formattedRange =
      bidRange.suggestedMin !== null && bidRange.suggestedMax !== null
        ? `${bidRange.suggestedMin} - ${bidRange.suggestedMax}`
        : 'Based on your target rate';

    return [
      {
        id: 'analyze-project',
        title: 'Analyze project brief',
        detail:
          'Extract core scope, budget fit, urgency, and required skills before writing the cover letter.',
      },
      {
        id: 'generate-cover-letter',
        title: 'Generate tailored proposal',
        detail:
          'Create a concise, personalized proposal that references client needs and similar delivered work.',
      },
      {
        id: 'set-bid-and-timeline',
        title: 'Set bid amount and timeline',
        detail:
          bidRange.mode === 'hourly'
            ? `Suggested hourly bid range: ${formattedRange}.`
            : `Suggested fixed-price bid range: ${formattedRange}.`,
      },
      {
        id: 'submit-bid',
        title: 'Submit bid and monitor',
        detail:
          'Send bid, watch inbox updates, and revise positioning using employer feedback signals.',
      },
    ];
  }

  buildSearchWorkflowContext({
    preferences = {},
    filters = {},
    diagnostics = null,
    jobsFound = null,
  } = {}) {
    const keywords = this.normalizeKeywords(preferences.keywords || []);

    return {
      platform: 'freelancer',
      workflowType: 'job-discovery',
      steps: this.buildDiscoverySteps(),
      searchContext: {
        keywords,
        selectedRole: preferences.selectedRole || null,
        rateType: filters.rateType || preferences.rateType || null,
      },
      jobsFound,
      diagnostics,
    };
  }

  buildProposalWorkflowContext({ job = null, bidInput = {} } = {}) {
    const bidRange = this.deriveBidRange(job);

    return {
      platform: 'freelancer',
      workflowType: 'proposal-writing',
      steps: this.buildProposalSteps(job),
      suggestedBid: bidRange,
      draftBidInput: {
        bidAmount:
          bidInput.bidAmount !== undefined && bidInput.bidAmount !== null
            ? Number(bidInput.bidAmount)
            : null,
        estimatedDuration: bidInput.estimatedDuration || null,
        deliveryDate: bidInput.deliveryDate || null,
      },
      project: job
        ? {
          title: job.title || 'Untitled Project',
          budgetType: job.budgetType || null,
          budget: job.budget || null,
          hourlyRate: job.hourlyRate || null,
          sourceJobId: job.sourceJobId || null,
          projectUrl: job.freelancerUrl || job.upworkUrl || job.url || null,
        }
        : null,
    };
  }
}

export default new FreelancerWorkflowService();
