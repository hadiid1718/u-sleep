import React, { useState, useEffect, useContext } from 'react';
import LoadingScreen from '../shared/LoadingScreen';
import JobDetails from './JobDetail';
import GeneratedResponse from './GeneratedResponse';
import SuccessPopup from '../SuccessPopup';
import FeedbackModal from '../models/FeedBackModel';
import CaseStudyModal from '../models/CaseStudyModel';
import { AppContext } from '../../context/Context';
import { proposalAPI } from '../../utils/api';

const JobResponseGenerator = ({ job, onClose }) => {
  const { generateProposal, pollProposal, currentProposal } = useContext(AppContext);

  const [currentScreen, setCurrentScreen] = useState('loading');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCaseStudyModal, setShowCaseStudyModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Generate proposal on mount using the real API
  useEffect(() => {
    const startGeneration = async () => {
      const jobId = job?._id || job?.id;
      if (!jobId) {
        // No real job ID — fall back to timer
        const timer = setTimeout(() => setCurrentScreen('response'), 3000);
        return () => clearTimeout(timer);
      }

      try {
        const result = await generateProposal(jobId);
        if (result.success) {
          const proposalId = result.data?.data?.proposalId;
          if (proposalId) {
            const pollResult = await pollProposal(proposalId);
            if (pollResult.success) {
              setResponseText(pollResult.data?.data?.content || '');
            }
          }
        }
      } catch (err) {
        console.error('Proposal generation error:', err);
      } finally {
        setCurrentScreen('response');
      }
    };

    startGeneration();
  }, [job]);

  const handleDislike = () => {
    setShowFeedbackModal(true);
  };

  const handleLike = async () => {
    const proposalId = currentProposal?.proposalId || currentProposal?._id;
    if (proposalId) {
      await proposalAPI.rateProposal(proposalId, 5, 'User liked the proposal');
    }
    setShowSuccessPopup(true);
  };

  const handleSubmitFeedback = async (feedback) => {
    const proposalId = currentProposal?.proposalId || currentProposal?._id;
    if (proposalId) {
      await proposalAPI.rateProposal(proposalId, 2, feedback);
    }
    setShowFeedbackModal(false);
  };

  const handleUpgradeClick = () => {
    setShowCaseStudyModal(true);
  };

  const handleCaseStudySubmit = async (caseStudy) => {
    setShowCaseStudyModal(false);
    setIsRegenerating(true);

    const proposalId = currentProposal?.proposalId || currentProposal?._id;
    if (proposalId) {
      try {
        const result = await proposalAPI.upgradeProposal(proposalId, caseStudy);
        if (result.success) {
          const pollResult = await pollProposal(proposalId, 15, 3000);
          if (pollResult.success) {
            setResponseText(pollResult.data?.data?.content || '');
          }
        }
      } catch (err) {
        console.error('Proposal upgrade error:', err);
      }
    } else {
      // Fallback when no real proposalId
      await new Promise(resolve => setTimeout(resolve, 3000));
      setResponseText(`Enhanced proposal with case study:\n\n${caseStudy.substring(0, 200)}...\n\nWe look forward to discussing your project.`);
    }

    setIsRegenerating(false);
  };

  if (currentScreen === 'loading' || isRegenerating) {
    return <LoadingScreen />;
  }

  return (
    <div className=" p-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-white text-5xl font-bold mb-3">Job Response Generated</h1>
          <p className="text-gray-400 text-lg">Here's your AI-generated response for this job</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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