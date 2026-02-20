import React from 'react';

export const InputField = ({ label, type = 'text', value, onChange, placeholder, className = '', ...props }) => (
  <div>
    <label className="block text-gray-300 mb-2 font-medium">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200 ${className}`}
      {...props}
    />
  </div>
);