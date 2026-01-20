import React, { createContext, useState, useEffect } from "react";

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

  // ✅ ADD: Login function to update both localStorage and state
  const login = (userData, tokens) => {
    try {
      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      
      // Update state - this will trigger Header re-render
      setUser(userData);
    } catch (error) {
      console.error("Error during login:", error);
      setError("Failed to save login data");
    }
  };

  // ✅ UPDATED: Enhanced logout with optional API call
  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      
      // Optional: Call logout API if you have one
      if (accessToken && window.summaryApi?.logout) {
        try {
          await fetch(window.summaryApi.logout.url, {
            method: window.summaryApi.logout.method,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
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

  // ✅ ADD: Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
        login, // ✅ NEW: Expose login function
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};