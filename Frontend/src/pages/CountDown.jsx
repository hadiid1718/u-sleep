import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CountdownTimer = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds countdown
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      if (onComplete) onComplete();
      navigate("/job-result");
    }
  }, [timeLeft, onComplete, navigate]); // ✅ include navigate in dependencies

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSkip = () => {
    if (onComplete) onComplete();
    navigate("/job-result");
  };

  return (
    <div className="bg-gray-900 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 border-4 border-green-400 rounded-full flex items-center justify-center">
            <span className="text-4xl font-mono text-green-400">
              {formatTime(timeLeft)}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Setting up your job recommendations...
          </h2>
          <p className="text-gray-300 text-lg">
            We're analyzing your profile and finding the best job matches for
            you
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
        </div>

        {/* Skip button for testing */}
        <button
          onClick={handleSkip}
          className="text-green-400 hover:text-green-300 underline transition-colors"
        >
          Skip countdown (for demo)
        </button>
      </div>
    </div>
  );
};

export default CountdownTimer;
