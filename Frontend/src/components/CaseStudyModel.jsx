import React, { useState } from 'react';
import { X } from 'lucide-react';

const CaseStudyModal = ({ onClose, onSubmit }) => {
  const [caseStudy, setCaseStudy] = useState('');

  const handleUpgrade = () => {
    if (!caseStudy.trim()) {
      alert('Please add your case studies and company description.');
      return;
    }
    onSubmit(caseStudy);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <h3 className="text-white text-2xl font-bold mb-6">
          Want to upgrade your response? Add case studies below:
        </h3>
        
        <textarea
          value={caseStudy}
          onChange={(e) => setCaseStudy(e.target.value)}
          placeholder="Add your case studies and company description here..."
          className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 mb-6 min-h-[200px] focus:outline-none focus:border-lime-400 resize-none text-base"
        />
        
        <div className="flex gap-4">
          <button
            onClick={handleUpgrade}
            className="flex-1 bg-lime-400 hover:bg-lime-500 text-gray-900 py-4 rounded-lg font-bold transition text-base"
          >
            Upgrade prompt and regenerate
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg font-semibold transition text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyModal;