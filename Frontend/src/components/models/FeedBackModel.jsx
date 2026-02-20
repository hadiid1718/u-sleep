import React, { useState } from 'react';
import { X } from 'lucide-react';

const FeedbackModal = ({ onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    onSubmit(feedback);
    setFeedback('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          </div>
          <h3 className="text-white text-2xl font-bold">How could it be better?</h3>
        </div>
        
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Please share your suggestions for improvement..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 mb-6 min-h-[140px] focus:outline-none focus:border-lime-400 resize-none text-base"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleSubmit}
            className="bg-lime-400 hover:bg-lime-500 text-gray-900 py-4 rounded-lg font-bold transition text-base"
          >
            Submit Feedback
          </button>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg font-semibold transition text-base"
          >
            Skip to Next Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;