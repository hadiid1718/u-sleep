import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';
import JobDetails from './JobDetail';
import GeneratedResponse from './GeneratedResponse';
import SuccessPopup from './SuccessPopup';
import FeedbackModal from './FeedBackModel';

const JobResponseGenerator = ({ onClose }) => {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (currentScreen === 'loading') {
      const timer = setTimeout(() => {
        setCurrentScreen('response');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const handleDislike = () => {
    setShowFeedbackModal(true);
  };

  const handleLike = () => {
    setShowSuccessPopup(true);
  };

  const handleSubmitFeedback = (feedback) => {
    console.log('Feedback submitted:', feedback);
    setShowFeedbackModal(false);
    // You can add API call here to submit feedback
  };

  if (currentScreen === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-black py-10 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-white text-5xl font-bold mb-3">Job Response Generated</h1>
          <p className="text-gray-400 text-lg">Here's your AI-generated response for this job</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <JobDetails />
          <GeneratedResponse onLike={handleLike} onDislike={handleDislike} />
        </div>
      </div>
      
      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleSubmitFeedback}
        />
      )}
      
      {showSuccessPopup && (
        <SuccessPopup onClose={() => setShowSuccessPopup(false)} />
      )}
    </div>
  );
};

export default JobResponseGenerator;