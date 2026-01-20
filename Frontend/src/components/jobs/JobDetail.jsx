import React from 'react';
import { ExternalLink, Star, CheckCircle, XCircle } from 'lucide-react';

// ✅ Safe and consistent Job Card Component
const JobDetails = ({ job }) => {
  if (!job || typeof job !== 'object') {
    return (
      <div className="bg-gray-900 border-2 border-red-500 rounded-2xl p-8 text-center text-red-400">
        Job data unavailable or invalid.
      </div>
    );
  }

  // ✅ Safe destructuring with defaults
  const {
    title = 'Untitled Job',
    description = 'No description provided.',
    url = '#',
    postedDate,
    budgetType,
    budget = {},
    aiAnalysis,
    recommendation,
    score,
    greenFlags = [],
    redFlags = [],
    clientInfo = {},
    duration = 'N/A',
    workload = 'N/A',
    proposals = 'N/A',
  } = job;

  // ✅ Safe fallback values for client info
  const {
    jobsPosted = 'N/A',
    paymentVerified = false,
    totalReviews = 'N/A',
    rating = 'N/A',
    totalSpent = 0,
    totalHires = 'N/A',
    hireRate = 'N/A',
    country = 'Unknown',
  } = clientInfo;

  // ✅ Budget Display with proper formatting
  const budgetDisplay = (() => {
    if (!budget) return 'Budget not specified';
    
    if (budgetType === 'hourly' && (budget.min > 0 || budget.max > 0)) {
      return `Hourly: $${budget.min.toLocaleString()} - $${budget.max.toLocaleString()}/hr`;
    }
    
    if (budgetType === 'fixed' && budget.amount > 0) {
      return `Fixed: $${budget.amount.toLocaleString()} USD`;
    }
    
    return 'Budget not specified';
  })();

  return (
    <div className="bg-gray-900 border-2 border-lime-400 rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
        <div className="w-full sm:w-auto inline-block bg-lime-400 text-gray-900 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
          AI selected job • Score: {score ?? 'N/A'}/100
        </div>
        {recommendation && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              recommendation.includes('Highly')
                ? 'bg-green-500 text-white'
                : recommendation.includes('Recommended')
                ? 'bg-blue-500 text-white'
                : recommendation.includes('Consider')
                ? 'bg-yellow-500 text-black'
                : 'bg-red-500 text-white'
            }`}
          >
            {recommendation}
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-white text-2xl font-bold mb-6 leading-tight">{title}</h2>

      {/* Budget */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-5 py-3 mb-6 inline-block">
        <span className="text-lime-400 font-bold">{budgetDisplay}</span>
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="bg-gray-800 border border-lime-400/30 rounded-lg p-4 mb-6">
          <h3 className="text-lime-400 font-bold mb-2">AI Analysis</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      {/* Green Flags */}
      {greenFlags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
            <CheckCircle size={18} /> Green Flags
          </h4>
          <div className="flex flex-wrap gap-2">
            {greenFlags.map((flag, i) => (
              <span key={i} className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full text-sm">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
            <XCircle size={18} /> Red Flags
          </h4>
          <div className="flex flex-wrap gap-2">
            {redFlags.map((flag, i) => (
              <span key={i} className="bg-red-900/30 text-red-300 px-3 py-1 rounded-full text-sm">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="text-gray-300 text-base leading-relaxed space-y-4 mb-8">
        <p>{description}</p>
      </div>

      {/* Client Information */}
      <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
        <h3 className="text-white font-bold text-lg sm:text-xl">About this client</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-3">
          <div className="text-sm sm:text-base text-gray-400">Posted jobs: <span className="text-white font-semibold">{jobsPosted}</span></div>
          <div className="text-sm sm:text-base text-gray-400">
            Verification:{' '}
            <span className={`font-semibold ${paymentVerified ? 'text-green-400' : 'text-red-400'}`}>
              {paymentVerified ? 'VERIFIED' : 'NOT VERIFIED'}
            </span>
          </div>
          <div className="text-gray-400">Reviews: <span className="text-white font-semibold">{totalReviews}</span></div>
          <div className="text-gray-400">
            Rating:{' '}
            <span className="text-white font-semibold flex items-center gap-1">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              {rating}
            </span>
          </div>
          <div className="text-gray-400">Total spent: <span className="text-white font-semibold">${totalSpent.toLocaleString()}</span></div>
          <div className="text-gray-400">Total hires: <span className="text-white font-semibold">{totalHires}</span></div>
          <div className="text-gray-400">Hire rate: <span className="text-white font-semibold">{hireRate}%</span></div>
          <div className="text-gray-400">Country: <span className="text-white font-semibold">{country}</span></div>
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-3 mb-8">
        <h3 className="text-white font-bold text-xl">Job Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <p className="text-gray-400 text-base">
            Duration: <span className="text-white font-semibold">{duration}</span>
          </p>
          <p className="text-gray-400 text-base">
            Workload: <span className="text-white font-semibold">{workload}</span>
          </p>
          <p className="text-gray-400 text-base">
            Proposals: <span className="text-white font-semibold">{proposals}</span>
          </p>
          <p className="text-gray-400 text-base">
            Posted:{' '}
            <span className="text-white font-semibold">
              {postedDate ? new Date(postedDate).toLocaleDateString() : 'Unknown'}
            </span>
          </p>
        </div>
      </div>

      {/* Link to Upwork */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lime-400 hover:underline flex items-center gap-2 text-base font-medium"
      >
        View on Upwork <ExternalLink size={18} />
      </a>
    </div>
  );
};

export default JobDetails;
