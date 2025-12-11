import React, { createContext, useState } from "react";

export const AppContext = createContext();

// API Base URLs
const API_BASE_URL = "http://localhost:8080/api";
const JOBS_API_URL = `${API_BASE_URL}/jobs`;
const USER_API_URL = `${API_BASE_URL}/user`;
const DASHBOARD_API_URL = `${API_BASE_URL}/dashboard`;

// 🔹 API Service
const jobAPI = {
  // 🔍 Search Jobs
  searchJobs: async (formData) => {
    try {
      console.log("📡 Calling API:", `${API_BASE_URL}/search`);
      console.log("📦 Sending data:", formData);

      // 🧠 Ensure proper JSON structure before sending
      const payload = {
        keywords: formData.keywords || [],
        hourlyRate: Number(formData.hourlyRate) || 0,
        fixedRate: Number(formData.fixedRate) || 0,
        badJobCriteria: formData.badJobCriteria || [],
        accountType: formData.accountType || "freelancer",
        profileUrl: formData.profileUrl || "",
      };

      const response = await fetch(`${API_BASE_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // ✅ proper header
        body: JSON.stringify(payload),
      });

      console.log("📨 Response status:", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      console.log("✅ Response data:", data);

      if (!data.success || !Array.isArray(data.jobs)) {
        throw new Error("Invalid response format from server.");
      }

      return data.jobs;
    } catch (error) {
      console.error("❌ Fetch error:", error);
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "Cannot connect to backend. Please ensure it’s running on http://localhost:8080"
        );
      }
      throw error;
    }
  },

  // 🤖 Analyze Job
  analyzeJob: async (jobData, userPreferences) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobData, userPreferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze job");
      }

      console.log("🧠 Analyze response:", data);
      return data;
    } catch (err) {
      console.error("❌ Analyze Job Error:", err);
      throw err;
    }
  },
};

//  Context Provider
export const ContextProvider = ({ children }) => {
  const [steps, setSteps] = useState(1);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [jobResults, setJobResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle login for both users and admin
  const handleLogin = async (credentials, isAdmin = false) => {
    try {
      const endpoint = isAdmin ? `${API_BASE_URL}/admin/login` : `${API_BASE_URL}/user/login`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Store user data and token
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };
  
  //  Form Data
  const [formData, setFormData] = useState({
    keywords: [],
    hourlyRate: "",
    fixedRate: "",
    badJobCriteria: [],
    accountType: "",
    profileUrl: "",
  });

  //  Step Control
  const nextStep = () => setSteps((prev) => Math.min(prev + 1, 6));
  const prevStep = () => setSteps((prev) => Math.max(prev - 1, 1));

  // Submit Function (calls backend)
  const handleSubmit = async (finalData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("🚀 Submitting form data:", finalData);

      //  Make sure `finalData` has valid JSON
      const formattedData = {
        keywords:
          typeof finalData.keywords === "string"
            ? finalData.keywords.split(",").map((k) => k.trim())
            : finalData.keywords || [],
        hourlyRate: Number(finalData.hourlyRate) || 0,
        fixedRate: Number(finalData.fixedRate) || 0,
        badJobCriteria: finalData.badJobCriteria || [],
        accountType: finalData.accountType || "freelancer",
        profileUrl: finalData.profileUrl || "",
      };

      const jobs = await jobAPI.searchJobs(formattedData);
      console.log(`✅ Received ${jobs.length} jobs`);
      
      if (!Array.isArray(jobs) || jobs.length === 0) {
        throw new Error("No jobs found matching your criteria. Try adjusting your search parameters.");
      }
      
      // Store jobs in context
      setJobResults(jobs);
      setSteps(6);
      
      return jobs; // Return jobs for immediate use
    } catch (err) {
      console.error("❌ Error fetching jobs:", err);
      setError(
        err.message ||
          "Failed to fetch jobs. Please check if backend is running properly."
      );
      setJobResults([]);
    } finally {
      setLoading(false);
    }
  };

  //  Reset All
  const resetForm = () => {
    setSteps(1);
    setJobResults([]);
    setError(null);
    setFormData({
      keywords: [],
      hourlyRate: "",
      fixedRate: "",
      badJobCriteria: [],
      accountType: "",
      profileUrl: "",
    });
  };

  // Dashboard states
  const [dashboardJobs, setDashboardJobs] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Dashboard Functions
  const fetchDashboardJobs = async () => {
    try {
      setDashboardLoading(true);
      const response = await fetch(`${API_BASE_URL}/dashboard/jobs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setDashboardJobs(data.jobs);
    } catch (error) {
      console.error('Dashboard jobs fetch error:', error);
      setError(error.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  const updateUserPreferences = async (preferences) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUserPreferences(data.preferences);
      return data.preferences;
    } catch (error) {
      console.error('Update preferences error:', error);
      setError(error.message);
      throw error;
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Notifications fetch error:', error);
      setError(error.message);
    }
  };

  // Prepare context value
  const value = {
    steps,
    setSteps,
    user,
    formData,
    setFormData,
    jobResults,
    setJobResults,
    loading,
    setLoading,
    error,
    setError,
    nextStep,
    prevStep,
    handleSubmit,
    resetForm,
    jobAPI,
    // Dashboard related
    dashboardJobs,
    dashboardLoading,
    fetchDashboardJobs,
    userPreferences,
    updateUserPreferences,
    notifications,
    fetchNotifications,
    // Auth related
    handleLogin,
    handleLogout,
    logOut: handleLogout,
    // Role helper
    userRole: user?.role || null
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
