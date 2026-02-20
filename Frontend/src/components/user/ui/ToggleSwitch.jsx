import React from 'react';

export const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between">
    <div className="flex-1 pr-4">
      <h4 className="text-white font-medium">{label}</h4>
      {description && <p className="text-gray-400 mt-1 text-sm">{description}</p>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-400/20 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-green-600 shadow-lg"></div>
    </label>
  </div>
);