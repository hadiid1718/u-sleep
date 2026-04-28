import React, { createContext, useState, useEffect } from "react";
import { jobAPI } from '../services/jobService';
import { proposalAPI } from '../services/proposalService';

export const AppContext = createContext(null);

export const ContextProvider = ({ children }) => {
  /* =========================
     Step Control
  ========================== */
  const [steps, setSteps] = useState(1);

  const nextStep = () => setSteps((prev) => Math.min(prev + 1, 7));
  const prevStep = () => setSteps((prev) => Math.max(prev - 1, 1));

  /* =========================
     Auth State (SINGLE SOURCE)
  ========================== */
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  // Login function to update both localStorage and state
  const login = (userData, token) => {
    try {
      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      
      // Update state - this will trigger Header re-render
      setUser(userData);
    } catch (error) {
      console.error("Error during login:", error);
      setError("Failed to save login data");
    }
  };

  // Enhanced logout with optional API call
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Optional: Call logout API if you have one
      if (token && window.summaryApi?.logout) {
        try {
          await fetch(window.summaryApi.logout.url, {
            method: window.summaryApi.logout.method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (apiError) {
          console.error("Logout API error:", apiError);
          // Continue with local logout even if API fails
        }
      }
    } finally {
      // Always clear local storage and state
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  /* =========================
     Form Data (Non-job)
  ========================== */
  const [formData, setFormData] = useState({
    selectedPlatform: 'upwork',
    keywords: [],
    hourlyRate: "",
    fixedRate: "",
    badJobCriteria: [],
    accountType: "",
    profileUrl: "",
    selectedLanguage: 'English',
    autoTranslateDescription: false,
  });

  const resetForm = () => {
    setSteps(1);
    setFormData({
      selectedPlatform: 'upwork',
      keywords: [],
      hourlyRate: "",
      fixedRate: "",
      badJobCriteria: [],
      accountType: "",
      profileUrl: "",
      selectedLanguage: 'English',
      autoTranslateDescription: false,
    });
  };

  /* =========================
     Global UI State
  ========================== */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coinBalance, setCoinBalance] = useState(0);

  // Fetch coin balance from API and sync with user
  const fetchCoinBalance = async () => {
    const coins = user?.coins || 0;
    setCoinBalance(coins);
    return { success: true, data: { data: { coins } } };
  };

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /* =========================
     Job State
  ========================== */
  const [jobResults, setJobResults] = useState([]);
  const [jobDiagnostics, setJobDiagnostics] = useState(null);
  const [freelancerWorkflow, setFreelancerWorkflow] = useState(null);
  const [dashboardJobs, setDashboardJobs] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [jobSearching, setJobSearching] = useState(false);

  const getJobIdentifiers = (job) => {
    return [job?._id, job?.id, job?.upworkJobId, job?.sourceJobId]
      .filter(Boolean)
      .map(String);
  };

  const isSameJob = (job, jobIdentifier, updatedJob = null) => {
    const targetIds = [jobIdentifier, ...getJobIdentifiers(updatedJob)]
      .filter(Boolean)
      .map(String);

    if (targetIds.length === 0) return false;

    const currentIds = getJobIdentifiers(job);
    return targetIds.some((id) => currentIds.includes(id));
  };

  const getJobErrorMessage = (result, fallbackMessage) => {
    const diagnostics = result?.error?.details?.diagnostics;
    const code = result?.error?.details?.code;

    if (code === 'SCRAPER_BLOCKED' || diagnostics?.page?.antiBotDetected) {
      return 'Job search is currently blocked by Upwork protection. Please try again later.';
    }

    if (code === 'UPWORK_AUTH_MISSING') {
      return 'Upwork API credentials are missing. Please contact support.';
    }

    if (code === 'UPWORK_API_ERROR') {
      return 'Upwork API request failed. Please try again shortly.';
    }

    if (code === 'UPWORK_EMPTY_RESULTS') {
      return 'No jobs found matching your criteria.';
    }

    if (code === 'FREELANCER_AUTH_MISSING') {
      return 'Freelancer OAuth is missing. Connect your Freelancer account first.';
    }

    if (code === 'FREELANCER_API_ERROR') {
      return 'Freelancer API request failed. Please try again shortly.';
    }

    if (code === 'FREELANCER_EMPTY_RESULTS') {
      return 'No Freelancer jobs found matching your criteria.';
    }

    return result?.error?.message || fallbackMessage;
  };

  // Search jobs with AI analysis
  const searchJobsWithAI = async (payloadOrKeywords, filters = {}) => {
    setJobSearching(true);
    setError(null);
    setJobDiagnostics(null);
    try {
      const result = await jobAPI.searchJobsWithAI(payloadOrKeywords, filters);
      if (result.success) {
        setJobResults(result.data?.data?.jobs || []);
        setJobDiagnostics(result.data?.data?.diagnostics || null);
        setFreelancerWorkflow(result.data?.data?.workflow || null);

        if ((result.data?.data?.jobs || []).length === 0) {
          setError(result.data?.data?.message || 'No jobs found matching your criteria');
        }

        return result;
      } else {
        setJobResults([]);
        setJobDiagnostics(result.error?.details?.diagnostics || null);
        setFreelancerWorkflow(null);
        setError(getJobErrorMessage(result, 'Failed to search jobs'));
        return result;
      }
    } catch (err) {
      setJobResults([]);
      setError(err.message || "Failed to search jobs");
      return { success: false, error: { message: err.message } };
    } finally {
      setJobSearching(false);
    }
  };

  // Search jobs (basic, non-blocking)
  const searchJobs = async (payloadOrKeywords, filters = {}) => {
    setJobSearching(true);
    setError(null);
    setJobDiagnostics(null);
    try {
      const result = await jobAPI.searchJobs(payloadOrKeywords, filters);
      if (result.success) {
        setJobResults(result.data?.data?.jobs || []);
        setJobDiagnostics(result.data?.data?.diagnostics || null);
        setFreelancerWorkflow(result.data?.data?.workflow || null);

        if ((result.data?.data?.jobs || []).length === 0) {
          setError(result.data?.data?.message || 'No jobs found matching your criteria');
        }

        return result;
      } else {
        setJobResults([]);
        setJobDiagnostics(result.error?.details?.diagnostics || null);
        setFreelancerWorkflow(null);
        setError(getJobErrorMessage(result, 'Failed to search jobs'));
        return result;
      }
    } catch (err) {
      setJobResults([]);
      setError(err.message || "Failed to search jobs");
      return { success: false, error: { message: err.message } };
    } finally {
      setJobSearching(false);
    }
  };

  // Fetch filtered/cached jobs for dashboard
  const fetchDashboardJobs = async ({ page = 1, limit = 20, status = 'all' } = {}) => {
    setDashboardLoading(true);
    try {
      const result = await jobAPI.getFilteredJobs({ page, limit, status });
      if (result.success) {
        setDashboardJobs(result.data?.data?.jobs || []);
        return result;
      } else {
        setError(result.error?.message || "Failed to load jobs");
        return result;
      }
    } catch (err) {
      setError(err.message || "Failed to load jobs");
      return { success: false, error: { message: err.message } };
    } finally {
      setDashboardLoading(false);
    }
  };

  // Match a job
  const matchJob = async (jobId) => {
    try {
      const result = await jobAPI.markJobAsMatched(jobId);
      if (result.success) {
        const updatedJob = result.data?.data;
        setJobResults((prev) =>
          prev.map((j) =>
            isSameJob(j, jobId, updatedJob)
              ? { ...j, ...(updatedJob || {}), matchStatus: "matched" }
              : j
          )
        );
        setDashboardJobs((prev) =>
          prev.map((j) =>
            isSameJob(j, jobId, updatedJob)
              ? { ...j, ...(updatedJob || {}), matchStatus: "matched" }
              : j
          )
        );
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: { message: err.message } };
    }
  };

  // Reject a job
  const rejectJob = async (jobId, reason = "") => {
    try {
      const result = await jobAPI.markJobAsRejected(jobId, reason);
      if (result.success) {
        const updatedJob = result.data?.data;
        setJobResults((prev) =>
          prev.map((j) =>
            isSameJob(j, jobId, updatedJob)
              ? { ...j, ...(updatedJob || {}), matchStatus: "rejected" }
              : j
          )
        );
        setDashboardJobs((prev) =>
          prev.map((j) =>
            isSameJob(j, jobId, updatedJob)
              ? { ...j, ...(updatedJob || {}), matchStatus: "rejected" }
              : j
          )
        );
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: { message: err.message } };
    }
  };

  const translateJobDescription = async (
    jobId,
    targetLanguage,
    { aiService = 'gemini' } = {}
  ) => {
    try {
      const result = await jobAPI.translateJobDescription(jobId, targetLanguage, {
        aiService,
      });

      if (result.success) {
        const updatedJob = result.data?.data?.job;
        const updatedJobId =
          updatedJob?._id ||
          updatedJob?.id ||
          updatedJob?.upworkJobId ||
          updatedJob?.sourceJobId;

        if (updatedJobId) {
          setJobResults(prev =>
            prev.map(job =>
              isSameJob(job, updatedJobId, updatedJob) ? updatedJob : job
            )
          );

          setDashboardJobs(prev =>
            prev.map(job =>
              isSameJob(job, updatedJobId, updatedJob) ? updatedJob : job
            )
          );
        }
      } else {
        setError(result.error?.message || 'Failed to translate description');
      }

      return result;
    } catch (err) {
      setError(err.message || 'Failed to translate description');
      return { success: false, error: { message: err.message } };
    }
  };

  /* =========================
     Proposal State
  ========================== */
  const [proposals, setProposals] = useState([]);
  const [proposalStats, setProposalStats] = useState(null);
  const [currentProposal, setCurrentProposal] = useState(null);
  const [freelancerProposalWorkflow, setFreelancerProposalWorkflow] =
    useState(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  // Generate proposal for a job
  const generateProposal = async (jobId, aiService = 'openai') => {
    setProposalLoading(true);
    try {
      const result = await proposalAPI.generateProposal(jobId, aiService);
      if (result.success) {
        setCurrentProposal(result.data?.data || null);
        setFreelancerProposalWorkflow(result.data?.data?.workflow || null);
        return result;
      } else {
        setFreelancerProposalWorkflow(null);
        setError(result.error?.message || "Failed to generate proposal");
        return result;
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: { message: err.message } };
    } finally {
      setProposalLoading(false);
    }
  };

  // Poll for proposal content (since generation is async)
  const pollProposal = async (proposalId, maxAttempts = 20, interval = 3000) => {
    let latestProposal = null;

    for (let i = 0; i < maxAttempts; i++) {
      const result = await proposalAPI.getProposal(proposalId);
      if (result.success) {
        const proposal = result.data?.data;
        latestProposal = proposal;

        if (proposal?.content && proposal.content !== '') {
          setCurrentProposal(proposal);

          if (proposal?.aiModel === 'fallback-template') {
            return {
              success: true,
              data: { data: proposal },
              warning: {
                message: 'AI generation returned a fallback template.',
              },
            };
          }

          return result;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    const fallbackResponse =
      latestProposal?.defaultResponse ||
      currentProposal?.defaultResponse ||
      '';

    if (fallbackResponse) {
      const fallbackProposal = {
        ...(latestProposal || currentProposal || {}),
        content: fallbackResponse,
        aiModel: latestProposal?.aiModel || 'fallback-template',
      };

      setCurrentProposal(fallbackProposal);

      return {
        success: true,
        data: {
          data: fallbackProposal,
        },
        warning: {
          message: 'Proposal generation timed out and a fallback template was returned.',
        },
      };
    }

    return { success: false, error: { message: 'Proposal generation timed out' } };
  };

  // Fetch user proposals
  const fetchUserProposals = async (params = {}) => {
    setProposalLoading(true);
    try {
      const result = await proposalAPI.getUserProposals(params);
      if (result.success) {
        setProposals(result.data?.data?.proposals || []);
        return result;
      } else {
        setError(result.error?.message || "Failed to load proposals");
        return result;
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: { message: err.message } };
    } finally {
      setProposalLoading(false);
    }
  };

  // Fetch proposal stats
  const fetchProposalStats = async () => {
    try {
      const result = await proposalAPI.getProposalStats();
      if (result.success) {
        setProposalStats(result.data?.data || null);
      }
      return result;
    } catch (err) {
      return { success: false, error: { message: err.message } };
    }
  };

  useEffect(() => {
    const loadFreelancerWorkflow = async () => {
      if ((formData?.selectedPlatform || 'upwork') !== 'freelancer') {
        setFreelancerWorkflow(null);
        return;
      }

      const rateType =
        formData?.hourlyRate && !formData?.fixedRate
          ? 'hourly'
          : formData?.fixedRate && !formData?.hourlyRate
            ? 'fixed'
            : '';

      const response = await jobAPI.getFreelancerWorkflow({
        keywords: formData?.keywords || [],
        selectedRole: formData?.accountType || '',
        rateType,
      });

      if (response.success) {
        setFreelancerWorkflow(response.data?.data || null);
      }
    };

    loadFreelancerWorkflow();
  }, [
    formData?.selectedPlatform,
    formData?.accountType,
    formData?.hourlyRate,
    formData?.fixedRate,
    JSON.stringify(formData?.keywords || []),
  ]);

  return (
    <AppContext.Provider
      value={{
        /* Steps */
        steps,
        setSteps,
        nextStep,
        prevStep,

        /* Auth */
        user,
        setUser,
        login,
        userRole: user?.role || null,
        handleLogout,

        /* Form */
        formData,
        setFormData,
        resetForm,

        /* UI */
        loading,
        setLoading,
        error,
        setError,
        coinBalance,
        setCoinBalance,
        fetchCoinBalance,

        /* Jobs */
        jobResults,
        setJobResults,
        jobDiagnostics,
        setJobDiagnostics,
        freelancerWorkflow,
        dashboardJobs,
        dashboardLoading,
        jobSearching,
        searchJobsWithAI,
        searchJobs,
        fetchDashboardJobs,
        matchJob,
        rejectJob,
        translateJobDescription,

        /* Proposals */
        proposals,
        proposalStats,
        currentProposal,
        freelancerProposalWorkflow,
        proposalLoading,
        setCurrentProposal,
        generateProposal,
        pollProposal,
        fetchUserProposals,
        fetchProposalStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};