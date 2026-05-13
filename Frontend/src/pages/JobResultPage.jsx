import React, { useState, useContext, useEffect } from "react";
import JobResponseGenerator from "../components/jobs/JobResponseGenerator";
import ReasonModal from "../components/models/ReasonModal";
import { ExternalLink, AlertTriangle, Globe } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/Context";
import { jobAPI } from "../services/jobService";

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
    removeJobFromResults,
    translateJobDescription,
  } = useContext(AppContext);

  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showReasonModel, setShowReasonModel] = useState(false);
  const [reason, setReason] = useState("");
  const [showJobResponse, setShowJobResponse] = useState(false);
  const { jobId: routeJobId } = useParams();
  const [routeJob, setRouteJob] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  const jobs = jobResults || [];
  const totalJobs = jobs.length;

  // If a route param is present, prefer that job (either from cache or fetched)
  const currentJob = routeJob || jobs[currentJobIndex];

  useEffect(() => {
    if (totalJobs === 0) return;
    if (currentJobIndex >= totalJobs) {
      setCurrentJobIndex(totalJobs - 1);
    }
  }, [currentJobIndex, totalJobs]);

  // Load job when a route param is present (e.g. /job-result/:jobId)
  useEffect(() => {
    let active = true;
    const loadRouteJob = async () => {
      if (!routeJobId) return;
      // Try to find in cached results first
      const found = (jobs || []).find((j) => {
        const ids = [j?._id, j?.id, j?.upworkJobId, j?.freelancerJobId, j?.sourceJobId]
          .filter(Boolean)
          .map(String);
        return ids.includes(String(routeJobId));
      });

      if (found) {
        setRouteJob(found);
        return;
      }

      setRouteLoading(true);
      setRouteError('');
      try {
        const resp = await jobAPI.getJobDetail(routeJobId);
        if (resp.success) {
          if (!active) return;
          // Backend returns { success, data: { data: job } }
          const jobData = resp.data?.data;
          if (jobData) {
            setRouteJob(jobData);
          } else {
            setRouteError('No job data in response');
          }
        } else {
          setRouteError(resp.error?.message || 'Failed to load job details');
        }
      } catch (err) {
        setRouteError(err.message || 'Failed to load job details');
      } finally {
        setRouteLoading(false);
      }
    };

    loadRouteJob();
    return () => {
      active = false;
    };
  }, [routeJobId, jobs]);

  const getJobId = job =>
    job?._id || job?.id || job?.upworkJobId || job?.freelancerJobId || job?.sourceJobId;

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

    const jobId = getJobId(currentJob);
    if (jobId) {
      await rejectJob(jobId, reason, currentJob);
    }

    moveToNextJob();
    closeReasonModel();
  };

  const handleMatch = async () => {
    const jobId = getJobId(currentJob);
    if (jobId) {
      await matchJob(jobId, currentJob);
    }

    setShowJobResponse(true);
  };

  const handleBackToResults = () => {
    const jobId = getJobId(currentJob);
    if (jobId) {
      removeJobFromResults(jobId);
    }
    setShowJobResponse(false);
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
        onBack={handleBackToResults}
      />
    );
  }

  /* =======================
     LOADING STATE (Route Job)
  ======================= */

  if (routeJobId && routeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center max-w-2xl px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Loading job...</h2>
        </div>
      </div>
    );
  }

  /* =======================
     ERROR STATE (Route Job)
  ======================= */

  if (routeJobId && routeError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center max-w-2xl px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Error Loading Job</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{routeError}</p>
          <button
            onClick={() => navigate('/job-result')}
            className="bg-lime-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-lime-300 transition"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  /* =======================
     EMPTY / LOADING STATE
  ======================= */

  if (!currentJob) {
    const blockerDetected = jobDiagnostics?.page?.antiBotDetected;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center max-w-2xl px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {blockerDetected ? 'Job Search Blocked' : 'No Jobs Available'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Search for jobs first to see results here.'}
          </p>

          {jobDiagnostics && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left mb-6 text-sm">
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Source: <span className="text-gray-900 dark:text-white">{jobDiagnostics.source || 'unknown'}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Page title: <span className="text-gray-900 dark:text-white">{jobDiagnostics.page?.title || 'N/A'}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Anti-bot detected: <span className="text-gray-900 dark:text-white">{jobDiagnostics.page?.antiBotDetected ? 'Yes' : 'No'}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                DOM candidates: <span className="text-gray-900 dark:text-white">{jobDiagnostics.extraction?.domCandidates ?? 0}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Embedded candidates: <span className="text-gray-900 dark:text-white">{jobDiagnostics.extraction?.embeddedCandidates ?? 0}</span>
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
  const sourceLabel = currentJob?.source === 'freelancer_api' ? 'Freelancer' : 'Upwork';
  const selectedPlatform = String(formData?.selectedPlatform || '').toLowerCase();
  const isFreelancerJob =
    selectedPlatform === 'freelancer' || currentJob?.source === 'freelancer_api';
  const clientInfo = currentJob?.clientInfo || {};
  const jobsPosted = Number.isFinite(Number(clientInfo.jobsPosted))
    ? Number(clientInfo.jobsPosted)
    : 0;
  const paymentVerified = Boolean(clientInfo.paymentVerified);
  const totalReviews = Number.isFinite(Number(clientInfo.totalReviews))
    ? Number(clientInfo.totalReviews)
    : 0;
  const rating = Number.isFinite(Number(clientInfo.rating))
    ? Number(clientInfo.rating)
    : 0;
  const totalSpent = Number.isFinite(Number(clientInfo.totalSpent))
    ? Number(clientInfo.totalSpent)
    : 0;
  const hireRate = Number.isFinite(Number(clientInfo.hireRate))
    ? Number(clientInfo.hireRate)
    : 0;
  const country = String(clientInfo.country || '').trim() || 'Unknown';

  const handleFreelancerNext = async () => {
    const jobId = getJobId(currentJob);

    if (jobId) {
      await matchJob(jobId, currentJob);
      navigate(`/job-result/${jobId}/proposal`, {
        state: { job: currentJob },
      });
    }
  };

  /* =======================
     UI
  ======================= */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="text-center text-gray-600 dark:text-gray-300 mb-8">
        Job {currentJobIndex + 1} of {totalJobs}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 xl:gap-8 items-start">
        {/* LEFT PANEL */}
        <div className="w-full bg-white dark:bg-gray-800 p-5 sm:p-7 rounded-2xl border-2 border-green-500 dark:border-green-400 shadow-sm transition-colors">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-5 leading-tight">
            {currentJob.title}
          </h2>

          <div className="bg-lime-400 text-gray-900 px-4 py-2 rounded-lg inline-block mb-5 font-bold text-lg">
            {budgetDisplay}
          </div>

          {matchScore && (
            <div className="bg-lime-50 dark:bg-gray-700 border border-lime-200 dark:border-gray-600 text-lime-700 dark:text-lime-400 px-4 py-3 rounded-lg mb-4 font-semibold text-lg sm:text-xl">
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

          <div className="mb-7">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Description</h3>
            <div className="max-h-72 overflow-y-auto pr-2">
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {currentJob.translatedDescription || currentJob.description}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Show translate button - always available for manual translation */}
            {!currentJob?.translatedDescription && (
              <button
                onClick={async () => {
                  const jobId = getJobId(currentJob);
                  if (!jobId) {
                    alert('Job ID not found. Please refresh the page and try again.');
                    console.error('Unable to get job ID from:', currentJob);
                    return;
                  }
                  try {
                    await translateJobDescription(jobId, 'English', { jobData: currentJob });
                  } catch (err) {
                    console.error('Translation error:', err);
                    alert('Translation failed: ' + (err.message || 'Unknown error'));
                  }
                }}
                className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                title="Translate job description to English using AI"
              >
                <Globe size={16} />
                Translate to English
              </button>
            )}

            {/* Show if already translated */}
            {currentJob?.translatedDescription && (
              <span className="flex items-center gap-2 text-sm bg-green-600/20 text-green-400 px-4 py-2 rounded-lg border border-green-600/30">
                <Globe size={16} />
                Translated to English
              </span>
            )}
          </div>

          <a
            href={
              currentJob?.source === 'freelancer_api'
                ? currentJob.freelancerUrl || currentJob.upworkUrl || currentJob.url || '#'
                : currentJob.upworkUrl || currentJob.url || '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 dark:text-green-400 underline flex items-center gap-2 mb-7 text-base sm:text-lg"
          >
            View on {sourceLabel} <ExternalLink size={16} />
          </a>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleDismatch}
              className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 transition-colors"
            >
              Dismatch
            </button>
            {isFreelancerJob ? (
              <button
                onClick={handleFreelancerNext}
                className="flex-1 bg-green-400 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-green-300 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleMatch}
                className="flex-1 bg-green-400 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-green-300 transition-colors"
              >
                Match
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full bg-white dark:bg-gray-800 p-5 sm:p-7 rounded-2xl shadow-sm transition-colors">
          <h3 className="text-green-700 dark:text-green-400 font-semibold mb-5 text-2xl">
            AI Analysis
          </h3>

          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {typeof aiAnalysisText === 'string' ? aiAnalysisText : JSON.stringify(aiAnalysisText)}
          </p>

          <div className="mt-6 text-base sm:text-lg space-y-2">
            <h4 className="text-lime-700 dark:text-lime-400 font-semibold mb-2 text-xl">Client Info</h4>
            <p className="text-gray-700 dark:text-gray-300">Posted jobs: {jobsPosted}</p>
            <p className="text-gray-700 dark:text-gray-300">
              Payment:{' '}
              <span className={paymentVerified ? 'text-green-400' : 'text-red-400'}>
                {paymentVerified ? 'VERIFIED' : 'NOT VERIFIED'}
              </span>
            </p>
            <p className="text-gray-700 dark:text-gray-300">Reviews: {totalReviews}</p>
            <p className="text-gray-700 dark:text-gray-300">Rating: {rating}</p>
            <p className="text-gray-700 dark:text-gray-300">Total spent: ${totalSpent.toLocaleString()}</p>
            <p className="text-gray-700 dark:text-gray-300">Hire rate: {hireRate}%</p>
            <p className="text-gray-700 dark:text-gray-300">Country: {country}</p>
          </div>

          <div className="mt-7 text-base sm:text-lg">
            <h4 className="text-lime-700 dark:text-lime-400 font-semibold mb-2 text-xl">
              Your Criteria
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
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
