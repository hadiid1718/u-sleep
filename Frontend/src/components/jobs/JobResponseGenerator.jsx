import React, { useState, useEffect, useContext } from 'react';
import LoadingScreen from '../shared/LoadingScreen';
import JobDetails from './JobDetail';
import GeneratedResponse from './GeneratedResponse';
import SuccessPopup from '../SuccessPopup';
import FeedbackModal from '../models/FeedBackModel';
import CaseStudyModal from '../models/CaseStudyModel';
import { AppContext } from '../../context/Context';
import { proposalAPI } from '../../services/proposalService';
import useSubscription from '../../hooks/useSubscription';
import UpgradeBanner from '../billing/UpgradeBanner';

const JobResponseGenerator = ({ job }) => {
  const {
    generateProposal,
    pollProposal,
    currentProposal,
    freelancerProposalWorkflow,
  } = useContext(AppContext);
  const {
    usagePercentage,
    shouldShowUpgradeWarning,
    isQuotaExhausted,
    startCheckout,
    refreshSubscription,
  } = useSubscription();

  const [currentScreen, setCurrentScreen] = useState('loading');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCaseStudyModal, setShowCaseStudyModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isFreelancerJob = job?.source === 'freelancer_api';

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
          const defaultResponse = result.data?.data?.defaultResponse || '';

          if (proposalId) {
            const pollResult = await pollProposal(proposalId);
            if (pollResult.success) {
              setResponseText(pollResult.data?.data?.content || '');
              await refreshSubscription();
            } else if (defaultResponse) {
              setResponseText(defaultResponse);
            }
          } else if (defaultResponse) {
            setResponseText(defaultResponse);
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

        {isFreelancerJob && freelancerProposalWorkflow?.steps?.length > 0 && (
          <div className="mb-6 rounded-xl border border-cyan-300 bg-cyan-50 dark:border-cyan-500/40 dark:bg-cyan-950/20 p-4 text-left">
            <p className="text-cyan-800 dark:text-cyan-300 font-semibold mb-2">Freelancer Bid Steps</p>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {freelancerProposalWorkflow.steps.map(step => (
                <p key={step.id}>• {step.title}</p>
              ))}
            </div>
          </div>
        )}

        {shouldShowUpgradeWarning && (
          <div className="mb-6">
            <UpgradeBanner
              tone={isQuotaExhausted ? 'danger' : 'warning'}
              title={
                isQuotaExhausted
                  ? 'You have reached your monthly limit'
                  : `You are at ${usagePercentage}% of your monthly usage`
              }
              description="Upgrade your plan to keep generating and sending proposals without interruptions."
              ctaLabel="Upgrade plan"
              onAction={() => startCheckout('pro')}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-6 xl:gap-8 items-start">
          <JobDetails job={job} />
          <GeneratedResponse 
            onLike={handleLike} 
            onDislike={handleDislike}
            onUpgrade={handleUpgradeClick}
            responseText={responseText}
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