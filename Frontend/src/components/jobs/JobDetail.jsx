import React from 'react';
import { ExternalLink, Star, CheckCircle, XCircle } from 'lucide-react';

const JobDetails = ({ job: propJob }) => {
  // Use prop job data if available, otherwise use fallback
  const job = propJob || {
    title: 'No Job Selected',
    description: 'No job data available.',
    url: '#',
    postedDate: new Date().toISOString(),
    budgetType: 'fixed',
    budget: { amount: 0 },
    aiAnalysis: { reasoning: '', matchScore: 0, recommendation: '', greenFlags: [], redFlags: [] },
    clientInfo: {},
  };

  // Safe destructuring with defaults
  const title = job.title || 'Untitled Job';
  const description =
    job.translatedDescription ||
    job.description ||
    job.shortDescription ||
    'No description available';
  const url = job.source === 'freelancer_api' ? (job.freelancerUrl || job.upworkUrl || job.url || '#') : (job.upworkUrl || job.url || '#');
  const sourceLabel = job.source === 'freelancer_api' ? 'Freelancer' : 'Upwork';
  const postedDate = job.postedDate || job.createdAt;
  const budgetType = job.budgetType || 'fixed';
  const budget = job.budget || {};
  const hourlyRate = job.hourlyRate || {};
  const duration = job.duration || 'Not specified';
  const workload = job.workloadHoursPerWeek || 'Not specified';
  const proposalsCount = job.proposalsCount || 'N/A';
  const skills = job.skills || [];

  // AI Analysis - handle both string and object formats
  const aiAnalysis = typeof job.aiAnalysis === 'object'
    ? job.aiAnalysis
    : { reasoning: job.aiAnalysis || '', matchScore: 0, recommendation: '', greenFlags: [], redFlags: [] };

  const recommendation = aiAnalysis.recommendation || 'Pending';
  const score = aiAnalysis.matchScore || 0;
  const greenFlags = aiAnalysis.greenFlags || [];
  const redFlags = aiAnalysis.redFlags || [];
  const reasoning = aiAnalysis.reasoning || '';

  // Client info with defaults
  const clientInfo = job.clientInfo || {};
  const jobsPosted = clientInfo.jobsPosted || 0;
  const paymentVerified = clientInfo.paymentVerified || false;
  const totalReviews = clientInfo.totalReviews || 0;
  const rating = clientInfo.rating || 0;
  const totalSpent = clientInfo.totalSpent || 0;
  const _totalHires = clientInfo.totalHires || 0;
  const hireRate = clientInfo.hireRate || 0;
  const country = clientInfo.country || 'Unknown';

  const budgetDisplay =
    budgetType === 'fixed' && budget.amount
      ? `Fixed: $${budget.amount.toLocaleString()} ${budget.currency || 'USD'}`
      : budgetType === 'hourly' && hourlyRate.min
        ? `Hourly: $${hourlyRate.min}–$${hourlyRate.max} ${hourlyRate.currency || 'USD'}`
        : 'Budget not specified';

  return (
    <div className="min-h-[40vh] bg-white dark:bg-slate-900 border border-lime-300 dark:border-lime-500/50 rounded-2xl p-6 sm:p-7 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 items-center mb-6">
        <span className="bg-lime-400 text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold">
          AI selected job • Score: {score}/100
        </span>

        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {recommendation}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-gray-900 dark:text-white text-2xl sm:text-3xl font-bold mb-6 leading-tight">{title}</h2>

      {/* Budget */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3 mb-6 inline-block">
        <span className="text-lime-300 font-bold">{budgetDisplay}</span>
      </div>

      {/* AI Analysis */}
      <div className="bg-slate-100 dark:bg-slate-800 border border-lime-200 dark:border-lime-400/30 rounded-lg p-4 mb-6 transition-colors">
        <h3 className="text-lime-700 dark:text-lime-400 font-bold mb-2">AI Analysis</h3>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{reasoning}</p>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-6">
          <h4 className="text-blue-600 dark:text-blue-400 font-semibold mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Green Flags */}
      <div className="mb-4">
        <h4 className="text-green-600 dark:text-green-400 font-semibold mb-2 flex items-center gap-2">
          <CheckCircle size={18} /> Green Flags
        </h4>
        <div className="flex flex-wrap gap-2">
          {greenFlags.map((flag, i) => (
            <span
              key={i}
              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-sm"
            >
              {flag}
            </span>
          ))}
        </div>
      </div>

      {/* Red Flags */}
      <div className="mb-6">
        <h4 className="text-red-600 dark:text-red-400 font-semibold mb-2 flex items-center gap-2">
          <XCircle size={18} /> Red Flags
        </h4>
        <div className="flex flex-wrap gap-2">
          {redFlags.map((flag, i) => (
            <span
              key={i}
              className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-3 py-1 rounded-full text-sm"
            >
              {flag}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Description</h4>
        <div className="max-h-72 overflow-y-auto pr-2">
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>
      </div>

      {/* Client Info */}
      <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-4">About this client</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400 mb-8">
        <p>Posted jobs: <span className="text-gray-900 dark:text-white">{jobsPosted}</span></p>
        <p>
          Payment:{' '}
          <span className={paymentVerified ? 'text-green-400' : 'text-red-400'}>
            {paymentVerified ? 'VERIFIED' : 'NOT VERIFIED'}
          </span>
        </p>
        <p>Reviews: <span className="text-gray-900 dark:text-white">{totalReviews}</span></p>
        <p className="flex items-center gap-1">
          Rating:
          <span className="text-gray-900 dark:text-white">{rating}</span>
        </p>
        <p>Total spent: <span className="text-gray-900 dark:text-white">${(totalSpent || 0).toLocaleString()}</span></p>
        <p>Hire rate: <span className="text-gray-900 dark:text-white">{hireRate}%</span></p>
        <p>Country: <span className="text-gray-900 dark:text-white">{country}</span></p>
      </div>

      {/* Job Meta */}
      <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-4">Job Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400 mb-8">
        <p>Duration: <span className="text-gray-900 dark:text-white">{duration}</span></p>
        <p>Workload: <span className="text-gray-900 dark:text-white">{workload}</span></p>
        <p>Proposals: <span className="text-gray-900 dark:text-white">{proposalsCount}</span></p>
        <p>
          Posted:{' '}
          <span className="text-gray-900 dark:text-white">
            {new Date(postedDate).toLocaleDateString()}
          </span>
        </p>
      </div>

      {/* External Link */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lime-700 dark:text-lime-400 hover:underline flex items-center gap-2 font-medium"
      >
        View on {sourceLabel} <ExternalLink size={18} />
      </a>
    </div>
  );
};

export default JobDetails;
