import React, { createContext, useState } from 'react';

export const AppContext = createContext();

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// API Service
const jobAPI = {
  searchJobs: async (formData) => {
    try {
      console.log('📡 Calling API:', `${API_BASE_URL}/jobs/search`);
      console.log('📦 Sending data:', formData);

      const response = await fetch(`${API_BASE_URL}/jobs/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Make sure backend is running on http://localhost:5000');
      }
      throw error;
    }
  },

  analyzeJob: async (jobData, userPreferences) => {
    const response = await fetch(`${API_BASE_URL}/jobs/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobData, userPreferences })
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze job');
    }
    
    return response.json();
  }
};

export const ContextProvider = ({ children }) => {
  const [steps, setSteps] = useState(1);
  const [user, setUser] = useState(null);
  
  // Form Data State
  const [formData, setFormData] = useState({
    keywords: [],
    hourlyRate: '',
    fixedRate: '',
    badJobCriteria: [],
    accountType: '',
    profileUrl: '',
  });

  // Jobs State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Navigation Functions
  const nextStep = () => {
    setSteps((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setSteps((prev) => Math.max(prev - 1, 1));
  };

  // Submit Function - Calls Backend API
  const handleSubmit = async (finalData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Submitting form data:', finalData);
      
      const response = await jobAPI.searchJobs(finalData);
      
      console.log('✅ API Response:', response);
      
      if (response.success && response.jobs) {
        console.log(`📦 Setting ${response.jobs.length} jobs in state`);
        setJobs(response.jobs);
        
        console.log('⏭️ Moving to step 6');
        setSteps(6);
        
        console.log('✅ Done! Jobs should now be visible');
      } else {
        throw new Error(response.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('❌ Error fetching jobs:', err);
      setError(err.message || 'Failed to connect to server. Please check if the backend is running on http://localhost:5000');
      
      // Don't move to step 6 if there's an error
      // Stay on step 5 so user can retry
    } finally {
      setLoading(false);
    }
  };

  // Reset Function
  const resetForm = () => {
    setSteps(1);
    setJobs([]);
    setError(null);
    setFormData({
      keywords: [],
      hourlyRate: '',
      fixedRate: '',
      badJobCriteria: [],
      accountType: '',
      profileUrl: '',
    });
  };

  const value = {
    steps,
    setSteps,
    user,
    setUser,
    formData,
    setFormData,
    jobs,
    setJobs,
    loading,
    setLoading,
    error,
    setError,
    nextStep,
    prevStep,
    handleSubmit,
    resetForm,
    jobAPI, // Export API for individual component use
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};