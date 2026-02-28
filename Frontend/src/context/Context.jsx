import React, { createContext, useState, useEffect } from "react";
import { jobAPI, proposalAPI, paymentAPI } from "../utils/api";

export const AppContext = createContext(null);

export const ContextProvider = ({ children }) => {
  /* =========================
     Step Control
  ========================== */
  const [steps, setSteps] = useState(1);

  const nextStep = () => setSteps((prev) => Math.min(prev + 1, 6));
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
    keywords: [],
    hourlyRate: "",
    fixedRate: "",
    badJobCriteria: [],
    accountType: "",
    profileUrl: "",
  });

  const resetForm = () => {
    setSteps(1);
    setFormData({
      keywords: [],
      hourlyRate: "",
      fixedRate: "",
      badJobCriteria: [],
      accountType: "",
      profileUrl: "",
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
    try {
      const result = await paymentAPI.getCoinBalance();
      if (result.success) {
        const coins = result.data?.data?.coins || 0;
        setCoinBalance(coins);
        // Sync user object with latest coin balance
        setUser((prev) => {
          if (!prev) return prev;
          const updatedUser = { ...prev, coins };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
      return result;
    } catch (err) {
      return { success: false, error: { message: err.message } };
    }
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
  const [dashboardJobs, setDashboardJobs] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [jobSearching, setJobSearching] = useState(false);

  // Search jobs with AI analysis
  const searchJobsWithAI = async (keywords, filters = {}) => {
    setJobSearching(true);
    setError(null);
    try {
      const result = await jobAPI.searchJobsWithAI(keywords, filters);
      if (result.success) {
        setJobResults(result.data?.data?.jobs || []);
        return result;
      } else {
        setError(result.error?.message || "Failed to search jobs");
        return result;
      }
    } catch (err) {
      setError(err.message || "Failed to search jobs");
      return { success: false, error: { message: err.message } };
    } finally {
      setJobSearching(false);
    }
  };

  // Search jobs (basic, non-blocking)
  const searchJobs = async (keywords, filters = {}) => {
    setJobSearching(true);
    setError(null);
    try {
      const result = await jobAPI.searchJobs(keywords, filters);
      if (result.success) {
        return result;
      } else {
        setError(result.error?.message || "Failed to search jobs");
        return result;
      }
    } catch (err) {
      setError(err.message || "Failed to search jobs");
      return { success: false, error: { message: err.message } };
    } finally {
      setJobSearching(false);
    }
  };

  // Fetch filtered/cached jobs for dashboard
  const fetchDashboardJobs = async ({ page = 1, limit = 20, status = 'pending' } = {}) => {
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
        setJobResults((prev) =>
          prev.map((j) =>
            (j._id || j.id) === jobId ? { ...j, matchStatus: "matched" } : j
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
        setJobResults((prev) =>
          prev.map((j) =>
            (j._id || j.id) === jobId ? { ...j, matchStatus: "rejected" } : j
          )
        );
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: { message: err.message } };
    }
  };

  /* =========================
     Proposal State
  ========================== */
  const [proposals, setProposals] = useState([]);
  const [proposalStats, setProposalStats] = useState(null);
  const [currentProposal, setCurrentProposal] = useState(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  // Generate proposal for a job
  const generateProposal = async (jobId, aiService = 'openai') => {
    setProposalLoading(true);
    try {
      const result = await proposalAPI.generateProposal(jobId, aiService);
      if (result.success) {
        setCurrentProposal(result.data?.data || null);
        return result;
      } else {
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
  const pollProposal = async (proposalId, maxAttempts = 10, interval = 2000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await proposalAPI.getProposal(proposalId);
      if (result.success) {
        const proposal = result.data?.data;
        if (proposal?.content && proposal.content !== '' && !proposal.content.startsWith('Error')) {
          setCurrentProposal(proposal);
          return result;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
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
        dashboardJobs,
        dashboardLoading,
        jobSearching,
        searchJobsWithAI,
        searchJobs,
        fetchDashboardJobs,
        matchJob,
        rejectJob,

        /* Proposals */
        proposals,
        proposalStats,
        currentProposal,
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