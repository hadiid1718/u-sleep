import React from 'react';

const ReasonModal = ({ isOpen, onClose, reason, setReason, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-white mb-4">
          Why are you dismatching this job?
        </h3>
        
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please explain why this job isn't a good fit..."
          className="w-full h-32 bg-gray-700 text-white rounded-lg p-4 mb-4 resize-none"
        />
        
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-green-400 hover:bg-green-500 text-gray-900 py-2 rounded-lg font-semibold transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;