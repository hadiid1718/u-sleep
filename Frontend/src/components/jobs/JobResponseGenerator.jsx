import React, { useState, useEffect, useContext, useRef } from 'react';
import LoadingScreen from '../shared/LoadingScreen';
import JobDetails from './JobDetail';
import GeneratedResponse from './GeneratedResponse';
import SuccessPopup from '../SuccessPopup';
import FeedbackModal from '../models/FeedBackModel';
import CaseStudyModal from '../models/CaseStudyModel';
import { AppContext } from '../../context/Context';
import { proposalAPI } from '../../services/proposalService';
import useSubscription from '../../hooks/useSubscription';

const JobResponseGenerator = ({ job, aiService = 'gemini', onBack = null }) => {
  const {
    generateProposal,
    pollProposal,
    currentProposal,
    freelancerProposalWorkflow,
  } = useContext(AppContext);
  const { refreshSubscription } = useSubscription();

  const [currentScreen, setCurrentScreen] = useState('loading');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCaseStudyModal, setShowCaseStudyModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const isFreelancerJob = job?.source === 'freelancer_api';
  const generationKeyRef = useRef('');

  // Generate proposal on mount using the real API
  useEffect(() => {
    const startGeneration = async () => {
      setGenerationError('');
      setResponseText('');
      const jobId =
        job?._id || job?.id || job?.upworkJobId || job?.sourceJobId;
      if (!jobId) {
        setGenerationError(
          'Missing job identifier. Please refresh the job list and try again.'
        );
        setCurrentScreen('response');
        return;
      }

      const generationKey = `${jobId}:${aiService}`;
      if (generationKeyRef.current === generationKey) {
        return;
      }
      generationKeyRef.current = generationKey;

      try {
        const result = await generateProposal(jobId, aiService);
        if (!result.success) {
          setGenerationError(
            result.error?.message || 'Proposal generation failed.'
          );
          return;
        }

        const proposalId = result.data?.data?.proposalId;
        if (proposalId) {
          const pollResult = await pollProposal(proposalId);
          if (pollResult.success) {
            const content = pollResult.data?.data?.content || '';
            const aiModel = pollResult.data?.data?.aiModel || '';
            setResponseText(content);

            if (aiModel === 'fallback-template') {
              setGenerationError(
                'AI generation failed and a fallback template was used. Verify your AI API keys and try again.'
              );
            } else {
              setGenerationError('');
            }

            await refreshSubscription();
          } else {
            setGenerationError(
              pollResult.error?.message || 'Proposal generation timed out.'
            );
          }
        } else {
          setGenerationError('Proposal ID missing from the server response.');
        }
      } catch (err) {
        console.error('Proposal generation error:', err);
        setGenerationError(err.message || 'Proposal generation failed.');
      } finally {
        setCurrentScreen('response');
      }
    };

    startGeneration();
  }, [
    job,
    aiService,
    generateProposal,
    pollProposal,
    refreshSubscription,
  ]);

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
      setGenerationError(
        'Unable to upgrade without a generated proposal. Please generate a proposal first.'
      );
    }

    setIsRegenerating(false);
  };

  if (currentScreen === 'loading' || isRegenerating) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-gray-900 dark:text-white text-3xl sm:text-4xl font-bold mb-3">
            {isFreelancerJob ? 'Bid Proposal Generated' : 'Job Response Generated'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            {isFreelancerJob
              ? "Here's your AI-generated Freelancer bid cover letter"
              : "Here's your AI-generated response for this job"}
          </p>
        </div>

        
        
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-6 xl:gap-8 items-start">
          <JobDetails job={job} />
          <GeneratedResponse 
            onLike={handleLike} 
            onDislike={handleDislike}
            onUpgrade={handleUpgradeClick}
            onBack={onBack}
            responseText={responseText}
            generationError={generationError}
            job={job}
            workflow={isFreelancerJob ? freelancerProposalWorkflow : null}
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