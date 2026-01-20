import React, { createContext, useState } from "react";

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

const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  setUser(null);
  
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
