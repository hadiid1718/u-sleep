import React from 'react';
import { Check } from 'lucide-react';

const PlanCard = ({
  plan,
  isCurrent,
  onSelect,
  disabled = false,
  highlighted = false,
}) => {
  return (
    <div
      className={`rounded-2xl border p-6 transition ${
        highlighted
          ? 'border-lime-400 bg-lime-400/5 shadow-lg shadow-lime-400/10'
          : 'border-gray-700 bg-gray-900'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
        {highlighted && (
          <span className="rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold text-black">
            Recommended
          </span>
        )}
      </div>

      <p className="mb-4 text-3xl font-bold text-white">
        ${plan.monthlyPrice}
        <span className="ml-1 text-sm font-normal text-gray-400">/month</span>
      </p>

      <div className="mb-4 text-sm text-gray-300">
        <p>Proposal limit: {plan.proposalLimit}</p>
        <p>Platform limit: {plan.platformLimit}</p>
        <p>Direct send: {plan.autoSendEnabled ? 'Yes' : 'No'}</p>
      </div>

      <ul className="mb-6 space-y-2 text-sm text-gray-200">
        {(plan.features || []).map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-lime-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(plan.planId)}
        disabled={disabled || isCurrent}
        className={`w-full rounded-lg px-4 py-2.5 font-semibold transition ${
          isCurrent
            ? 'cursor-default bg-gray-700 text-gray-300'
            : 'bg-lime-400 text-black hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400'
        }`}
      >
        {isCurrent ? 'Current plan' : 'Choose plan'}
      </button>
    </div>
  );
};

export default PlanCard;
