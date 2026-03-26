import Job from '../models/job.model.js';
import {
  JOB_CACHE_TTL,
  JOB_CACHE_ENABLED,
  UPWORK_API_KEY,
  UPWORK_API_SECRET,
  UPWORK_ACCESS_TOKEN,
} from '../config/env.js';

const DEFAULT_API_BASE_URL = 'https://www.upwork.com/api';
const DEFAULT_SEARCH_PATH = '/profiles/v2/search/jobs';

class UpworkService {
  constructor() {
    this.cacheTTL = parseInt(JOB_CACHE_TTL, 10) || 3600;
    this.cacheEnabled = JOB_CACHE_ENABLED === 'true';
    this.apiBaseUrl =
      process.env.UPWORK_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
    this.jobsSearchPath =
      process.env.UPWORK_JOBS_SEARCH_PATH?.trim() || DEFAULT_SEARCH_PATH;
    this.requestTimeoutMs =
      Number(process.env.UPWORK_API_TIMEOUT_MS) || 20000;
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
      keywords: this.normalizeKeywords(preferences?.keywords || []),
      filters: {
        rateType: filters.rateType || preferences?.rateType || null,
        paymentVerified: Boolean(filters.paymentVerified),
        minBudget: filters.minBudget ?? null,
        maxBudget: filters.maxBudget ?? null,
        minRate: filters.minRate ?? null,
        maxRate: filters.maxRate ?? null,
      },
      preferences: {
        jobHourly: preferences?.jobHourly ?? null,
        projectFixedRate: preferences?.projectFixedRate ?? null,
        selectedRole: this.normalizeRole(preferences?.selectedRole),
        upworkProfileUrl: preferences?.upworkProfileUrl || null,
      },
    });
  }

  buildSearchUrl(preferences, filters = {}) {
    const params = new URLSearchParams();
    const keywords = this.normalizeKeywords(preferences?.keywords || []);
    const rateType = filters.rateType || preferences?.rateType || null;
    const selectedRole = this.normalizeRole(preferences?.selectedRole);

    if (keywords.length > 0) {
      params.set('q', keywords.join(' '));
    }

    if (rateType === 'hourly') params.set('job_type', 'hourly');
    if (rateType === 'fixed') params.set('job_type', 'fixed');

    if (filters.paymentVerified) params.set('payment_verified', '1');

    const hourlyRateRange = preferences?.hourlyRateRange || {};
    const fixedRateRange = preferences?.fixedRateRange || {};
    const minRate = filters.minRate ?? hourlyRateRange.min;
    const maxRate = filters.maxRate ?? hourlyRateRange.max;
    const minBudget = filters.minBudget ?? fixedRateRange.min;
    const maxBudget = filters.maxBudget ?? fixedRateRange.max;

    if (minRate !== undefined && minRate !== null)
      params.set('hourly_rate_min', String(minRate));
    if (maxRate !== undefined && maxRate !== null)
      params.set('hourly_rate_max', String(maxRate));
    if (minBudget !== undefined && minBudget !== null)
      params.set('budget_min', String(minBudget));
    if (maxBudget !== undefined && maxBudget !== null)
      params.set('budget_max', String(maxBudget));

    if (preferences?.jobHourly && rateType === 'hourly') {
      params.set('hourly_rate', String(preferences.jobHourly));
    }

    if (preferences?.projectFixedRate && rateType === 'fixed') {
      params.set('budget', String(preferences.projectFixedRate));
    }

    if (selectedRole) params.set('user_role', selectedRole);
    if (preferences?.upworkProfileUrl) {
      params.set('profile_url', String(preferences.upworkProfileUrl));
    }

    if (filters.limit) params.set('limit', String(filters.limit));

    return `${this.apiBaseUrl}${this.jobsSearchPath}?${params.toString()}`;
  }

  buildAuthHeaders() {
    const headers = {
      Accept: 'application/json',
    };

    if (UPWORK_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${UPWORK_ACCESS_TOKEN}`;
    }

    if (UPWORK_API_KEY) {
      headers['X-Api-Key'] = UPWORK_API_KEY;
    }

    if (UPWORK_API_SECRET) {
      headers['X-Api-Secret'] = UPWORK_API_SECRET;
    }

    return headers;
  }

  assertCredentials(diagnostics) {
    if (!UPWORK_ACCESS_TOKEN && !UPWORK_API_KEY) {
      throw this.createSearchError(
        'UPWORK_AUTH_MISSING',
        'Upwork API credentials are missing. Provide UPWORK_ACCESS_TOKEN or UPWORK_API_KEY.',
        diagnostics,
        500
      );
    }
  }

  parseCurrencyAmount(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    const cleaned = String(value).replace(/,/g, '');
    const match = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    return Number(match[1]);
  }

  parseHourlyRate(value) {
    if (!value) return null;

    if (typeof value === 'object') {
      const min = this.parseCurrencyAmount(value.min ?? value.minimum);
      const max = this.parseCurrencyAmount(value.max ?? value.maximum);

      if (min !== null || max !== null) {
        return {
          min: min ?? max,
          max: max ?? min,
          currency: value.currency || 'USD',
        };
      }
    }

    const matches = String(value)
      .replace(/,/g, '')
      .match(/(\d+(?:\.\d+)?)/g);
    if (!matches || matches.length === 0) return null;

    const min = Number(matches[0]);
    const max = matches[1] ? Number(matches[1]) : min;

    return {
      min,
      max,
      currency: 'USD',
    };
  }

  parsePostedDate(text) {
    if (!text) return new Date();

    if (text instanceof Date) return text;

    if (typeof text === 'number') {
      return new Date(text > 1e12 ? text : text * 1000);
    }

    const directDate = new Date(text);
    if (!Number.isNaN(directDate.getTime())) return directDate;

    const lower = String(text).toLowerCase();
    const now = Date.now();

    const hourMatch = lower.match(/(\d+)\s*hour/);
    if (hourMatch) return new Date(now - Number(hourMatch[1]) * 60 * 60 * 1000);

    const dayMatch = lower.match(/(\d+)\s*day/);
    if (dayMatch)
      return new Date(now - Number(dayMatch[1]) * 24 * 60 * 60 * 1000);

    const weekMatch = lower.match(/(\d+)\s*week/);
    if (weekMatch) {
      return new Date(now - Number(weekMatch[1]) * 7 * 24 * 60 * 60 * 1000);
    }

    return new Date();
  }

  normalizeSkillList(skills) {
    if (!Array.isArray(skills)) return [];

    return skills
      .map(skill => {
        if (typeof skill === 'string') return skill;
        return skill?.name || skill?.prefLabel || skill?.label || skill?.skill;
      })
      .map(skill => this.normalizeText(skill))
      .filter(Boolean);
  }

  toInternalJob(rawJob, idx) {
    const title =
      rawJob?.title ||
      rawJob?.jobTitle ||
      rawJob?.job_title ||
      rawJob?.name ||
      rawJob?.job_name;
    const description =
      rawJob?.description ||
      rawJob?.snippet ||
      rawJob?.summary ||
      rawJob?.jobDescription ||
      rawJob?.job_description;

    const href =
      rawJob?.url ||
      rawJob?.jobUrl ||
      rawJob?.job_url ||
      rawJob?.publicUrl ||
      rawJob?.public_url ||
      rawJob?.link ||
      '';

    const absoluteUrl = href.startsWith('http')
      ? href
      : href
        ? `https://www.upwork.com${href}`
        : 'https://www.upwork.com/nx/search/jobs/';

    const hourlyRate = this.parseHourlyRate(
      rawJob?.hourlyRate ||
        rawJob?.hourly_rate ||
        rawJob?.hourlyBudget ||
        rawJob?.hourly_budget
    );

    const budgetAmount = this.parseCurrencyAmount(
      rawJob?.budget ||
        rawJob?.fixedBudget ||
        rawJob?.fixed_price ||
        rawJob?.fixedPrice ||
        rawJob?.amount
    );

    const budgetType = hourlyRate ? 'hourly' : 'fixed';

    const proposalCount = this.parseCurrencyAmount(
      rawJob?.proposals ||
        rawJob?.proposalsCount ||
        rawJob?.totalProposals ||
        rawJob?.clientActivity?.proposals
    );

    const client = rawJob?.client || rawJob?.clientInfo || {};
    const paymentVerified = Boolean(
      rawJob?.paymentVerified ||
        rawJob?.clientPaymentVerified ||
        client?.paymentVerified ||
        client?.payment_verified
    );

    const upworkJobId =
      rawJob?.id ||
      rawJob?.uid ||
      rawJob?.job_id ||
      absoluteUrl.match(/~([a-zA-Z0-9]+)/)?.[1] ||
      absoluteUrl.match(/\/jobs\/[^/]*?_([a-zA-Z0-9]+)/)?.[1] ||
      `upwork-${Date.now()}-${idx}`;

    return {
      upworkJobId,
      upworkUrl: absoluteUrl,
      title: this.normalizeText(title) || 'Untitled Job',
      description: this.normalizeText(description) || 'No description available.',
      shortDescription: this.normalizeText(description || '').substring(0, 200),
      category: rawJob?.category || rawJob?.categoryName || null,
      skills: this.normalizeSkillList(rawJob?.skills || rawJob?.skillNames),
      proposalsCount: Number.isFinite(proposalCount) ? proposalCount : 0,
      duration: rawJob?.duration || rawJob?.jobDuration || null,
      workloadHoursPerWeek:
        rawJob?.workloadHoursPerWeek || rawJob?.workload || null,
      postedDate: this.parsePostedDate(
        rawJob?.postedOn ||
          rawJob?.postedDate ||
          rawJob?.createdOn ||
          rawJob?.createdAt ||
          rawJob?.created_at ||
          rawJob?.posted
      ),
      budgetType,
      budget: {
        amount: budgetType === 'fixed' ? budgetAmount : null,
        currency: rawJob?.currency || 'USD',
      },
      hourlyRate,
      clientInfo: {
        name: client?.name || rawJob?.clientName || null,
        rating: client?.rating || rawJob?.clientRating || null,
        totalReviews: client?.totalReviews || rawJob?.clientReviews || null,
        totalSpent: client?.totalSpent || rawJob?.clientSpend || null,
        jobsPosted: client?.jobsPosted || rawJob?.clientJobsPosted || null,
        paymentVerified,
        hireRate: client?.hireRate || rawJob?.clientHireRate || null,
        country:
          client?.country ||
          client?.location?.country ||
          rawJob?.clientCountry ||
          null,
        totalHires: client?.totalHires || rawJob?.clientHires || null,
      },
      isCached: true,
      cacheExpiry: new Date(Date.now() + this.cacheTTL * 1000),
    };
  }

  extractJobsFromResponse(data) {
    if (!data) return [];

    const candidates = [];
    const potentialLists = [
      data?.jobs,
      data?.data,
      data?.data?.items,
      data?.data?.results,
      data?.results,
      data?.items,
      data?.searchResults,
      data?.search?.results,
      data?.jobs?.items,
      data?.jobs?.results,
    ];

    if (Array.isArray(data)) {
      candidates.push(...data);
    }

    for (const list of potentialLists) {
      if (Array.isArray(list)) {
        candidates.push(...list);
        break;
      }
    }

    return candidates;
  }

  async fetchUpworkJobs(preferences, filters, diagnostics) {
    const url = this.buildSearchUrl(preferences, filters);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    diagnostics.request = {
      url,
      method: 'GET',
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildAuthHeaders(),
        signal: controller.signal,
      });

      diagnostics.request.status = response.status;

      const text = await response.text();
      let payload = null;

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { raw: text };
        }
      }

      if (!response.ok) {
        const message =
          payload?.message ||
          payload?.error ||
          `Upwork API request failed with status ${response.status}.`;

        throw this.createSearchError(
          'UPWORK_API_ERROR',
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
        'searchMetadata.signature': this.buildSearchSignature(preferences, filters),
        cacheExpiry: { $gt: now },
        isCached: true,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    } catch (error) {
      console.error('Error fetching cached jobs:', error);
      return [];
    }
  }

  async cacheJobs(jobs, preferences, filters = {}) {
    try {
      if (!this.isDatabaseAvailable()) {
        return;
      }

      const normalizedKeywords = this.normalizeKeywords(preferences?.keywords || []);
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
                source: 'upwork_api',
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
      console.error('Error saving jobs to cache:', error);
    }
  }

  async cleanExpiredCache() {
    try {
      if (!this.isDatabaseAvailable()) {
        return;
      }

      await Job.deleteMany({
        cacheExpiry: { $lt: new Date() },
        isCached: true,
      });
    } catch (error) {
      console.error('Error cleaning cache:', error);
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

    if (
      lowerCriteria.includes('low budget') &&
      (job.budget?.amount || 0) < 500
    ) {
      return true;
    }
    if (
      lowerCriteria.includes('no verified payment') &&
      !job.clientInfo?.paymentVerified
    ) {
      return true;
    }
    if (
      lowerCriteria.includes('low rating') &&
      (job.clientInfo?.rating || 0) < 4.5
    ) {
      return true;
    }
    if (
      lowerCriteria.includes('unclear description') &&
      (!job.description || job.description.length < 50)
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

    return jobs.filter(job => {
      if (rateType === 'hourly' && job.budgetType === 'hourly') {
        if (job.hourlyRate) {
          return (
            userRate >= (job.hourlyRate.min || 0) &&
            userRate <= (job.hourlyRate.max || Infinity)
          );
        }
      } else if (rateType === 'fixed' && job.budgetType === 'fixed') {
        if (job.budget?.amount) {
          return userRate <= job.budget.amount;
        }
      }
      return true;
    });
  }

  async searchJobsDetailed(preferences, filters = {}) {
    const diagnostics = {
      cache: {
        enabled: this.cacheEnabled,
        databaseAvailable: this.isDatabaseAvailable(),
        hit: false,
      },
      source: 'upwork_api',
    };

    let cachedJobs = [];

    try {
      this.assertCredentials(diagnostics);

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

      const payload = await this.fetchUpworkJobs(preferences, filters, diagnostics);
      const candidates = this.extractJobsFromResponse(payload);

      if (!Array.isArray(candidates) || candidates.length === 0) {
        throw this.createSearchError(
          'UPWORK_EMPTY_RESULTS',
          'Upwork API returned no job results for the given preferences.',
          diagnostics,
          404
        );
      }

      const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 50;
      const jobs = candidates
        .filter(item => item)
        .slice(0, limit)
        .map((item, idx) => this.toInternalJob(item, idx));

      diagnostics.jobsFound = jobs.length;
      diagnostics.source = 'live';

      if (this.cacheEnabled && jobs.length > 0) {
        this.cacheJobs(jobs, preferences, filters).catch(err => {
          console.error('Error caching jobs:', err);
        });
      }

      return {
        jobs,
        diagnostics,
      };
    } catch (error) {
      console.error('Upwork API error:', error);

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
            errorCode: error.code || 'UPWORK_RUNTIME_ERROR',
            errorMessage: error.message,
            source: 'cache',
          },
        };
      }

      if (error.diagnostics) {
        throw error;
      }

      throw this.createSearchError(
        'UPWORK_RUNTIME_ERROR',
        error.message || 'Unexpected Upwork API failure.',
        diagnostics,
        500
      );
    }
  }

  async searchJobs(preferences, filters = {}) {
    const { jobs } = await this.searchJobsDetailed(preferences, filters);
    return jobs;
  }

  async diagnoseSearch(preferences, filters = {}) {
    try {
      const { jobs, diagnostics } = await this.searchJobsDetailed(
        preferences,
        filters
      );
      return {
        ok: true,
        jobsFound: jobs.length,
        diagnostics,
      };
    } catch (error) {
      return {
        ok: false,
        jobsFound: 0,
        error: {
          code: error.code || 'UPWORK_RUNTIME_ERROR',
          message: error.message,
        },
        diagnostics: error.diagnostics || {
          cache: {
            enabled: this.cacheEnabled,
            databaseAvailable: this.isDatabaseAvailable(),
            hit: false,
          },
        },
      };
    }
  }
}

export default new UpworkService();
