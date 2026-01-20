import React, { useState } from 'react';
import { Copy, Send } from 'lucide-react';

const GeneratedResponse = ({ onLike, onDislike, onUpgrade, responseText }) => {
  const [copied, setCopied] = useState(false);

  const defaultResponse = `Hi, what specific features or functionalities do you envision for your real-time video communication platform? Have you identified any particular challenges or requirements for integrating AI captions?

Similar project: We developed a real-time video communication solution with group call functionalities and AI captioning for a client, enhancing user engagement.

What time are you available tomorrow for a quick call?`;

  const displayText = responseText || defaultResponse;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
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
          <button className="flex items-center gap-2 bg-lime-400 text-gray-900 px-5 py-2.5 rounded-lg hover:bg-lime-500 transition font-bold">
            <Send size={18} />
            Send
          </button>
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
          <span className="text-xl">😞</span>
          I don't like it
        </button>
        <button
          onClick={onLike}
          className="bg-lime-400 hover:bg-lime-500 text-gray-900 py-4 rounded-lg flex items-center justify-center gap-2 transition font-bold text-base"
        >
          <span className="text-xl">👍</span>
          I like it
        </button>
      </div>
    </div>
  );
};

export default GeneratedResponse;
