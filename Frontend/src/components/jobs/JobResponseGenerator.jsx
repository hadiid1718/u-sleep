import React, { useState, useEffect } from 'react';
import LoadingScreen from '../shared/LoadingScreen';
import JobDetails from './JobDetail';
import GeneratedResponse from './GeneratedResponse';
import SuccessPopup from '../SuccessPopup';
import FeedbackModal from '../models/FeedBackModel';
import CaseStudyModal from '../models/CaseStudyModel';

const JobResponseGenerator = ({ job, onClose }) => {
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

  if (currentScreen === 'loading' || isRegenerating) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-6">
      
      {/* Page Container */}
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-white text-5xl font-bold mb-3">
            Job Response Generated
          </h1>
          <p className="text-gray-400 text-lg">
            Here's your AI-generated response for this job
          </p>
        </div>

        {/* Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-center">
          
          <div className="flex justify-center">
            <JobDetails job={job} />
          </div>

          <div className="flex justify-center">
            <GeneratedResponse
              onLike={() => setShowSuccessPopup(true)}
              onDislike={() => setShowFeedbackModal(true)}
              onUpgrade={() => setShowCaseStudyModal(true)}
              responseText={responseText}
              job={job}
            />
          </div>

        </div>
      </div>

      {/* Modals */}
      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={() => setShowFeedbackModal(false)}
        />
      )}

      {showSuccessPopup && (
        <SuccessPopup onClose={() => setShowSuccessPopup(false)} />
      )}

      {showCaseStudyModal && (
        <CaseStudyModal
          onClose={() => setShowCaseStudyModal(false)}
          onSubmit={(caseStudy) => {
            setShowCaseStudyModal(false);
            setIsRegenerating(true);

            setTimeout(() => {
              setResponseText(
                `Hi, based on a similar project where ${caseStudy.slice(0, 150)}...
We successfully delivered scalable AI-powered solutions.

When would you be available for a quick call?`
              );
              setIsRegenerating(false);
            }, 3000);
          }}
        />
      )}
    </div>
  );
};

export default JobResponseGenerator;
