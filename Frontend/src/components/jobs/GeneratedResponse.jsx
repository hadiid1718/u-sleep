import React, { useState, useContext } from 'react';
import { Copy, Send } from 'lucide-react';
import { AppContext } from '../../context/Context';
import { proposalAPI } from '../../utils/api';
import useSubscription from '../../hooks/useSubscription';
import UpgradeBanner from '../billing/UpgradeBanner';

const GeneratedResponse = ({ onLike, onDislike, onUpgrade, responseText }) => {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
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

  const handleCopy = async () => {
    try {
      // If we have a proposalId, also call the copy API
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

  const handleSend = async () => {
    if (!proposalId) {
      alert('No proposal to send. Generate a proposal first.');
      return;
    }

    if (!canDirectSend) {
      alert('Direct send is available only on Pro and Agency plans.');
      return;
    }

    setSending(true);
    try {
      const result = await proposalAPI.sendProposal(proposalId);
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

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
      <div className="flex flex-col items-center justify-center gap-4 mb-8">
        <h3 className="text-white text-2xl font-bold">Generated Response</h3>

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
              {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
            </button>
          )}
        </div>
      </div>
      
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
