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
      ? 'border-red-300 bg-red-50 dark:border-red-400/40 dark:bg-red-500/10'
      : 'border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-500/10';

  const titleClass =
    tone === 'danger'
      ? 'text-red-900 dark:text-red-100'
      : 'text-amber-900 dark:text-amber-100';

  const descriptionClass =
    tone === 'danger'
      ? 'text-red-700 dark:text-red-200'
      : 'text-amber-700 dark:text-amber-200';

  return (
    <div className={`rounded-xl border p-4 transition-colors ${toneClass}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`text-base font-semibold ${titleClass}`}>{title}</p>
          <p className={`text-sm ${descriptionClass}`}>{description}</p>
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
