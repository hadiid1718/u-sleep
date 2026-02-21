import Job from '../models/job.model.js';
import {
    UPWORK_ACCESS_TOKEN,
    UPWORK_API_KEY,
    JOB_CACHE_TTL,
    JOB_CACHE_ENABLED
} from '../config/env.js';

/**
 * Upwork API Service
 * Handles all interactions with Upwork API
 * Includes caching and filtering logic for performance
 */
class UpworkService {
    constructor() {
        this.baseUrl = 'https://api.upwork.com/api';
        this.version = 'profiles/v1';
        this.accessToken = UPWORK_ACCESS_TOKEN;
        this.apiKey = UPWORK_API_KEY;
        this.cacheTTL = parseInt(JOB_CACHE_TTL) || 3600;
        this.cacheEnabled = JOB_CACHE_ENABLED === 'true';
    }

    /**
     * Transform Upwork API response to our Job format
     */
    transformUpworkJob(upworkJob) {
        return {
            upworkJobId: upworkJob.id || upworkJob.uid,
            upworkUrl: upworkJob.url || `https://www.upwork.com/jobs/${upworkJob.id}`,
            title: upworkJob.title || upworkJob.job_title,
            description: upworkJob.description || upworkJob.job_description,
            shortDescription: (upworkJob.description || '').substring(0, 200),
            category: upworkJob.category || upworkJob.job_type,
            skills: upworkJob.skills || [],
            proposalsCount: upworkJob.proposals_count || 0,
            duration: upworkJob.duration || upworkJob.project_duration,
            workloadHoursPerWeek: upworkJob.workload || null,
            postedDate: new Date(upworkJob.posted_date),
            budgetType: upworkJob.budget_type || 'fixed',
            budget: {
                amount: upworkJob.budget || upworkJob.amount,
                currency: upworkJob.currency_id || 'USD',
            },
            hourlyRate: upworkJob.hourly_rate ? {
                min: upworkJob.hourly_rate.from || upworkJob.hourly_rate_min,
                max: upworkJob.hourly_rate.to || upworkJob.hourly_rate_max,
                currency: upworkJob.currency_id || 'USD',
            } : null,
            clientInfo: {
                name: upworkJob.client?.name || upworkJob.buyer?.display_name,
                rating: upworkJob.client?.rating || upworkJob.buyer?.rating,
                totalReviews: upworkJob.client?.reviews || upworkJob.buyer?.review_count,
                totalSpent: upworkJob.client?.total_spent || upworkJob.buyer?.total_spent,
                jobsPosted: upworkJob.client?.jobs_posted || upworkJob.buyer?.jobs_posted,
                paymentVerified: upworkJob.client?.payment_verified || upworkJob.buyer?.payment_verified || false,
                hireRate: upworkJob.client?.hire_rate || upworkJob.buyer?.hire_rate,
                country: upworkJob.client?.country || upworkJob.buyer?.country,
                totalHires: upworkJob.client?.total_hires || upworkJob.buyer?.total_hires,
            },
            isCached: true,
            cacheExpiry: new Date(Date.now() + this.cacheTTL * 1000),
        };
    }

    /**
     * Fetch jobs from Upwork API with keyword search
     * Returns: Promise<Array> - Array of jobs
     */
    async searchJobs(keywords, filters = {}) {
        try {
            // Check cache first if enabled
            if (this.cacheEnabled) {
                const cachedJobs = await this.getCachedJobs(keywords);
                if (cachedJobs.length > 0) {
                    return cachedJobs;
                }
            }

            // Build Upwork API query
            const query = this.buildSearchQuery(keywords, filters);
            const url = `${this.baseUrl}/jobs/search/find.json?${query}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'User-Agent': 'JobFinderAI/1.0',
                },
            });

            if (!response.ok) {
                throw new Error(`Upwork API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const jobs = (data.jobs || []).map(job => this.transformUpworkJob(job));

            // Cache jobs asynchronously (don't wait)
            if (this.cacheEnabled && jobs.length > 0) {
                this.cacheJobs(jobs, keywords).catch(err =>
                    console.error('Error caching jobs:', err)
                );
            }

            return jobs;
        } catch (error) {
            console.error('Upwork API Search Error:', error);
            // Fall back to cached jobs or return empty array
            return this.cacheEnabled ? 
                await this.getCachedJobs(keywords) : [];
        }
    }

