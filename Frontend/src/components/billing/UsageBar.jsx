import React from 'react';

const UsageBar = ({ used = 0, limit = 0, percentage = 0 }) => {
  const label =
    limit > 0 ? `${used}/${limit} proposals used` : `${used} proposals used`;

  const barColor = percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-400' : 'bg-lime-400';

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-gray-300">Monthly usage</span>
        <span className="font-semibold text-white">{label}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
      </div>
    </div>
  );
};

export default UsageBar;
