import React, { useState, useContext, useEffect } from "react";
import JobResponseGenerator from "../components/jobs/JobResponseGenerator";
import ReasonModal from "../components/models/ReasonModal";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/Context";

const extractSkillsFromDescription = (description) => {
  if (typeof description !== "string" || !description.trim()) return [];

  const skills = [];

  const inlinePattern =
    /(?:required\s*skills?|skills\s*required|tech\s*stack|requirements?)\s*:\s*([^\n]+)/gi;
  for (const match of description.matchAll(inlinePattern)) {
    const raw = match[1] || "";
    raw
      .split(/,|\||\/|•|;/)
      .map((item) =>
        item
          .trim()
          .replace(/^[-*\d.)\s]+/, "")
          .replace(/[.,;:]+$/, "")
      )
      .filter(Boolean)
      .forEach((item) => skills.push(item));
  }

  const blockPattern =
    /(?:required\s*skills?|skills\s*required|requirements?)\s*:?\s*\n((?:\s*[-*•]\s*[^\n]+\n?){1,10})/gi;
  for (const match of description.matchAll(blockPattern)) {
    const rawBlock = match[1] || "";
    rawBlock
      .split("\n")
      .map((line) =>
        line
          .trim()
          .replace(/^[-*•\d.)\s]+/, "")
          .replace(/[.,;:]+$/, "")
      )
      .filter(Boolean)
      .forEach((item) => skills.push(item));
  }

  const uniqueSkills = [];
  const seen = new Set();

  for (const skill of skills) {
    const normalized = skill.toLowerCase();
    if (!seen.has(normalized) && skill.length <= 60) {
      seen.add(normalized);
      uniqueSkills.push(skill);
    }
  }

  return uniqueSkills.slice(0, 12);
};

const getJobIdentifier = (job) => {
  return job?._id || job?.id || job?.upworkJobId || job?.sourceJobId || null;
};

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
    translateJobDescription,
  } = useContext(AppContext);

  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showReasonModel, setShowReasonModel] = useState(false);
  const [reason, setReason] = useState("");
  const [showJobResponse, setShowJobResponse] = useState(false);
  const [isTranslatingDescription, setIsTranslatingDescription] = useState(false);
  const [translationNotice, setTranslationNotice] = useState("");

  const jobs = (jobResults || []).filter(job => {
    const status = job?.matchStatus || job?.status || 'pending';
    return status !== 'rejected';
  });
  const totalJobs = jobs.length;
  const currentJob = jobs[currentJobIndex];

  useEffect(() => {
    if (jobs.length === 0) {
      if (currentJobIndex !== 0) {
        setCurrentJobIndex(0);
      }
      return;
    }

    if (currentJobIndex > jobs.length - 1) {
      setCurrentJobIndex(jobs.length - 1);
    }
  }, [jobs.length, currentJobIndex]);

  useEffect(() => {
    setTranslationNotice('');
    setIsTranslatingDescription(false);
  }, [currentJobIndex]);

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

    const jobId = getJobIdentifier(currentJob);
    if (!jobId) {
      alert('Unable to reject this job because job id is missing. Please refresh and search again.');
      return;
    }

    const result = await rejectJob(jobId, reason);
    if (!result?.success) {
      alert(result?.error?.message || 'Failed to reject job. Please try again.');
      return;
    }

    closeReasonModel();
  };

  const handleMatch = async () => {
    const jobId = getJobIdentifier(currentJob);
    if (jobId) {
      await matchJob(jobId);
    }

    setShowJobResponse(true);
  };

  const handleTranslateDescription = async () => {
    const jobId = getJobIdentifier(currentJob);
    const targetLanguage = formData?.selectedLanguage || 'English';

    if (!jobId || !targetLanguage) return;

    setIsTranslatingDescription(true);
    setTranslationNotice('');

    const result = await translateJobDescription(jobId, targetLanguage, {
      aiService: 'gemini',
    });

    if (result?.success) {
      const translation = result.data?.data?.translation;
      if (translation?.isTranslated) {
        setTranslationNotice(
          `Description translated from ${translation.sourceLanguage || 'detected language'} to ${translation.targetLanguage}.`
        );
      } else {
        setTranslationNotice(
          `Description is already in ${translation?.targetLanguage || targetLanguage}.`
        );
      }
    } else {
      setTranslationNotice(result?.error?.message || 'Failed to translate description.');
    }

    setIsTranslatingDescription(false);
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
  const displayedDescription =
    currentJob?.translatedDescription || currentJob?.description;
  const explicitSkills = Array.isArray(currentJob?.skills) ? currentJob.skills : [];
  const descriptionSkills = extractSkillsFromDescription(displayedDescription);
  const requiredSkills =
    explicitSkills.length > 0 ? explicitSkills : descriptionSkills;
  const showTranslateButton =
    sourceLabel === 'Freelancer' && Boolean(formData?.selectedLanguage);

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <h3 className="text-gray-900 dark:text-white font-semibold">Description</h3>

              {showTranslateButton && (
                <button
                  onClick={handleTranslateDescription}
                  disabled={isTranslatingDescription}
                  className="text-sm px-3 py-1.5 rounded-lg border border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isTranslatingDescription
                    ? 'Translating...'
                    : `Translate to ${formData.selectedLanguage}`}
                </button>
              )}
            </div>

            {(translationNotice || currentJob?.descriptionLanguage) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {translationNotice ||
                  `Detected language: ${currentJob?.descriptionLanguage || 'Unknown'}${currentJob?.translatedDescriptionLanguage ? ` • Target: ${currentJob.translatedDescriptionLanguage}` : ''}`}
              </p>
            )}

            <div className="max-h-72 overflow-y-auto pr-2">
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {displayedDescription}
              </p>
            </div>
          </div>

          <div className="mb-7">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Required Skills</h3>
            {requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Required skills are not specified for this job.
              </p>
            )}
          </div>

          <a
            href={currentJob.upworkUrl || currentJob.url || '#'}
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
            <button
              onClick={handleMatch}
              className="flex-1 bg-green-400 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-green-300 transition-colors"
            >
              {sourceLabel === 'Freelancer' ? 'Prepare Bid Proposal' : 'Match'}
            </button>
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

          {currentJob?.clientInfo && (
            <div className="mt-6 text-base sm:text-lg space-y-2">
              <h4 className="text-lime-700 dark:text-lime-400 font-semibold mb-2 text-xl">Client Info</h4>
              {currentJob.clientInfo.rating && <p className="text-gray-700 dark:text-gray-300">Rating: {currentJob.clientInfo.rating}</p>}
              {currentJob.clientInfo.totalSpent && <p className="text-gray-700 dark:text-gray-300">Total Spent: ${currentJob.clientInfo.totalSpent?.toLocaleString()}</p>}
              {currentJob.clientInfo.country && <p className="text-gray-700 dark:text-gray-300">Country: {currentJob.clientInfo.country}</p>}
              <p className="text-gray-700 dark:text-gray-300">Payment: {currentJob.clientInfo.paymentVerified ? '✅ Verified' : '❌ Not Verified'}</p>
            </div>
          )}

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
