import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppContext } from '../context/Context';
import { jobAPI } from '../services/jobService';
import JobDetails from '../components/jobs/JobDetail';
import JobResponseGenerator from '../components/jobs/JobResponseGenerator';

const ProposalGeneratorPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { jobResults, removeJobFromResults } = useContext(AppContext);

  const [job, setJob] = useState(() => location.state?.job || null);
  const [aiService, setAiService] = useState('gemini');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  const resolvedJobId = useMemo(
    () => job?._id || job?.id || jobId || null,
    [job, jobId]
  );

  const getJobIdentifier = () =>
    job?._id || job?.id || job?.upworkJobId || job?.freelancerJobId || job?.sourceJobId || resolvedJobId;

  const handleBackToResults = () => {
    const jobIdentifier = getJobIdentifier();
    if (jobIdentifier) {
      removeJobFromResults(jobIdentifier);
    }
    setShowGenerator(false);
    navigate('/job-result', { replace: true });
  };

  useEffect(() => {
    if (job) return;

    const fromResults = (jobResults || []).find(candidate => {
      const ids = [
        candidate?._id,
        candidate?.id,
        candidate?.upworkJobId,
        candidate?.freelancerJobId,
        candidate?.sourceJobId,
      ]
        .filter(Boolean)
        .map(String);

      return resolvedJobId ? ids.includes(String(resolvedJobId)) : false;
    });

    if (fromResults) {
      setJob(fromResults);
      return;
    }

    if (!resolvedJobId) return;

    let isActive = true;
    const loadJob = async () => {
      setLoading(true);
      setLoadError('');
      const result = await jobAPI.getJobDetail(resolvedJobId);
      if (!isActive) return;

      if (result.success) {
        setJob(result.data?.data || null);
      } else {
        setLoadError(result.error?.message || 'Failed to load job details');
      }
      setLoading(false);
    };

    loadJob();

    return () => {
      isActive = false;
    };
  }, [job, jobResults, resolvedJobId]);

  if (showGenerator && job) {
    return (
      <JobResponseGenerator
        job={job}
        aiService={aiService}
        onBack={handleBackToResults}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate('/job-result')}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back to results
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Select AI service for this proposal
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center text-gray-600 dark:text-gray-300">
            Loading job details...
          </div>
        )}

        {loadError && !loading && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-700 rounded-2xl p-6 text-center text-red-700 dark:text-red-300 mb-6">
            {loadError}
          </div>
        )}

        {!loading && job && (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6 xl:gap-8 items-start">
            <JobDetails job={job} />

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-7 shadow-sm transition-colors">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Generate Proposal
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Choose your preferred AI engine and generate a tailored bid using the job details.
              </p>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                AI Service
              </label>
              <select
                value={aiService}
                onChange={event => setAiService(event.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
              >
                <option value="gemini">Gemini (2.5 Flash)</option>
                <option value="openai">OpenAI (GPT-4 Turbo)</option>
              </select>

              <button
                onClick={() => setShowGenerator(true)}
                className="w-full mt-6 bg-lime-400 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-lime-300 transition-colors"
              >
                Generate Proposal
              </button>

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                You can switch AI services before generating if you want a different tone or style.
              </p>
            </div>
          </div>
        )}

        {!loading && !job && !loadError && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center text-gray-600 dark:text-gray-300">
            No job selected. Return to the results list and choose a job to generate a proposal.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalGeneratorPage;
