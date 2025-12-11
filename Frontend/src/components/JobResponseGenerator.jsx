import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';
import JobDetails from './JobDetail';
import GeneratedResponse from './GeneratedResponse';
import SuccessPopup from './SuccessPopup';
import FeedbackModal from './FeedBackModel';
import CaseStudyModal from './CaseStudyModel';

const JobResponseGenerator = ({ job, onClose }) => {
  console.log('JobResponseGenerator received job:', job);
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCaseStudyModal, setShowCaseStudyModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

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
    // Add your API call here to submit feedback
  };

  const handleUpgradeClick = () => {
    setShowCaseStudyModal(true);
  };

  const handleCaseStudySubmit = (caseStudy) => {
    console.log('Case study submitted:', caseStudy);
    setShowCaseStudyModal(false);
    setIsRegenerating(true);
    
    // Simulate API call to regenerate response with case study
    setTimeout(() => {
      // Generate upgraded response (in real app, this would come from your AI API)
      const upgradedResponse = generateUpgradedResponse(caseStudy);
      setResponseText(upgradedResponse);
      setIsRegenerating(false);
    }, 3000);
  };

  const generateUpgradedResponse = (caseStudy) => {
    // This is a simulation. In your real app, you would call your AI API here
    // and pass the case study to generate a better response
    return `Hi, what specific features or functionalities do you envision for your real-time video communication platform? Have you identified any particular challenges or requirements for integrating AI captions?

Similar project: ${caseStudy.substring(0, 200)}... We successfully delivered this solution, demonstrating our expertise in this domain.

Based on our experience with similar projects, we can provide:
- Scalable architecture for multi-user video sessions
- Advanced AI-powered features including real-time captioning
- Robust security and token management
- Mobile-optimized performance

What time are you available tomorrow for a quick call to discuss your specific requirements?`;
  };

  if (currentScreen === 'loading' || isRegenerating) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate py-10 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-white text-5xl font-bold mb-3">Job Response Generated</h1>
          <p className="text-gray-400 text-lg">Here's your AI-generated response for this job</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mx-auto max-w-7xl">
          <JobDetails job={job} />
          <GeneratedResponse 
            onLike={handleLike} 
            onDislike={handleDislike}
            onUpgrade={handleUpgradeClick}
            responseText={responseText}
            job={job}
          />
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

      {showCaseStudyModal && (
        <CaseStudyModal
          onClose={() => setShowCaseStudyModal(false)}
          onSubmit={handleCaseStudySubmit}
        />
      )}
    </div>
  );
};

export default JobResponseGenerator;