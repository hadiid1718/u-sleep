import Job from '../models/job.model.js';
import {
  JOB_CACHE_TTL,
  JOB_CACHE_ENABLED,
  FREELANCER_BASE_URL,
  FREELANCER_OAUTH_ACCESS_TOKEN,
} from '../config/env.js';

const DEFAULT_BASE_URL = 'https://www.freelancer.com';
const DEFAULT_SEARCH_PATH = '/api/projects/0.1/projects/active/';

class FreelancerService {
  constructor() {
    this.cacheTTL = parseInt(JOB_CACHE_TTL, 10) || 3600;
    this.cacheEnabled = JOB_CACHE_ENABLED === 'true';
    this.baseUrl = (FREELANCER_BASE_URL || DEFAULT_BASE_URL).trim();
    this.searchPath =
      process.env.FREELANCER_PROJECTS_SEARCH_PATH || DEFAULT_SEARCH_PATH;
    this.requestTimeoutMs =
      Number(process.env.FREELANCER_API_TIMEOUT_MS) || 20000;
  }

  isDatabaseAvailable() {
    return Job.db.readyState === 1;
  }

  normalizeText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeKeywords(keywords) {
    const values = Array.isArray(keywords) ? keywords : [keywords];

    return values
      .map(keyword => this.normalizeText(keyword).toLowerCase())
      .filter(Boolean);
  }

  normalizeKeyword(value) {
    const normalized = this.normalizeText(value).toLowerCase();
    if (!normalized) return '';
    return normalized.replace(/[^a-z0-9]+/g, ' ').trim();
  }

  stripSpaces(value) {
    return String(value || '').replace(/\s+/g, '');
  }

  jobMatchesKeywords(job, keywords) {
    if (!Array.isArray(keywords) || keywords.length === 0) return true;

    const rawHaystack = `${job?.title || ''} ${job?.description || ''} ${(job?.skills || []).join(' ')}`
      .toLowerCase()
      .trim();
    const normalizedHaystack = this.normalizeKeyword(rawHaystack);
    const compactHaystack = this.stripSpaces(rawHaystack);

    return keywords.some(keyword => {
      const rawKeyword = String(keyword || '').toLowerCase().trim();
      if (!rawKeyword) return false;

      const normalizedKeyword = this.normalizeKeyword(rawKeyword);
      const compactKeyword = this.stripSpaces(rawKeyword);

      return (
        rawHaystack.includes(rawKeyword) ||
        (normalizedKeyword && normalizedHaystack.includes(normalizedKeyword)) ||
        (compactKeyword && compactHaystack.includes(compactKeyword))
      );
    });
  }

  applyKeywordFilter(jobs, keywords) {
    const normalizedKeywords = this.normalizeKeywords(keywords);
    if (normalizedKeywords.length === 0) return jobs;

    return jobs.filter(job => this.jobMatchesKeywords(job, normalizedKeywords));
  }

  parseNumeric(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    const normalized = String(value).replace(/,/g, '');
    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
  }

  parseHireRate(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value > 1 ? value : value * 100;
    }

    const normalized = String(value).toLowerCase().trim();
    const numeric = this.parseNumeric(normalized);
    if (numeric === null) return null;

