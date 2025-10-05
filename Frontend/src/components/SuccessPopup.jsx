import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SuccessPopup = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 right-8 bg-lime-400 text-gray-900 p-6 rounded-xl shadow-2xl max-w-md w-full animate-slide-up z-50">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-lg">Job Response</h4>
        <button onClick={onClose} className="text-gray-900 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
      <p className="text-sm mb-4 text-gray-800 leading-relaxed">
        Wow, this is your job response! It is generated with our prompt, which works for us. But you will able to change it in the dashboard soon!
      </p>
      <button 
        onClick={onClose}
        className="w-full bg-gray-900 text-lime-400 py-3 rounded-lg font-bold hover:bg-gray-800 transition text-base"
      >
        Awesome! 🚀
      </button>
    </div>
  );
};

export default SuccessPopup;
