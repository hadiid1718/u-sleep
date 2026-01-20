import React from 'react';
import { Check, X } from 'lucide-react';

export const StatusButton = ({ isComplete, label, onClick, size = 'sm' }) => {
  const baseClasses = size === 'lg' 
    ? 'px-4 py-2 text-base font-semibold' 
    : 'px-3 py-1.5 text-sm font-medium';
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:scale-105 active:scale-95 ${
        isComplete
          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
          : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
      }`}
    >
      {isComplete ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
};