import React, { useState, useContext } from 'react';
import { Copy, Send, Coins } from 'lucide-react';
import { AppContext } from '../../context/Context';
import { proposalAPI } from '../../utils/api';

const GeneratedResponse = ({ onLike, onDislike, onUpgrade, responseText, job }) => {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { currentProposal, coinBalance, setCoinBalance, user, setUser } = useContext(AppContext);

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

    // Check coin balance before sending
    if (coinBalance < 1) {
      alert('Insufficient U-Coins. You need at least 1 coin to send a proposal. Please subscribe to get more coins.');
      return;
    }

    setSending(true);
    try {
      const result = await proposalAPI.sendProposal(proposalId);
      if (result.success) {
        setSent(true);
        // Update coin balance from response
        if (result.data?.coinsRemaining !== undefined) {
          setCoinBalance(result.data.coinsRemaining);
          if (user) {
            const updatedUser = { ...user, coins: result.data.coinsRemaining };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          // Decrement locally as fallback
          setCoinBalance(prev => Math.max(0, prev - 1));
        }
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
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gray-900 border border-white text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
          >
            <Copy size={18} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button 
            onClick={handleSend}
            disabled={sending || sent || coinBalance < 1}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition font-bold ${
              sent 
                ? 'bg-green-600 text-white cursor-default' 
                : sending 
                  ? 'bg-gray-600 text-gray-300 cursor-wait' 
                  : coinBalance < 1
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-lime-400 text-gray-900 hover:bg-lime-500'
            }`}
          >
            <Send size={18} />
            {sent ? 'Sent! (-1 coin)' : sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        {/* Coin Balance Indicator */}
        <div className="flex items-center gap-2 mt-2">
          <Coins size={16} className="text-orange-400" />
          <span className={`text-sm font-medium ${coinBalance < 1 ? 'text-red-400' : 'text-orange-400'}`}>
            {coinBalance.toLocaleString()} U-Coins remaining
          </span>
          {coinBalance < 1 && (
            <span className="text-red-400 text-xs">(Subscribe to get coins)</span>
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
