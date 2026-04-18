import React from 'react';

const UpgradeBanner = ({
  title,
  description,
  ctaLabel = 'Upgrade plan',
  onAction,
  tone = 'warning',
}) => {
  const toneClass =
    tone === 'danger'
      ? 'border-red-400/40 bg-red-500/10'
      : 'border-amber-400/40 bg-amber-500/10';

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="text-sm text-gray-200">{description}</p>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default UpgradeBanner;