    /**
     * Build Upwork query string
     */
    buildSearchQuery(keywords, filters = {}) {
        const params = new URLSearchParams();

        // Keywords (required)
        if (Array.isArray(keywords) && keywords.length > 0) {
            params.append('q', keywords.join(' OR '));
        } else if (typeof keywords === 'string') {
            params.append('q', keywords);
        }

        // Budget filter
        if (filters.minBudget) params.append('budget_min', filters.minBudget);
        if (filters.maxBudget) params.append('budget_max', filters.maxBudget);

        // Rate filter
        if (filters.rateType === 'hourly') {
            params.append('rate_type', 'hourly');
            if (filters.minRate) params.append('hourly_rate_min', filters.minRate);
            if (filters.maxRate) params.append('hourly_rate_max', filters.maxRate);
        } else if (filters.rateType === 'fixed') {
            params.append('rate_type', 'fixed');
        }

        // Client filters
        if (filters.paymentVerified) params.append('verified_only', 'true');
        if (filters.minClientRating) params.append('min_rating', filters.minClientRating);

        // Skill filters
        if (filters.skills && filters.skills.length > 0) {
            params.append('skills', filters.skills.join(','));
        }

        // Pagination
        params.append('limit', filters.limit || 50);
        params.append('offset', filters.offset || 0);

        return params.toString();
    }

    /**
     * Get cached jobs from database
     */
    async getCachedJobs(keywords) {
        try {
            const now = new Date();
            const cachedJobs = await Job.find({
                'aiAnalysis.keywords': { $in: keywords },
                cacheExpiry: { $gt: now },
                isCached: true,
            }).limit(50);

            return cachedJobs;
        } catch (error) {
            console.error('Error fetching cached jobs:', error);
            return [];
        }
    }

    /**
     * Cache jobs in database (non-blocking)
     */
    async cacheJobs(jobs, keywords) {
        try {
            const operations = jobs.map(job => ({
                updateOne: {
                    filter: { upworkJobId: job.upworkJobId },
                    update: { $set: job },
                    upsert: true,
                }
            }));

            if (operations.length > 0) {
                await Job.bulkWrite(operations);
            }
        } catch (error) {
            console.error('Error saving jobs to cache:', error);
        }
    }

    /**
     * Clean up expired cache
     */
    async cleanExpiredCache() {
        try {
            await Job.deleteMany({
                cacheExpiry: { $lt: new Date() },
                isCached: true,
            });
        } catch (error) {
            console.error('Error cleaning cache:', error);
        }
    }

    /**
     * Apply bad job filters
     */
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

    /**
     * Check if job matches bad criteria
     */
    jobMatchesBadCriteria(job, criteria) {
        const lowerCriteria = criteria.toLowerCase();

        if (lowerCriteria.includes('low budget') && job.budget?.amount < 500) return true;
        if (lowerCriteria.includes('no verified payment') && !job.clientInfo?.paymentVerified) return true;
        if (lowerCriteria.includes('low rating') && (job.clientInfo?.rating || 0) < 4.5) return true;
        if (lowerCriteria.includes('unclear description') && (!job.description || job.description.length < 50)) return true;
        if (lowerCriteria.includes('too many proposals') && job.proposalsCount > 50) return true;
        if (lowerCriteria.includes('unverified client') && job.clientInfo?.jobsPosted < 5) return true;

        return false;
    }

    /**
     * Apply rate match logic
     */
    applyRateMatching(jobs, userRate, rateType) {
        if (!userRate || !rateType) return jobs;

        return jobs.filter(job => {
            if (rateType === 'hourly' && job.budgetType === 'hourly') {
                if (job.hourlyRate) {
                    return userRate >= (job.hourlyRate.min || 0) &&
                        userRate <= (job.hourlyRate.max || Infinity);
                }
            } else if (rateType === 'fixed' && job.budgetType === 'fixed') {
                if (job.budget?.amount) {
                    return userRate <= job.budget.amount;
                }
            }
            return true;
        });
    }
}

export default new UpworkService();
