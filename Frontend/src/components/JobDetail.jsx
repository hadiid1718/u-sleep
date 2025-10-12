import React, { useContext } from 'react';
import { AppContext } from '../context/Context';
import { ExternalLink, Star, CheckCircle, XCircle } from 'lucide-react';

// Individual Job Card Component
const JobDetails = ({ job }) => {
  if (!job) return null;

  const budgetDisplay = job.budgetType === 'hourly' 
    ? `Hourly: $${job.budget.min}-$${job.budget.max}/hr`
    : `Fixed: $${job.budget.amount} USD`;

  return (
    <div className="bg-gray-900 border-2 border-lime-400 rounded-2xl p-8 mb-6">
      {/* Header with Score and Recommendation */}
      <div className="flex items-center justify-between mb-6">
        <div className="inline-block bg-lime-400 text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold">
          AI selected job • Score: {job.score}/100
        </div>
        {job.recommendation && (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            job.recommendation.includes('Highly') ? 'bg-green-500 text-white' :
            job.recommendation.includes('Recommended') ? 'bg-blue-500 text-white' :
            job.recommendation.includes('Consider') ? 'bg-yellow-500 text-black' :
            'bg-red-500 text-white'
          }`}>
            {job.recommendation}
          </span>
        )}
      </div>
      
      {/* Job Title */}
      <h2 className="text-white text-2xl font-bold mb-6 leading-tight">
        {job.title}
      </h2>
      
      {/* Budget */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-5 py-3 mb-6 inline-block">
        <span className="text-lime-400 font-bold">{budgetDisplay}</span>
      </div>

      {/* AI Analysis */}
      {job.aiAnalysis && (
        <div className="bg-gray-800 border border-lime-400/30 rounded-lg p-4 mb-6">
          <h3 className="text-lime-400 font-bold mb-2">🤖 AI Analysis</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{job.aiAnalysis}</p>
        </div>
      )}

      {/* Green Flags */}
      {job.greenFlags && job.greenFlags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
            <CheckCircle size={18} /> Green Flags
          </h4>
          <div className="flex flex-wrap gap-2">
            {job.greenFlags.map((flag, index) => (
              <span key={index} className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full text-sm">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {job.redFlags && job.redFlags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
            <XCircle size={18} /> Red Flags
          </h4>
          <div className="flex flex-wrap gap-2">
            {job.redFlags.map((flag, index) => (
              <span key={index} className="bg-red-900/30 text-red-300 px-3 py-1 rounded-full text-sm">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Job Description */}
      <div className="text-gray-300 text-base leading-relaxed space-y-4 mb-8">
        <p>{job.description}</p>
      </div>
      
      {/* Client Information */}
      <div className="space-y-6 mb-8">
        <h3 className="text-white font-bold text-xl">About this client</h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3">
          <div className="text-gray-400 text-base">
            Posted jobs: <span className="text-white font-semibold">{job.clientInfo.jobsPosted}</span>
          </div>
          <div className="text-gray-400 text-base">
            Verification: <span className={`font-semibold ${job.clientInfo.paymentVerified ? 'text-green-400' : 'text-red-400'}`}>
              {job.clientInfo.paymentVerified ? 'VERIFIED' : 'NOT VERIFIED'}
            </span>
          </div>
          <div className="text-gray-400 text-base">
            Reviews: <span className="text-white font-semibold">{job.clientInfo.totalReviews}</span>
          </div>
          <div className="text-gray-400 text-base">
            Rating: <span className="text-white font-semibold flex items-center gap-1">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              {job.clientInfo.rating || 'N/A'}
            </span>
          </div>
          <div className="text-gray-400 text-base">
            Total spent: <span className="text-white font-semibold">${job.clientInfo.totalSpent.toLocaleString()}</span>
          </div>
          <div className="text-gray-400 text-base">
            Total hires: <span className="text-white font-semibold">{job.clientInfo.totalHires}</span>
          </div>
          <div className="text-gray-400 text-base">
            Hire rate: <span className="text-white font-semibold">{job.clientInfo.hireRate}%</span>
          </div>
          <div className="text-gray-400 text-base">
            Country: <span className="text-white font-semibold">{job.clientInfo.country}</span>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-3 mb-8">
        <h3 className="text-white font-bold text-xl">Job Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <p className="text-gray-400 text-base">
            Duration: <span className="text-white font-semibold">{job.duration}</span>
          </p>
          <p className="text-gray-400 text-base">
            Workload: <span className="text-white font-semibold">{job.workload}</span>
          </p>
          <p className="text-gray-400 text-base">
            Proposals: <span className="text-white font-semibold">{job.proposals}</span>
          </p>
          <p className="text-gray-400 text-base">
            Posted: <span className="text-white font-semibold">{new Date(job.postedDate).toLocaleDateString()}</span>
          </p>
        </div>
      </div>
      
      {/* Link to Upwork */}
      <a 
        href={job.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-lime-400 hover:underline flex items-center gap-2 text-base font-medium"
      >
        Link to Upwork job <ExternalLink size={18} />
      </a>
    </div>
  );
};

export default JobDetails;