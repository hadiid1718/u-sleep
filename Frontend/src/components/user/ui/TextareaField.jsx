import React from 'react';

export const TextareaField = ({ label, value, onChange, placeholder, rows = 5, className = '' }) => (
  <div>
    <label className="block text-gray-300 mb-2 font-medium">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200 resize-none ${className}`}
    />
  </div>
);