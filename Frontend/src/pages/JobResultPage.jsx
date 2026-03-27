import React, { useState, useContext } from "react";
import JobResponseGenerator from "../components/jobs/JobResponseGenerator";
import ReasonModal from "../components/models/ReasonModal";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/Context";

/* =======================
   COMPONENT
======================= */

const JobResultPage = () => {
  const navigate = useNavigate();
  const {
    jobResults,
    jobDiagnostics,
    error,
    formData,
    matchJob,
    rejectJob,
  } = useContext(AppContext);

  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showReasonModel, setShowReasonModel] = useState(false);
  const [reason, setReason] = useState("");
  const [showJobResponse, setShowJobResponse] = useState(false);

  const jobs = jobResults || [];
  const totalJobs = jobs.length;
  const currentJob = jobs[currentJobIndex];

  const handleDismatch = () => setShowReasonModel(true);

  const closeReasonModel = () => {
    setShowReasonModel(false);
    setReason("");
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide at least one reason.");
      return;
    }

    const jobId = currentJob?._id || currentJob?.id;
    if (jobId) {
      await rejectJob(jobId, reason);
    }

    moveToNextJob();
    closeReasonModel();
  };

  const handleMatch = async () => {
    const jobId = currentJob?._id || currentJob?.id;
    if (jobId) {
      await matchJob(jobId);
    }

    setShowJobResponse(true);
  };

  const moveToNextJob = () => {
    if (currentJobIndex < totalJobs - 1) {
      setCurrentJobIndex((prev) => prev + 1);
    } else {
      alert("You've reviewed all jobs!");
    }
  };

  /* =======================
     JOB RESPONSE SCREEN
  ======================= */

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

  /* =======================
     EMPTY / LOADING STATE
  ======================= */

  if (!currentJob) {
    const blockerDetected = jobDiagnostics?.page?.antiBotDetected;

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-2xl px-6">
          <h2 className="text-2xl font-bold text-white mb-3">
            {blockerDetected ? 'Job Search Blocked' : 'No Jobs Available'}
          </h2>
          <p className="text-gray-400 mb-4">
            {error || 'Search for jobs first to see results here.'}
          </p>

          {jobDiagnostics && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-left mb-6 text-sm">
              <p className="text-gray-300 mb-1">
                Source: <span className="text-white">{jobDiagnostics.source || 'unknown'}</span>
              </p>
              <p className="text-gray-300 mb-1">
                Page title: <span className="text-white">{jobDiagnostics.page?.title || 'N/A'}</span>
              </p>
              <p className="text-gray-300 mb-1">
                Anti-bot detected: <span className="text-white">{jobDiagnostics.page?.antiBotDetected ? 'Yes' : 'No'}</span>
              </p>
              <p className="text-gray-300 mb-1">
                DOM candidates: <span className="text-white">{jobDiagnostics.extraction?.domCandidates ?? 0}</span>
              </p>
              <p className="text-gray-300">
                Embedded candidates: <span className="text-white">{jobDiagnostics.extraction?.embeddedCandidates ?? 0}</span>
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/user/dashboard')}
            className="bg-lime-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-lime-300 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* =======================
     BUDGET FORMATTER
  ======================= */

  const budgetDisplay = (() => {
    if (!currentJob) return "Budget not specified";

    if (currentJob.budgetType === "hourly" && currentJob.hourlyRate) {
      return `$${currentJob.hourlyRate.min}–$${currentJob.hourlyRate.max}/hr`;
    }

    if (currentJob.budgetType === "hourly" && currentJob.budget?.min) {
      return `$${currentJob.budget.min}–$${currentJob.budget.max}/hr`;
    }

    if (currentJob.budgetType === "fixed" && currentJob.budget?.amount) {
      return `$${currentJob.budget.amount} Fixed`;
    }

    return "Budget not specified";
  })();

  const redFlags = currentJob?.aiAnalysis?.redFlags || currentJob?.redFlags || [];
  const aiAnalysisText = currentJob?.aiAnalysis?.reasoning || currentJob?.aiAnalysis || '';
  const matchScore = currentJob?.aiAnalysis?.matchScore || null;
  const recommendation = currentJob?.aiAnalysis?.recommendation || null;
  const greenFlags = currentJob?.aiAnalysis?.greenFlags || [];

  /* =======================
     UI
  ======================= */

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="text-center text-gray-300 mb-6">
        Job {currentJobIndex + 1} of {totalJobs}
      </div>

      <div className="max-w-xl mx-auto grid md:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="bg-gray-800 p-6 rounded-lg border-2 border-green-400">
          <h2 className="text-2xl font-bold text-white mb-4">
            {currentJob.title}
          </h2>

          <div className="bg-lime-400 text-gray-900 px-4 py-2 rounded-lg inline-block mb-4 font-bold">
            {budgetDisplay}
          </div>

          {matchScore && (
            <div className="bg-gray-700 text-lime-400 px-3 py-2 rounded-lg mb-4 font-semibold">
              Match Score: {matchScore}/100 {recommendation && `• ${recommendation}`}
            </div>
          )}

          {redFlags.length > 0 && (
            <div className="bg-orange-600 text-white px-3 py-2 rounded-lg mb-4 flex gap-2">
              <AlertTriangle size={18} />
              {redFlags.length} Red Flag{redFlags.length > 1 ? 's' : ''}: {redFlags.join(', ')}
            </div>
          )}

          {greenFlags.length > 0 && (
            <div className="bg-green-800 text-green-200 px-3 py-2 rounded-lg mb-4 text-sm">
              {greenFlags.join(' • ')}
            </div>
          )}

          <p className="text-gray-300 mb-6">
            {currentJob.description}
          </p>

          <a
            href={currentJob.upworkUrl || currentJob.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 underline flex items-center gap-2 mb-6"
          >
            View on Upwork <ExternalLink size={16} />
          </a>

          <div className="flex gap-4">
            <button
              onClick={handleDismatch}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg"
            >
              Dismatch
            </button>
            <button
              onClick={handleMatch}
              className="flex-1 bg-green-400 text-gray-900 py-3 rounded-lg"
            >
              Match
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-green-400 font-semibold mb-4">
            AI Analysis
          </h3>

          <p className="text-gray-300">
            {typeof aiAnalysisText === 'string' ? aiAnalysisText : JSON.stringify(aiAnalysisText)}
          </p>

          {currentJob?.clientInfo && (
            <div className="mt-4 text-sm space-y-1">
              <h4 className="text-lime-400 font-semibold mb-2">Client Info</h4>
              {currentJob.clientInfo.rating && <p className="text-gray-300">Rating: {currentJob.clientInfo.rating}</p>}
              {currentJob.clientInfo.totalSpent && <p className="text-gray-300">Total Spent: ${currentJob.clientInfo.totalSpent?.toLocaleString()}</p>}
              {currentJob.clientInfo.country && <p className="text-gray-300">Country: {currentJob.clientInfo.country}</p>}
              <p className="text-gray-300">Payment: {currentJob.clientInfo.paymentVerified ? '✅ Verified' : '❌ Not Verified'}</p>
            </div>
          )}

          <div className="mt-6 text-sm">
            <h4 className="text-lime-400 font-semibold mb-2">
              Your Criteria
            </h4>
            <p className="text-gray-300">
              Keywords: {(formData?.keywords || []).join(", ") || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* REASON MODAL */}
      <ReasonModal
        isOpen={showReasonModel}
        onClose={closeReasonModel}
        reason={reason}
        setReason={setReason}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default JobResultPage;
