import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../context/Context";
import JobResponseGenerator from "../components/JobResponseGenerator";
import ReasonModal from "../components/ReasonModal";
import { ExternalLink, Star, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const JobSelectionPage = () => {
  const { jobResults, formData, loading, error, setError } = useContext(AppContext);
  const navigate = useNavigate();

  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showReasonModel, setShowReasonModel] = useState(false);
  const [reason, setReason] = useState("");
  const [showJobResponse, setShowJobResponse] = useState(false);
  const [dismissedJobs, setDismissedJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);

  // Validate job data on mount
  useEffect(() => {
    console.log('Checking job results:', { jobResults, loading, error });
    
    if (!loading && (!Array.isArray(jobResults) || jobResults.length === 0)) {
      console.error('No valid job results found');
      setError('No jobs found. Please try searching again.');
      // Optional: navigate back to search after a delay
      setTimeout(() => navigate('/'), 3000);
    }
  }, [jobResults, loading]);

  // ✅ Safety check: prevent crash when jobs array is empty
  const currentJob = Array.isArray(jobResults) && jobResults.length > 0 ? jobResults[currentJobIndex] : null;
  const totalJobs = Array.isArray(jobResults) ? jobResults.length : 0;

  useEffect(() => {
    console.log("📊 JobSelectionPage loaded with", totalJobs, "jobs");
    console.log("Current job:", currentJob);
  }, [currentJob, totalJobs]);

  const handleDismatch = () => setShowReasonModel(true);
  const closeReasonModel = () => {
    setShowReasonModel(false);
    setReason("");
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Please provide at least one reason.");
      return;
    }

    setDismissedJobs([
      ...dismissedJobs,
      { job: currentJob, reason, timestamp: new Date().toISOString() },
    ]);

    alert("Your reason submitted successfully. Moving to next job.");
    moveToNextJob();
    closeReasonModel();
  };

  const handleMatch = () => {
    setMatchedJobs([...matchedJobs, currentJob]);
    setShowJobResponse(true);
  };

  const moveToNextJob = () => {
    if (currentJobIndex < totalJobs - 1) {
      setCurrentJobIndex(currentJobIndex + 1);
    } else {
      alert("You've reviewed all jobs!");
    }
  };

  const closeTooltip = () => setShowTooltip(false);
  const handleNextFromTooltip = () => setShowTooltip(false);

  // ✅ If Job Response Generator open
  if (showJobResponse && currentJob) {
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

  // ✅ Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl mb-4">Loading jobs...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl mb-4">Error loading jobs</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = "/"}
            className="bg-lime-400 text-black px-6 py-2 rounded-lg font-semibold"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // ✅ No jobs available
  if (!currentJob) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl mb-4">No jobs available</h2>
          <p className="text-gray-400 mb-6">
            Please complete the job search or check your search criteria.
          </p>
          <button
            onClick={() => window.location.href = "/"}
            className="bg-lime-400 text-black px-6 py-2 rounded-lg font-semibold"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // ✅ Safely extract budget info
  // ✅ Safely extract budget info with logging
  console.log('Current job budget:', currentJob?.budget);
  const budgetDisplay = (() => {
    if (!currentJob?.budget) return "Budget not specified";
    
    if (currentJob.budgetType === "hourly") {
      const min = currentJob.budget.min || 0;
      const max = currentJob.budget.max || 0;
      return `$${min}–$${max}/hr`;
    }
    
    if (currentJob.budgetType === "fixed") {
      const amount = currentJob.budget.amount || 0;
      return `$${amount} Fixed`;
    }
    
    return "Budget not specified";
  })();

  console.log('Current job client info:', currentJob?.clientInfo);
  const client = currentJob?.clientInfo || {};

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex justify-center flex-col gap-3 items-center mb-6">
        <div className="text-gray-300">
          Job {currentJobIndex + 1} of {totalJobs}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Set-up Auto-responder demo
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
        {/* Left Panel */}
        <div className="flex-1 bg-gray-800 rounded-lg p-6 border-2 border-green-400">
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-green-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
              AI selected job • Score: {currentJob?.score || 0}/100
            </span>
            {currentJob?.recommendation && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  currentJob.recommendation.includes("Highly")
                    ? "bg-green-500 text-white"
                    : currentJob.recommendation.includes("Recommended")
                    ? "bg-blue-500 text-white"
                    : currentJob.recommendation.includes("Consider")
                    ? "bg-yellow-500 text-black"
                    : "bg-red-500 text-white"
                }`}
              >
                {currentJob.recommendation}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            {currentJob?.title || "Untitled Job"}
          </h2>

          <div className="bg-lime-400 text-gray-900 px-4 py-2 rounded-lg inline-block mb-4 font-bold">
            {budgetDisplay}
          </div>

          {/* Red Flags */}
          {Array.isArray(currentJob?.redFlags) && currentJob.redFlags.length > 0 && (
            <div className="bg-orange-600 text-white px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              <span className="text-sm font-semibold">
                {currentJob.redFlags.length} Red Flag
                {currentJob.redFlags.length > 1 ? "s" : ""} Detected
              </span>
            </div>
          )}

          {/* Description */}
          <div className="text-gray-300 mb-6 leading-relaxed">
            {currentJob?.description || "No description provided."}
          </div>

          {/* Client Info */}
          <div className="space-y-6 mb-8">
            <h3 className="text-white font-bold text-xl">About this client</h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
              <div className="text-gray-400 text-base">
                Posted jobs:{" "}
                <span className="text-white font-semibold">
                  {client.jobsPosted || 0}
                </span>
              </div>
              <div className="text-gray-400 text-base">
                Verification:{" "}
                <span
                  className={`font-semibold ${
                    client.paymentVerified ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {client.paymentVerified ? "VERIFIED" : "NOT VERIFIED"}
                </span>
              </div>
              <div className="text-gray-400 text-base">
                Total spent:{" "}
                <span className="text-white font-semibold">
                  ${client.totalSpent?.toLocaleString() || 0}
                </span>
              </div>
              <div className="text-gray-400 text-base">
                Country:{" "}
                <span className="text-white font-semibold">
                  {client.country || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Job Link */}
          <div className="mb-6">
            <a
              href={currentJob?.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 underline flex items-center gap-2 transition-colors"
            >
              Link to Upwork job <ExternalLink size={18} />
            </a>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDismatch}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Dismatch
            </button>
            <button
              onClick={handleMatch}
              className="flex-1 bg-green-400 hover:bg-green-500 text-gray-900 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Match
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <h3 className="text-green-400 font-semibold mb-4 text-lg">
              AI Analysis - Why this is a good fit:
            </h3>

            {(() => {
              console.log('AI Analysis data:', {
                analysis: currentJob?.aiAnalysis,
                score: currentJob?.score,
                redFlags: currentJob?.redFlags,
                greenFlags: currentJob?.greenFlags
              });
              
              if (currentJob?.aiAnalysis) {
                return (
                  <div>
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {currentJob.aiAnalysis}
                    </p>
                    {currentJob.redFlags && currentJob.redFlags.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-red-400 font-semibold mb-2">Red Flags:</h4>
                        <ul className="list-disc list-inside text-gray-300">
                          {currentJob.redFlags.map((flag, index) => (
                            <li key={index}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {currentJob.greenFlags && currentJob.greenFlags.length > 0 && (
                      <div>
                        <h4 className="text-green-400 font-semibold mb-2">Green Flags:</h4>
                        <ul className="list-disc list-inside text-gray-300">
                          {currentJob.greenFlags.map((flag, index) => (
                            <li key={index}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <p className="text-gray-400 italic">
                  No AI insights available. The analysis may have failed or is still processing.
                </p>
              );
            })()}
          </div>

          {/* Your Criteria */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lime-400 font-semibold mb-4">
              🎯 Your Search Criteria:
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Keywords:</span>
                <p className="text-white">
                  {formData?.keywords?.join(", ") || "None"}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Min Rates:</span>
                <p className="text-white">
                  ${formData?.hourlyRate || 0}/hr | $
                  {formData?.fixedRate || 0}/project
                </p>
              </div>
              <div>
                <span className="text-gray-400">Account Type:</span>
                <p className="text-white capitalize">
                  {formData?.accountType || "freelancer"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Modal */}
      <ReasonModal
        isOpen={showReasonModel}
        onClose={closeReasonModel}
        reason={reason}
        setReason={setReason}
        onSubmit={handleSubmit}
      />

      {/* Tooltip */}
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
              These jobs are selected by AI based on your preferences.
            </p>
            <ul className="text-sm mb-4 space-y-1">
              <li>• ✅ Click <strong>Match</strong> to generate a proposal</li>
              <li>• ⚠️ Click <strong>Dismatch</strong> to skip with feedback</li>
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
