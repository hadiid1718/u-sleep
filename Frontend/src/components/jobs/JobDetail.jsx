import React from 'react';
import { ExternalLink, Star, CheckCircle, XCircle } from 'lucide-react';

const JobDetails = () => {
  // 🔒 HARD-CODED JOB DATA
  const job = {
    title: 'Senior React Developer Needed for SaaS Platform',
    description:
      'We are looking for an experienced React developer to help us build a scalable SaaS application. You should be comfortable with modern React, hooks, performance optimization, and API integration.',
    url: 'https://www.upwork.com/job/example',
    postedDate: '2025-01-15',
    budgetType: 'fixed',
    budget: {
      amount: 3000,
    },
    aiAnalysis:
      'This job strongly matches your profile based on React expertise, SaaS experience, and budget expectations.',
    recommendation: 'Highly Recommended',
    score: 92,
    greenFlags: [
      'Clear requirements',
      'Verified payment method',
      'High budget',
      'Experienced client',
    ],
    redFlags: ['Tight deadline'],
    clientInfo: {
      jobsPosted: 48,
      paymentVerified: true,
      totalReviews: 36,
      rating: 4.9,
      totalSpent: 120000,
      totalHires: 22,
      hireRate: 85,
      country: 'United States',
    },
    duration: '3–6 months',
    workload: '30+ hrs/week',
    proposals: '15–20',
  };

  // ✅ Safe destructuring
  const {
    title,
    description,
    url,
    postedDate,
    budgetType,
    budget,
    aiAnalysis,
    recommendation,
    score,
    greenFlags,
    redFlags,
    clientInfo,
    duration,
    workload,
    proposals,
  } = job;

  const {
    jobsPosted,
    paymentVerified,
    totalReviews,
    rating,
    totalSpent,
    totalHires,
    hireRate,
    country,
  } = clientInfo;

  const budgetDisplay =
    budgetType === 'fixed'
      ? `Fixed: $${budget.amount.toLocaleString()} USD`
      : 'Budget not specified';

  return (
    <div className= "min-h-[40vh] bg-gray-900 border-2 border-lime-400 rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between gap-4 items-center mb-6">
        <span className="bg-lime-400 text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold">
          AI selected job • Score: {score}/100
        </span>

        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {recommendation}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-white text-2xl font-bold mb-6">{title}</h2>

      {/* Budget */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-5 py-3 mb-6 inline-block">
        <span className="text-lime-400 font-bold">{budgetDisplay}</span>
      </div>

      {/* AI Analysis */}
      <div className="bg-gray-800 border border-lime-400/30 rounded-lg p-4 mb-6">
        <h3 className="text-lime-400 font-bold mb-2">AI Analysis</h3>
        <p className="text-gray-300 text-sm">{aiAnalysis}</p>
      </div>

      {/* Green Flags */}
      <div className="mb-4">
        <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
          <CheckCircle size={18} /> Green Flags
        </h4>
        <div className="flex flex-wrap gap-2">
          {greenFlags.map((flag, i) => (
            <span
              key={i}
              className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full text-sm"
            >
              {flag}
            </span>
          ))}
        </div>
      </div>

      {/* Red Flags */}
      <div className="mb-6">
        <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
          <XCircle size={18} /> Red Flags
        </h4>
        <div className="flex flex-wrap gap-2">
          {redFlags.map((flag, i) => (
            <span
              key={i}
              className="bg-red-900/30 text-red-300 px-3 py-1 rounded-full text-sm"
            >
              {flag}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 mb-8">{description}</p>

      {/* Client Info */}
      <h3 className="text-white font-bold text-xl mb-4">About this client</h3>
      <div className="grid grid-cols-2 gap-4 text-gray-400 mb-8">
        <p>Posted jobs: <span className="text-white">{jobsPosted}</span></p>
        <p>
          Payment:{' '}
          <span className={paymentVerified ? 'text-green-400' : 'text-red-400'}>
            {paymentVerified ? 'VERIFIED' : 'NOT VERIFIED'}
          </span>
        </p>
        <p>Reviews: <span className="text-white">{totalReviews}</span></p>
        <p className="flex items-center gap-1">
          Rating:
          <Star size={16} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white">{rating}</span>
        </p>
        <p>Total spent: <span className="text-white">${totalSpent.toLocaleString()}</span></p>
        <p>Hire rate: <span className="text-white">{hireRate}%</span></p>
        <p>Country: <span className="text-white">{country}</span></p>
      </div>

      {/* Job Meta */}
      <h3 className="text-white font-bold text-xl mb-4">Job Details</h3>
      <div className="grid grid-cols-2 gap-4 text-gray-400 mb-8">
        <p>Duration: <span className="text-white">{duration}</span></p>
        <p>Workload: <span className="text-white">{workload}</span></p>
        <p>Proposals: <span className="text-white">{proposals}</span></p>
        <p>
          Posted:{' '}
          <span className="text-white">
            {new Date(postedDate).toLocaleDateString()}
          </span>
        </p>
      </div>

      {/* External Link */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lime-400 hover:underline flex items-center gap-2 font-medium"
      >
        View on Upwork <ExternalLink size={18} />
      </a>
    </div>
  );
};

export default JobDetails;