    if (normalized.includes('%')) return numeric;
    return numeric > 1 ? numeric : numeric * 100;
  }

  isLikelyNonEnglish(text) {
    const value = this.normalizeText(text).toLowerCase();
    if (!value) return false;

    const hasNonLatin = Array.from(value).some(
      char => (char.codePointAt(0) || 0) > 127
    );
    const englishHints =
      /\b(the|and|for|with|you|your|job|project|need|looking|required|experience|developer|design|build)\b/.test(
        value
      );

    if (hasNonLatin && !englishHints) return true;
    return false;
  }

  extractNumericThreshold(criteria, matchers = []) {
    if (!criteria) return null;
    if (!matchers.some(matcher => criteria.includes(matcher))) return null;

    const numeric = this.parseNumeric(criteria);
    return Number.isFinite(numeric) ? numeric : null;
  }

  normalizeRole(role) {
    if (!role) return null;
    const normalized = this.normalizeText(role).toLowerCase();

    if (normalized.includes('agency')) return 'agency';
    if (normalized.includes('freelancer')) return 'freelancer';

    return normalized;
  }

  createSearchError(code, message, diagnostics, statusCode = 502) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    error.diagnostics = diagnostics;
    return error;
  }

  buildSearchSignature(preferences, filters = {}) {
    return JSON.stringify({
      platform: 'freelancer',
      keywords: this.normalizeKeywords(preferences?.keywords || []),
      filters: {
        rateType: filters.rateType || preferences?.rateType || null,
        minBudget: filters.minBudget ?? null,
        maxBudget: filters.maxBudget ?? null,
        minRate: filters.minRate ?? null,
        maxRate: filters.maxRate ?? null,
      },
      preferences: {
        selectedRole: this.normalizeRole(preferences?.selectedRole),
        freelancerProfileUrl: preferences?.freelancerProfileUrl || null,
      },
    });
  }

  buildSearchUrl(
    preferences,
    filters = {},
    searchPath = this.searchPath,
    relaxed = false
  ) {
    const params = new URLSearchParams();
    const keywords = this.normalizeKeywords(preferences?.keywords || []);
    const rateType = relaxed
      ? null
      : filters.rateType || preferences?.rateType || null;

    if (keywords.length > 0) {
      params.set('query', keywords.join(' '));
    }

    if (rateType === 'hourly') {
      params.set('project_types[]', 'hourly');
    }

    if (rateType === 'fixed') {
      params.set('project_types[]', 'fixed');
    }

    if (!relaxed && filters.minRate !== undefined && filters.minRate !== null) {
      params.set('min_avg_hourly_rate', String(filters.minRate));
    }

    if (!relaxed && filters.maxRate !== undefined && filters.maxRate !== null) {
      params.set('max_avg_hourly_rate', String(filters.maxRate));
    }

    if (
      !relaxed &&
      filters.minBudget !== undefined &&
      filters.minBudget !== null
    ) {
      params.set('min_avg_price', String(filters.minBudget));
    }

    if (
      !relaxed &&
      filters.maxBudget !== undefined &&
      filters.maxBudget !== null
    ) {
      params.set('max_avg_price', String(filters.maxBudget));
    }

    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 30;
    params.set('limit', String(limit));
    params.set('offset', String(filters.offset || 0));

    params.set('full_description', 'true');
    params.set('user_details', 'true');
    params.set('user_reputation', 'true');

    return `${this.baseUrl}${searchPath}?${params.toString()}`;
  }

  buildAuthHeaders(oauthToken) {
    const token = oauthToken || FREELANCER_OAUTH_ACCESS_TOKEN;
    const headers = {
      Accept: 'application/json',
    };

    if (token) {
      headers['Freelancer-OAuth-V1'] = token;
    }

    return headers;
  }

  assertCredentials(diagnostics, oauthToken) {
    if (!oauthToken && !FREELANCER_OAUTH_ACCESS_TOKEN) {
      throw this.createSearchError(
        'FREELANCER_AUTH_MISSING',
        'Freelancer OAuth token is missing. Connect your Freelancer account or set FREELANCER_OAUTH_ACCESS_TOKEN.',
        diagnostics,
        500
      );
    }
  }

  parsePostedDate(value) {
    if (!value) return new Date();
    const parsed = new Date(value * 1000 || value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  toInternalJob(rawJob, usersMap = {}, idx = 0) {
    const ownerId = rawJob?.owner_id || rawJob?.ownerId;
    const owner = usersMap?.[String(ownerId)] || {};
    const projectId =
      rawJob?.id || rawJob?.project_id || `${Date.now()}-${idx}`;

    const minPrice = rawJob?.budget?.minimum ?? rawJob?.minbudget ?? null;
    const maxPrice = rawJob?.budget?.maximum ?? rawJob?.maxbudget ?? null;
    const minHourly =
      rawJob?.hourly_rate?.minimum ?? rawJob?.hourly_min ?? null;
    const maxHourly =
      rawJob?.hourly_rate?.maximum ?? rawJob?.hourly_max ?? null;

    const hasHourly = minHourly !== null || maxHourly !== null;
    const budgetType = hasHourly ? 'hourly' : 'fixed';

    const projectUrl = rawJob?.seo_url
      ? `${this.baseUrl}/projects/${rawJob.seo_url}`
      : `${this.baseUrl}/projects/${projectId}`;

    return {
      upworkJobId: `freelancer-${projectId}`,
      upworkUrl: projectUrl,
      source: 'freelancer_api',
      sourceJobId: String(projectId),
      title: this.normalizeText(rawJob?.title) || 'Untitled Project',
      description: this.normalizeText(
        rawJob?.description || rawJob?.preview_description
      ),
      shortDescription: this.normalizeText(
        rawJob?.description || rawJob?.preview_description
      ).substring(0, 200),
      category: rawJob?.type || rawJob?.project_type || null,
      skills: Array.isArray(rawJob?.jobs)
        ? rawJob.jobs
          .map(j => this.normalizeText(j?.name || j?.seo_url || j))
          .filter(Boolean)
        : [],
      proposalsCount: Number(
        rawJob?.bid_stats?.bid_count || rawJob?.bid_count || 0
      ),
      duration: rawJob?.time_submitted ? 'Recently posted' : null,
      workloadHoursPerWeek: null,
      postedDate: this.parsePostedDate(rawJob?.time_submitted),
      budgetType,
      budget: {
        amount:
          budgetType === 'fixed' ? Number(minPrice || maxPrice || 0) : null,
        currency: rawJob?.currency?.code || 'USD',
      },
      hourlyRate: hasHourly
        ? {
          min: Number(minHourly || maxHourly || 0),
          max: Number(maxHourly || minHourly || 0),
          currency: rawJob?.currency?.code || 'USD',
        }
        : null,
      clientInfo: {
        name: owner?.username || owner?.display_name || null,
        rating: owner?.reputation?.entire_history?.overall || null,
        totalReviews: owner?.reputation?.entire_history?.reviews || null,
        totalSpent: owner?.employer_reputation?.entire_history?.all || null,
        jobsPosted:
          owner?.employer_reputation?.entire_history?.projects_posted || null,
        paymentVerified: Boolean(owner?.status?.deposit_verified),
        hireRate: owner?.employer_reputation?.entire_history?.hire_rate || null,
        country: owner?.location?.country?.name || owner?.country?.name || null,
        totalHires: owner?.employer_reputation?.entire_history?.hires || null,
      },
      isCached: true,
      cacheExpiry: new Date(Date.now() + this.cacheTTL * 1000),
    };
  }

  extractJobsFromResponse(payload) {
    return payload?.result?.projects || payload?.projects || [];
  }

  extractUsersMapFromResponse(payload) {
    return payload?.result?.users || payload?.users || {};
  }

  async fetchFreelancerJobs(
    preferences,
    filters,
    diagnostics,
    oauthToken,
    options = {}
  ) {
    const {
      searchPath = this.searchPath,
      relaxed = false,
      label = 'primary',
    } = options;
    const url = this.buildSearchUrl(preferences, filters, searchPath, relaxed);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    const requestTrace = {
      url,
      method: 'GET',
      label,
    };

    if (label === 'primary') {
      diagnostics.request = requestTrace;
    } else {
      diagnostics.retryRequests = diagnostics.retryRequests || [];
      diagnostics.retryRequests.push(requestTrace);
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildAuthHeaders(oauthToken),
        signal: controller.signal,
      });

      requestTrace.status = response.status;
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload?.message ||
          payload?.error ||
          `Freelancer API request failed with status ${response.status}.`;

        throw this.createSearchError(
          'FREELANCER_API_ERROR',
          message,
          diagnostics,
          response.status
        );
      }

      return payload;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getCachedJobs(preferences, filters = {}) {
    try {
      if (!this.isDatabaseAvailable()) {
        return [];
      }

      const now = new Date();
      return await Job.find({
        'searchMetadata.signature': this.buildSearchSignature(
          preferences,
          filters
        ),
        cacheExpiry: { $gt: now },
        isCached: true,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    } catch (error) {
      console.error('Error fetching cached freelancer jobs:', error);
      return [];
    }
  }

  async cacheJobs(jobs, preferences, filters = {}) {
    try {
      if (!this.isDatabaseAvailable()) {
        return;
      }

      const normalizedKeywords = this.normalizeKeywords(
        preferences?.keywords || []
      );
      const signature = this.buildSearchSignature(preferences, filters);

      const operations = jobs.map(job => ({
        updateOne: {
          filter: { upworkJobId: job.upworkJobId },
          update: {
            $set: {
              ...job,
              searchMetadata: {
                keywords: normalizedKeywords,
                signature,
                source: 'freelancer_api',
              },
            },
          },
          upsert: true,
        },
      }));

      if (operations.length > 0) {
        await Job.bulkWrite(operations);
      }
    } catch (error) {
      console.error('Error caching freelancer jobs:', error);
    }
  }

  applyBadJobFilters(jobs, badCriteria) {
    if (!badCriteria || badCriteria.length === 0) return jobs;

    return jobs.filter(job => {
      for (const criteria of badCriteria) {
        if (this.jobMatchesBadCriteria(job, criteria)) {
          return false;
        }
      }
      return true;
    });
  }

  jobMatchesBadCriteria(job, criteria) {
    const lowerCriteria = String(criteria || '').toLowerCase();
    const titleAndDescription = `${job?.title || ''} ${job?.description || ''}`;
    const text = titleAndDescription.toLowerCase();
    const rating = this.parseNumeric(job?.clientInfo?.rating) ?? 0;
    const totalSpent = this.parseNumeric(job?.clientInfo?.totalSpent) ?? 0;
    const hireRate = this.parseHireRate(job?.clientInfo?.hireRate);
    const descriptionLength = String(job?.description || '').trim().length;

    if (lowerCriteria.includes('looking for employee')) {
      if (
        /\b(employee|full[ -]?time|permanent|monthly salary|salary|long[ -]?term)\b/.test(
          text
        )
      ) {
        return true;
      }
    }

    if (lowerCriteria.includes('quick task')) {
      if (
        /\b(quick task|small task|tiny task|few hours|one[- ]?time task|simple fix)\b/.test(
          text
        )
      ) {
        return true;
      }
    }

    if (lowerCriteria.includes('tutoring')) {
      if (
        /\b(tutor|tutoring|lesson|teach|teaching|coach|mentoring)\b/.test(text)
      ) {
        return true;
      }
    }

    if (lowerCriteria.includes('urgent task')) {
      if (
        /\b(urgent|asap|immediately|right away|today|within hours)\b/.test(text)
      ) {
        return true;
      }
    }

    if (lowerCriteria.includes('non english job')) {
      if (this.isLikelyNonEnglish(titleAndDescription)) {
        return true;
      }
    }

    if (lowerCriteria.includes('startups')) {
      if (/\b(startup|start-up|founder|early[- ]?stage|mvp)\b/.test(text)) {
        return true;
      }
    }

    if (lowerCriteria.includes('not well described')) {
      if (descriptionLength < 120) {
        return true;
      }
    }

    if (lowerCriteria.includes('too many bids already')) {
      if ((job?.proposalsCount || 0) > 20) {
        return true;
      }
    }

    const ratingThreshold = this.extractNumericThreshold(lowerCriteria, [
      'rating less than',
      'rating below',
      'rating under',
    ]);

    if (ratingThreshold !== null && rating < ratingThreshold) {
      return true;
    }

    const spentThreshold = this.extractNumericThreshold(lowerCriteria, [
      'total spent less than',
      'spent less than',
      'spent under',
      'spent below',
    ]);

    if (spentThreshold !== null && totalSpent < spentThreshold) {
      return true;
    }

    if (lowerCriteria.includes('low hire rate')) {
      if (hireRate !== null && hireRate < 50) {
        return true;
      }
    }

    if (
      lowerCriteria.includes('low budget') &&
      (job.budget?.amount || 0) < 500
    ) {
      return true;
    }

    if (lowerCriteria.includes('low rating') && rating < 4.5) {
      return true;
    }

    if (
      lowerCriteria.includes('unclear description') &&
      (!job.description || descriptionLength < 50)
    ) {
      return true;
    }

    if (
      lowerCriteria.includes('too many proposals') &&
      job.proposalsCount > 50
    ) {
      return true;
    }

    return false;
  }

  applyRateMatching(jobs, userRate, rateType) {
    if (!userRate || !rateType) return jobs;

    const normalizedRate = Number(userRate);
    if (!Number.isFinite(normalizedRate)) return jobs;

    return jobs.filter(job => {
      if (
        rateType === 'hourly' &&
        job.budgetType === 'hourly' &&
        job.hourlyRate
      ) {
        const hourlyCeiling = Number(
          job.hourlyRate.max ?? job.hourlyRate.min
        );

        if (Number.isFinite(hourlyCeiling)) {
          return hourlyCeiling >= normalizedRate;
        }

        return true;
      }

      if (
        rateType === 'fixed' &&
        job.budgetType === 'fixed' &&
        job.budget?.amount
      ) {
        return normalizedRate <= job.budget.amount;
      }

      return true;
    });
  }

  async searchJobsDetailed(preferences, filters = {}, oauthToken = null) {
    const diagnostics = {
      cache: {
        enabled: this.cacheEnabled,
        databaseAvailable: this.isDatabaseAvailable(),
        hit: false,
      },
      source: 'freelancer_api',
    };

    let cachedJobs = [];

    try {
      this.assertCredentials(diagnostics, oauthToken);

      if (this.cacheEnabled) {
        cachedJobs = await this.getCachedJobs(preferences, filters);
        if (cachedJobs.length > 0) {
          diagnostics.cache.hit = true;
          diagnostics.source = 'cache';
          return {
            jobs: cachedJobs,
            diagnostics,
          };
        }
      }

      const payload = await this.fetchFreelancerJobs(
        preferences,
        filters,
        diagnostics,
        oauthToken,
        { label: 'primary' }
      );
      let projects = this.extractJobsFromResponse(payload);
      let usersMap = this.extractUsersMapFromResponse(payload);

      if (!Array.isArray(projects) || projects.length === 0) {
        // Retry with a relaxed query and broader endpoint when strict active search is empty.
        const fallbackPayload = await this.fetchFreelancerJobs(
          preferences,
          {},
          diagnostics,
          oauthToken,
          {
            searchPath: '/api/projects/0.1/projects/all/',
            relaxed: true,
            label: 'fallback_all_relaxed',
          }
        );

        const fallbackProjects = this.extractJobsFromResponse(fallbackPayload);
        const fallbackUsers = this.extractUsersMapFromResponse(fallbackPayload);

        if (Array.isArray(fallbackProjects) && fallbackProjects.length > 0) {
          projects = fallbackProjects;
          usersMap = fallbackUsers;
          diagnostics.source = 'freelancer_api_fallback';
          diagnostics.fallbackReason = 'primary_query_empty';
        }
      }

      if (!Array.isArray(projects) || projects.length === 0) {
        diagnostics.jobsFound = 0;
        diagnostics.empty = true;
        diagnostics.source = diagnostics.source || 'freelancer_api';
        return {
          jobs: [],
          diagnostics,
        };
      }

      const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 30;
      const jobs = projects
        .filter(item => item)
        .slice(0, limit)
        .map((item, idx) => this.toInternalJob(item, usersMap, idx));

      diagnostics.jobsFound = jobs.length;
      diagnostics.source = 'live';

      if (this.cacheEnabled && jobs.length > 0) {
        this.cacheJobs(jobs, preferences, filters).catch(err => {
          console.error('Error caching freelancer jobs:', err);
        });
      }

      return {
        jobs,
        diagnostics,
      };
    } catch (error) {
      if (this.cacheEnabled && cachedJobs.length > 0) {
        return {
          jobs: cachedJobs,
          diagnostics: {
            ...diagnostics,
            cache: {
              ...diagnostics.cache,
              hit: true,
            },
            fallback: 'cache',
            errorCode: error.code || 'FREELANCER_RUNTIME_ERROR',
            errorMessage: error.message,
            source: 'cache',
          },
        };
      }

      if (error.diagnostics) {
        throw error;
      }

      throw this.createSearchError(
        'FREELANCER_RUNTIME_ERROR',
        error.message || 'Unexpected Freelancer API failure.',
        diagnostics,
        500
      );
    }
  }
}

export default new FreelancerService();
