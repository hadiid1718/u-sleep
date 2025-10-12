import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/Context';
import JobResponseGenerator from '../components/JobResponseGenerator';
import { ExternalLink, Star, AlertTriangle } from 'lucide-react';

const JobSelectionPage = () => {
  const { jobs, formData } = useContext(AppContext);
  
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showReasonModel, setShowReasonModel] = useState(false);
  const [reason, setReason] = useState('');
  const [showJobResponse, setShowJobResponse] = useState(false);
  const [dismissedJobs, setDismissedJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);

  // Get current job
  const currentJob = jobs[currentJobIndex];
  const totalJobs = jobs.length;

  useEffect(() => {
    console.log('📊 JobSelectionPage loaded with', totalJobs, 'jobs');
    console.log('Current job:', currentJob);
  }, [currentJob, totalJobs]);

  const handleDismatch = () => {
    setShowReasonModel(true);
  };

  const closeReasonModel = () => {
    setShowReasonModel(false);
    setReason('');
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Please provide at least one reason.");
      return;
    }

    // Save dismissed job with reason
    setDismissedJobs([...dismissedJobs, {
      job: currentJob,
      reason: reason,
      timestamp: new Date().toISOString()
    }]);

    alert("Your reason submitted successfully. Moving to next job.");
    
    // Move to next job
    moveToNextJob();
    closeReasonModel();
  };

  const handleMatch = () => {
    // Save matched job
    setMatchedJobs([...matchedJobs, currentJob]);
    
    // Show job response generator
    setShowJobResponse(true);
  };

  const moveToNextJob = () => {
    if (currentJobIndex < totalJobs - 1) {
      setCurrentJobIndex(currentJobIndex + 1);
    } else {
      alert("You've reviewed all jobs!");
      // You can redirect to dashboard or show summary
    }
  };

  const closeTooltip = () => {
    setShowTooltip(false);
  };

  const handleNextFromTooltip = () => {
    setShowTooltip(false);
  };

  // Show job response generator
  if (showJobResponse) {
    return (
      <JobResponseGenerator 
        job={currentJob}
        onClose={() => {
          setShowJobResponse(false);
          moveToNextJob();
        }} 
      />
    );
  }

  // No jobs available
  if (!jobs || jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl mb-4">No jobs available</h2>
          <p className="text-gray-400 mb-6">Please complete the job search first.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-lime-400 text-black px-6 py-2 rounded-lg font-semibold"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // Get budget display
  const budgetDisplay = currentJob?.budgetType === 'hourly' 
    ? `$${currentJob.budget.min}-$${currentJob.budget.max}/hr`
    : `$${currentJob.budget.amount} Fixed`;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex justify-center flex-col gap-3 items-center mb-6">
        <div className="text-gray-300">
          Job {currentJobIndex + 1} of {totalJobs}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Set-up Auto-responder demo
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Left Panel - Job Details */}
        <div className="flex-1 bg-gray-800 rounded-lg p-6 border-2 border-green-400">
          {/* AI Selected Badge with Score */}
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-green-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
              AI selected job • Score: {currentJob?.score || 0}/100
            </span>
            {currentJob?.recommendation && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                currentJob.recommendation.includes('Highly') ? 'bg-green-500 text-white' :
                currentJob.recommendation.includes('Recommended') ? 'bg-blue-500 text-white' :
                currentJob.recommendation.includes('Consider') ? 'bg-yellow-500 text-black' :
                'bg-red-500 text-white'
              }`}>
                {currentJob.recommendation}
              </span>
            )}
          </div>

          {/* Job Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            {currentJob?.title}
          </h2>

          {/* Budget */}
          <div className="bg-lime-400 text-gray-900 px-4 py-2 rounded-lg inline-block mb-4 font-bold">
            {budgetDisplay}
          </div>

          {/* Red Flags Warning */}
          {currentJob?.redFlags && currentJob.redFlags.length > 0 && (
            <div className="bg-orange-600 text-white px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              <span className="text-sm font-semibold">
                {currentJob.redFlags.length} Red Flag{currentJob.redFlags.length > 1 ? 's' : ''} Detected
              </span>
            </div>
          )}

          {/* Green Flags */}
          {currentJob?.greenFlags && currentJob.greenFlags.length > 0 && (
            <div className="mb-4">
              <h4 className="text-green-400 font-semibold mb-2">✅ Green Flags:</h4>
              <div className="flex flex-wrap gap-2">
                {currentJob.greenFlags.map((flag, index) => (
                  <span key={index} className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full text-sm">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {currentJob?.redFlags && currentJob.redFlags.length > 0 && (
            <div className="mb-6">
              <h4 className="text-red-400 font-semibold mb-2">⚠️ Red Flags:</h4>
              <div className="flex flex-wrap gap-2">
                {currentJob.redFlags.map((flag, index) => (
                  <span key={index} className="bg-red-900/30 text-red-300 px-3 py-1 rounded-full text-sm">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Description */}
          <div className="text-gray-300 mb-6 leading-relaxed">
            {currentJob?.description}
          </div>

          {/* Job Details */}
          <div className="mb-6 grid grid-cols-2 gap-4 bg-gray-700/50 p-4 rounded-lg">
            <div>
              <span className="text-gray-400 text-sm">Duration:</span>
              <p className="text-white font-semibold">{currentJob?.duration}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Workload:</span>
              <p className="text-white font-semibold">{currentJob?.workload}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Proposals:</span>
              <p className="text-white font-semibold">{currentJob?.proposals}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Posted:</span>
              <p className="text-white font-semibold">
                {new Date(currentJob?.postedDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div className="space-y-6 mb-8">
            <h3 className="text-white font-bold text-xl">About this client</h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
              <div className="text-gray-400 text-base">
                Posted jobs: <span className="text-white font-semibold">{currentJob?.clientInfo.jobsPosted}</span>
              </div>
              <div className="text-gray-400 text-base">
                Verification: <span className={`font-semibold ${currentJob?.clientInfo.paymentVerified ? 'text-green-400' : 'text-red-400'}`}>
                  {currentJob?.clientInfo.paymentVerified ? 'VERIFIED' : 'NOT VERIFIED'}
                </span>
              </div>
              <div className="text-gray-400 text-base">
                Reviews: <span className="text-white font-semibold">{currentJob?.clientInfo.totalReviews}</span>
              </div>
              <div className="text-gray-400 text-base">
                Rating: <span className="text-white font-semibold flex items-center gap-1">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  {currentJob?.clientInfo.rating || 'N/A'}
                </span>
              </div>
              <div className="text-gray-400 text-base">
                Total spent: <span className="text-white font-semibold">
                  ${currentJob?.clientInfo.totalSpent.toLocaleString()}
                </span>
              </div>
              <div className="text-gray-400 text-base">
                Total hires: <span className="text-white font-semibold">{currentJob?.clientInfo.totalHires}</span>
              </div>
              <div className="text-gray-400 text-base">
                Hire rate: <span className="text-white font-semibold">{currentJob?.clientInfo.hireRate}%</span>
              </div>
              <div className="text-gray-400 text-base">
                Country: <span className="text-white font-semibold">{currentJob?.clientInfo.country}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-2">Location preferences</h3>
            <p className="text-gray-300">
              Location: {currentJob?.clientInfo.city}, {currentJob?.clientInfo.country}
            </p>
          </div>

          {/* Link to Upwork */}
          <div className="mb-6">
            <a 
              href={currentJob?.url} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 underline flex items-center gap-2 transition-colors"
            >
              Link to Upwork job <ExternalLink size={18} />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDismatch}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              ⚠️ Dismatch
            </button>
            <button
              onClick={handleMatch}
              className="flex-1 bg-green-400 hover:bg-green-500 text-gray-900 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              ✅ Match
            </button>
          </div>
        </div>

        {/* Right Panel - AI Analysis */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <h3 className="text-green-400 font-semibold mb-4 text-lg">
              🤖 AI Analysis - Why this is a good fit:
            </h3>
            
            {/* AI Analysis Text */}
            {currentJob?.aiAnalysis && (
              <p className="text-gray-300 leading-relaxed mb-6">
                {currentJob.aiAnalysis}
              </p>
            )}

            {/* Job Stats */}
            <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
              <h4 className="text-white font-semibold mb-3">📊 Job Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">AI Quality Score:</span>
                  <span className="text-lime-400 font-bold">{currentJob?.score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Proposals:</span>
                  <span className="text-white font-semibold">{currentJob?.proposals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Client Spent:</span>
                  <span className="text-white font-semibold">
                    ${currentJob?.clientInfo.totalSpent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Client Rating:</span>
                  <span className="text-white font-semibold">
                    ⭐ {currentJob?.clientInfo.rating || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Swipe Tips */}
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
              <p className="text-yellow-400 font-semibold mb-2">💡 Swipe Tips:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Click ✅ Match to generate job response</li>
                <li>• Click ⚠️ Dismatch to skip with reason</li>
                <li>• Review AI analysis before deciding</li>
              </ul>
            </div>
          </div>

          {/* Your Search Criteria */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lime-400 font-semibold mb-4">🎯 Your Search Criteria:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Keywords:</span>
                <p className="text-white">{formData?.keywords?.join(', ')}</p>
              </div>
              <div>
                <span className="text-gray-400">Min Rates:</span>
                <p className="text-white">
                  ${formData?.hourlyRate}/hr | ${formData?.fixedRate}/project
                </p>
              </div>
              <div>
                <span className="text-gray-400">Account Type:</span>
                <p className="text-white capitalize">{formData?.accountType}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Feedback Modal */}
      {showReasonModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={closeReasonModel}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-lg hover:bg-gray-600 transition-colors"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-lime-600 mb-4">
              Why didn't this job match?
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Help us improve by telling us why you dismissed this job.
            </p>
            <textarea 
              className="w-full resize-none outline-none border-2 border-gray-300 focus:border-lime-400 p-4 rounded-lg mb-4 h-32" 
              placeholder="e.g., Budget too low, Not my expertise, Client seems unreliable..."
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
            />
            <div className="flex gap-3">
              <button 
                onClick={closeReasonModel} 
                className="flex-1 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-all font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                className="flex-1 bg-lime-400 border-2 border-lime-400 px-4 py-2 rounded-lg hover:bg-lime-500 transition-all font-semibold"
              >
                Submit & Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tooltip */}
      {showTooltip && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-400 text-gray-900 p-6 rounded-lg relative max-w-md shadow-2xl">
            <button
              onClick={closeTooltip}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-lg hover:bg-gray-600 transition-colors font-bold"
            >
              ×
            </button>
            <h4 className="font-bold text-xl mb-3">🎯 Job Selection Guide</h4>
            <p className="text-sm mb-4 leading-relaxed">
              These jobs are selected by AI based on your criteria. Review each job carefully:
            </p>
            <ul className="text-sm mb-4 space-y-1">
              <li>• ✅ Click <strong>Match</strong> to generate a proposal</li>
              <li>• ⚠️ Click <strong>Dismatch</strong> to skip with feedback</li>
              <li>• 🤖 Check AI analysis for insights</li>
            </ul>
            <button
              onClick={handleNextFromTooltip}
              className="bg-gray-900 text-green-400 px-6 py-3 rounded-lg font-bold w-full hover:bg-gray-800 transition-colors"
            >
              Got it! Let's start
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSelectionPage;