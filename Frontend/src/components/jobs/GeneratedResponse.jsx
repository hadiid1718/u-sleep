import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Copy, Send } from 'lucide-react';
import { AppContext } from '../../context/Context';
import { proposalAPI } from '../../services/proposalService';
import useSubscription from '../../hooks/useSubscription';
import UpgradeBanner from '../billing/UpgradeBanner';

const DEFAULT_ESTIMATED_DURATION = '7 days';

const GeneratedResponse = ({
  onLike,
  onDislike,
  onUpgrade,
  responseText,
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

  const { currentProposal } = useContext(AppContext);
  const {
    canDirectSend,
    usagePercentage,
    isQuotaExhausted,
    startCheckout,
    refreshSubscription,
  } = useSubscription();

  const defaultResponse = `Hi, what specific features or functionalities do you envision for your real-time video communication platform? Have you identified any particular challenges or requirements for integrating AI captions?

Similar project: We developed a real-time video communication solution with group call functionalities and AI captioning for a client, enhancing user engagement.

What time are you available tomorrow for a quick call?`;

  const displayText = responseText || currentProposal?.content || defaultResponse;
  const proposalId = currentProposal?.proposalId || currentProposal?._id;
  const isFreelancerJob = job?.source === 'freelancer_api';

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

    try {
      const result = await proposalAPI.sendProposal(proposalId, payload);
      if (result.success) {
        setSent(true);
        await refreshSubscription();
      } else {
        alert(result.error?.message || 'Failed to send proposal');
      }
    } catch (err) {
      alert(err.message || 'Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

  const handleQuickBidSelect = value => {
    setBidAmount(String(value));
    setBidFormError('');
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
      <div className="flex flex-col items-center justify-center gap-4 mb-8">
        <h3 className="text-white text-2xl font-bold">
          {isFreelancerJob ? 'Generated Bid Cover Letter' : 'Generated Response'}
        </h3>

        {(!canDirectSend || usagePercentage >= 80) && (
          <UpgradeBanner
            tone={isQuotaExhausted ? 'danger' : 'warning'}
            title={
              !canDirectSend
                ? 'Starter plan supports copy-only submissions'
                : 'Usage is approaching your plan limit'
            }
            description={
              !canDirectSend
                ? 'Upgrade to Pro or Agency to unlock direct send from this screen.'
                : 'Upgrade now to avoid interruptions and keep proposal generation active.'
            }
            ctaLabel="Upgrade to Pro"
            onAction={() => startCheckout('pro')}
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gray-900 border border-white text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
          >
            <Copy size={18} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {canDirectSend && (
            <button
              onClick={handleSend}
              disabled={sending || sent}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition font-bold ${
                sent
                  ? 'bg-green-600 text-white cursor-default'
                  : sending
                    ? 'bg-gray-600 text-gray-300 cursor-wait'
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
          )}
        </div>
      </div>

      {isFreelancerJob && (
        <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4">
          <p className="text-cyan-300 text-sm font-semibold mb-3">
            Freelancer Bid Details
          </p>

          {workflow?.suggestedBid && (
            <p className="mb-2 text-sm text-gray-300">
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
                  className="rounded-md border border-cyan-500/60 bg-cyan-900/20 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/40"
                >
                  {option.label}: ${option.value}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-300">
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
                className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Enter your bid"
              />
            </label>

            <label className="text-sm text-gray-300">
              Estimated duration
              <input
                type="text"
                value={estimatedDuration}
                onChange={event => {
                  setEstimatedDuration(event.target.value);
                  setBidFormError('');
                }}
                className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="e.g., 7 days"
              />
            </label>
          </div>

          <label className="mt-3 block text-sm text-gray-300">
            Delivery date (optional alternative)
            <input
              type="date"
              value={deliveryDate}
              onChange={event => {
                setDeliveryDate(event.target.value);
                setBidFormError('');
              }}
              className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </label>

          {bidFormError && (
            <p className="mt-3 text-sm text-red-300">{bidFormError}</p>
          )}
        </div>
      )}

      <div className="text-gray-300 text-base leading-relaxed space-y-5 mb-8 whitespace-pre-line">
        {displayText}
      </div>

      <button
        onClick={onUpgrade}
        className="w-full bg-gray-900 border-2 border-lime-400 text-lime-400 py-4 rounded-lg hover:bg-gray-800 transition mb-8 font-semibold text-base"
      >
        Want to upgrade your response? Add case studies
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onDislike}
          className="bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg flex items-center justify-center gap-2 transition font-semibold text-base"
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
