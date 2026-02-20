import React from 'react';

export const InteractiveCard = ({ children, className = '', hover = true }) => (
  <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-xl transition-all duration-300 ${
    hover ? 'hover:border-gray-600 hover:shadow-2xl hover:scale-[1.01]' : ''
  } ${className}`}>
    {children}
  </div>
);