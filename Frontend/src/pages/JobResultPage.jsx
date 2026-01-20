import React, { useState } from "react";
import JobResponseGenerator from "../components/jobs/JobResponseGenerator";
import ReasonModal from "../components/models/ReasonModal";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* =======================
   STATIC MOCK DATA
======================= */

const STATIC_JOBS = [
  {
    title: "React Frontend Developer Needed",
    description:
      "We are looking for a skilled React developer to build responsive UI components.",
    budgetType: "hourly",
    budget: { min: 15, max: 30 },
    url: "https://www.upwork.com/",
    aiAnalysis:
      "Strong match based on React experience and frontend specialization.",
    redFlags: ["Low initial budget"],
    clientInfo: {
      jobsPosted: 25,
      paymentVerified: true,
      country: "United States",
    },
  },
  {
    title: "MERN Stack Developer",
    description:
      "Need a full-stack MERN developer for an ongoing SaaS project.",
    budgetType: "fixed",
    budget: { amount: 800 },
    url: "https://www.upwork.com/",
    aiAnalysis:
      "Good fit if you are comfortable with MongoDB and Node.js.",
    redFlags: [],
    clientInfo: {
      jobsPosted: 10,
      paymentVerified: false,
      country: "Canada",
    },
  },
];

const STATIC_FORM_DATA = {
  keywords: ["React", "Frontend", "MERN"],
};

/* =======================
   COMPONENT
======================= */

const JobResultPage = () => {
  const navigate = useNavigate();

  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showReasonModel, setShowReasonModel] = useState(false);
  const [reason, setReason] = useState("");
  const [showJobResponse, setShowJobResponse] = useState(false);
  const [dismissedJobs, setDismissedJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);

  const totalJobs = STATIC_JOBS.length;
  const currentJob = STATIC_JOBS[currentJobIndex];

  const handleDismatch = () => setShowReasonModel(true);

  const closeReasonModel = () => {
    setShowReasonModel(false);
    setReason("");
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Please provide at least one reason.");
      return;
    }

    setDismissedJobs((prev) => [
      ...prev,
      { job: currentJob, reason, timestamp: new Date().toISOString() },
    ]);

    moveToNextJob();
    closeReasonModel();
  };

  const handleMatch = () => {
    setMatchedJobs((prev) => [...prev, currentJob]);
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
     BUDGET FORMATTER
  ======================= */

  const budgetDisplay = (() => {
    if (!currentJob?.budget) return "Budget not specified";

    if (currentJob.budgetType === "hourly") {
      return `$${currentJob.budget.min}–$${currentJob.budget.max}/hr`;
    }

    if (currentJob.budgetType === "fixed") {
      return `$${currentJob.budget.amount} Fixed`;
    }

    return "Budget not specified";
  })();

  /* =======================
     UI
  ======================= */

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="text-center text-gray-300 mb-6">
        Job {currentJobIndex + 1} of {totalJobs}
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="bg-gray-800 p-6 rounded-lg border-2 border-green-400">
          <h2 className="text-2xl font-bold text-white mb-4">
            {currentJob.title}
          </h2>

          <div className="bg-lime-400 text-gray-900 px-4 py-2 rounded-lg inline-block mb-4 font-bold">
            {budgetDisplay}
          </div>

          {currentJob.redFlags.length > 0 && (
            <div className="bg-orange-600 text-white px-3 py-2 rounded-lg mb-4 flex gap-2">
              <AlertTriangle size={18} />
              {currentJob.redFlags.length} Red Flags
            </div>
          )}

          <p className="text-gray-300 mb-6">
            {currentJob.description}
          </p>

          <a
            href={currentJob.url}
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
            {currentJob.aiAnalysis}
          </p>

          <div className="mt-6 text-sm">
            <h4 className="text-lime-400 font-semibold mb-2">
              Your Criteria
            </h4>
            <p className="text-gray-300">
              Keywords: {STATIC_FORM_DATA.keywords.join(", ")}
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
