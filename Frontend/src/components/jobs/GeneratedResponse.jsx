import React, { useState, useContext, useEffect, useMemo } from 'react';
import { ArrowLeft, Copy, Send } from 'lucide-react';
import { AppContext } from '../../context/Context';
import { authAPI } from '../../services/authService';
import { proposalAPI } from '../../services/proposalService';
import useSubscription from '../../hooks/useSubscription';

const DEFAULT_ESTIMATED_DURATION = '7 days';

const GeneratedResponse = ({
  onLike,
  onDislike,
  onUpgrade,
  onBack,
  onRegenerate,
  responseText,
  generationError = '',
  job,
  workflow,
}) => {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [bidFormError, setBidFormError] = useState('');
  const [showConnectBanner, setShowConnectBanner] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');

  const { currentProposal } = useContext(AppContext);
  const { canDirectSend, refreshSubscription } = useSubscription();

  const proposalId = currentProposal?.proposalId || currentProposal?._id;
  const isFreelancerJob = job?.source === 'freelancer_api';
  const usedFallbackTemplate = currentProposal?.aiModel === 'fallback-template';
  const aiFailureReason = currentProposal?.generationError || '';
  const displayText = responseText || currentProposal?.content || '';

  const [isRetrying, setIsRetrying] = useState(false);

  const initialBidAmount = useMemo(() => {
    const draftBidAmount = workflow?.draftBidInput?.bidAmount;
    const suggestedMin = workflow?.suggestedBid?.suggestedMin;
    const jobFixedBudget = job?.budget?.amount;
    const jobHourlyMin = job?.hourlyRate?.min;

    const candidate =
      draftBidAmount ?? suggestedMin ?? jobFixedBudget ?? jobHourlyMin ?? 100;

    const normalized = Number(candidate);
    return Number.isFinite(normalized) && normalized > 0
      ? String(normalized)
      : '100';
  }, [workflow, job]);

  const quickBidOptions = useMemo(() => {
    const suggestedMin = Number(workflow?.suggestedBid?.suggestedMin);
    const suggestedMax = Number(workflow?.suggestedBid?.suggestedMax);

    if (
      !Number.isFinite(suggestedMin) ||
      !Number.isFinite(suggestedMax) ||
      suggestedMin <= 0 ||
      suggestedMax <= 0
    ) {
      return [];
    }

    const minValue = Math.min(suggestedMin, suggestedMax);
    const maxValue = Math.max(suggestedMin, suggestedMax);
    const midValue = Math.round((minValue + maxValue) / 2);

    return [
      { id: 'min', label: 'Min', value: minValue },
      { id: 'mid', label: 'Mid', value: midValue },
      { id: 'max', label: 'Max', value: maxValue },
    ];
  }, [workflow]);

  useEffect(() => {
    setBidAmount(initialBidAmount);
    setEstimatedDuration(
      workflow?.draftBidInput?.estimatedDuration || DEFAULT_ESTIMATED_DURATION
    );
    setDeliveryDate(workflow?.draftBidInput?.deliveryDate || '');
    setBidFormError('');
    setSent(false);
  }, [proposalId, initialBidAmount, workflow]);

  const handleCopy = async () => {
    try {
      if (proposalId) {
        proposalAPI.copyProposal(proposalId);
      }
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const buildFreelancerPayload = () => {
    const normalizedBid = Number(bidAmount);
    const normalizedDuration = String(estimatedDuration || '').trim();
    const normalizedDate = String(deliveryDate || '').trim();

    if (!Number.isFinite(normalizedBid) || normalizedBid <= 0) {
      return {
        payload: null,
        error: 'Please enter a valid bid amount greater than zero.',
      };
    }

    if (!normalizedDuration && !normalizedDate) {
      return {
        payload: null,
        error:
          'Please provide either an estimated duration or a delivery date before sending.',
      };
    }

    return {
      payload: {
        bidAmount: normalizedBid,
        estimatedDuration: normalizedDuration || undefined,
        deliveryDate: normalizedDate || undefined,
      },
      error: '',
    };
  };

  const handleSend = async () => {
    if (!proposalId) {
      alert('No proposal to send. Generate a proposal first.');
      return;
    }

    if (!canDirectSend) {
      alert('Direct send is available only on Pro and Agency plans.');
      return;
    }

    let payload = {};

    if (isFreelancerJob) {
      const freelancerPayload = buildFreelancerPayload();
      if (!freelancerPayload.payload) {
        setBidFormError(freelancerPayload.error);
        return;
      }
      payload = freelancerPayload.payload;
    }

    setBidFormError('');
    setSending(true);
    setShowConnectBanner(false);

    const storePendingSend = () => {
      if (!isFreelancerJob) return;

      const pending = {
        proposalId,
        payload,
        createdAt: Date.now(),
        returnTo: `${window.location.pathname}${window.location.search}`,
      };

      try {
        localStorage.setItem('pendingFreelancerSend', JSON.stringify(pending));
      } catch {
        // ignore storage failures
      }
    };

    try {
      // For Freelancer jobs, check and refresh OAuth token if needed
      if (isFreelancerJob) {
        try {
          const refreshResult = await proposalAPI.refreshFreelancerToken();
          if (!refreshResult.success) {
            throw new Error(
              refreshResult.error?.message ||
              'Failed to verify Freelancer token. Please reconnect your account.'
            );
          }
        } catch (refreshError) {
          // If token refresh fails, ask user to reconnect
          if (refreshError.statusCode === 401 || refreshError.code === 'FREELANCER_AUTH_MISSING' || refreshError.code === 'FREELANCER_TOKEN_EXPIRED_NO_REFRESH') {
            storePendingSend();
            const url = authAPI.getFreelancerOAuthUrl('connect-from-proposal');
            setConnectUrl(url);
            setShowConnectBanner(true);
            setSending(false);
            return;
          }
          // For other errors, continue anyway (might succeed)
          console.warn('Token refresh warning:', refreshError.message);
        }
      }

      const result = await proposalAPI.sendProposal(proposalId, payload);
      if (result.success) {
        setSent(true);
        await refreshSubscription();
      } else {
        const status = result.error?.statusCode || result.error?.status || 0;
        const message = result.error?.message || 'Failed to send proposal';
        const code = result.error?.code || '';

        // Check if it's an auth error
        if (status === 401 || status === 403 || code === 'FREELANCER_AUTH_MISSING') {
          storePendingSend();
          const url = authAPI.getFreelancerOAuthUrl('connect-from-proposal');
          setConnectUrl(url);
          setShowConnectBanner(true);
        } else {
          // Show the specific error from Freelancer API or backend
          setBidFormError(message);
        }
      }
    } catch (err) {
      const status = err.statusCode || err.status || 0;
      const message = err.message || 'Failed to send proposal';
      const code = err.code || '';

      if (status === 401 || status === 403 || code === 'FREELANCER_AUTH_MISSING') {
        storePendingSend();
        const url = authAPI.getFreelancerOAuthUrl('connect-from-proposal');
        setConnectUrl(url);
        setShowConnectBanner(true);
      } else {
        const extra = err.responseText ? `\n\nServer response:\n${err.responseText}` : '';
        setBidFormError(message + extra);
      }
    } finally {
      setSending(false);
    }
  };

  const handleQuickBidSelect = value => {
    setBidAmount(String(value));
    setBidFormError('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 sm:p-7 shadow-sm transition-colors">
      <div className="flex flex-col items-center justify-center gap-4 mb-8">
        <h3 className="text-gray-900 dark:text-white text-2xl font-bold text-center">
          {isFreelancerJob ? 'Generated Bid Cover Letter' : 'Generated Response'}
        </h3>

        <div className="flex flex-wrap justify-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-5 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition font-medium"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-5 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition font-medium"
          >
            <Copy size={18} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleSend}
            disabled={!canDirectSend || sending || sent}
            title={
              !canDirectSend
                ? 'Upgrade to Pro or Agency to enable direct send.'
                : undefined
            }
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition font-bold ${
              sent
                ? 'bg-green-600 text-white cursor-default'
                : sending
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-wait'
                  : !canDirectSend
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed'
                    : 'bg-lime-400 text-gray-900 hover:bg-lime-500'
            }`}
          >
            <Send size={18} />
            {sent
              ? isFreelancerJob
                ? 'Bid Sent!'
                : 'Sent!'
              : sending
                ? 'Sending...'
                : isFreelancerJob
                  ? 'Place Bid'
                  : 'Send'}
          </button>
        </div>
      </div>

      {isFreelancerJob && (
        <div className="mb-6 rounded-xl border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/20 p-4 transition-colors">
          <p className="text-cyan-800 dark:text-cyan-300 text-sm font-semibold mb-3">
            Freelancer Bid Details
          </p>

          {workflow?.suggestedBid && (
            <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
              Suggested bid range: {workflow.suggestedBid.suggestedMin || 'N/A'} -{' '}
              {workflow.suggestedBid.suggestedMax || 'N/A'}{' '}
              {workflow.suggestedBid.mode === 'hourly' ? 'per hour' : 'total'}
            </p>
          )}

          {quickBidOptions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {quickBidOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleQuickBidSelect(option.value)}
                  className="rounded-md border border-cyan-400 dark:border-cyan-500/60 bg-cyan-100 dark:bg-cyan-900/20 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-200 hover:bg-cyan-200 dark:hover:bg-cyan-900/40 transition-colors"
                >
                  {option.label}: ${option.value}
                </button>
              ))}
            </div>
          )}

            {showConnectBanner && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700">
                <p className="text-yellow-800 dark:text-yellow-200 mb-3">
                  Your Freelancer account is not connected or authentication failed. Connect to Freelancer to submit bids directly from the app.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(connectUrl, '_blank')}
                    className="px-4 py-2 bg-lime-500 text-white rounded-lg font-semibold"
                  >
                    Connect Freelancer Account
                  </button>
                  <button
                    onClick={() => {
                      // copy proposal to clipboard as fallback
                      navigator.clipboard.writeText(displayText || '');
                      alert('Proposal copied to clipboard. Open project on Freelancer and paste your proposal.');
                    }}
                    className="px-4 py-2 border border-lime-500 text-lime-600 rounded-lg font-semibold"
                  >
                    Copy Proposal (Manual)
                  </button>
                </div>
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Bid amount (USD)
              <input
                type="number"
                min="1"
                step="1"
                value={bidAmount}
                onChange={event => {
                  setBidAmount(event.target.value);
                  setBidFormError('');
                }}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Enter your bid"
              />
            </label>

            <label className="text-sm text-gray-700 dark:text-gray-300">
              Estimated duration
              <input
                type="text"
                value={estimatedDuration}
                onChange={event => {
                  setEstimatedDuration(event.target.value);
                  setBidFormError('');
                }}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                placeholder="e.g., 7 days"
              />
            </label>
          </div>

          <label className="mt-3 block text-sm text-gray-700 dark:text-gray-300">
            Delivery date (optional alternative)
            <input
              type="date"
              value={deliveryDate}
              onChange={event => {
                setDeliveryDate(event.target.value);
                setBidFormError('');
              }}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          {bidFormError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-300">{bidFormError}</p>
          )}
        </div>
      )}

      {(generationError || aiFailureReason || currentProposal?.status === 'failed') && (
        <div className="mb-6 rounded-xl border border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <div>
            {generationError || aiFailureReason || 'AI generation failed. Please verify your AI API keys and try again.'}
          </div>
          <div>
            {onRegenerate && (
              <button
                onClick={async () => {
                  try {
                    setIsRetrying(true);
                    await onRegenerate();
                  } finally {
                    setIsRetrying(false);
                  }
                }}
                className="ml-3 px-3 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-md font-semibold"
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="text-gray-700 dark:text-gray-300 text-base leading-relaxed space-y-5 mb-8 whitespace-pre-line">
        {displayText || 'No proposal has been generated yet.'}
      </div>

      <button
        onClick={onUpgrade}
        className="w-full bg-white dark:bg-slate-900 border-2 border-lime-500 text-lime-700 dark:text-lime-400 py-4 rounded-lg hover:bg-lime-50 dark:hover:bg-slate-800 transition mb-8 font-semibold text-base"
      >
        Want to upgrade your response? Add case studies
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onDislike}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-4 rounded-lg flex items-center justify-center gap-2 transition font-semibold text-base"
        >
          I don't like it
        </button>
        <button
          onClick={onLike}
          className="bg-lime-400 hover:bg-lime-500 text-gray-900 py-4 rounded-lg flex items-center justify-center gap-2 transition font-bold text-base"
        >
          I like it
        </button>
      </div>
    </div>
  );
};

export default GeneratedResponse;
