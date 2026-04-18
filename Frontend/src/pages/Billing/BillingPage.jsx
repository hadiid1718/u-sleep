import React from 'react';
import { Link } from 'react-router-dom';
import useSubscription from '../../hooks/useSubscription';
import PlanCard from '../../components/billing/PlanCard';
import UsageBar from '../../components/billing/UsageBar';
import UpgradeBanner from '../../components/billing/UpgradeBanner';

const BillingPage = ({ embedded = false }) => {
  const {
    plans,
    subscription,
    isAuthenticated,
    proposalLimit,
    proposalsUsed,
    usagePercentage,
    shouldShowUpgradeWarning,
    isQuotaExhausted,
    isLoading,
    error,
    startCheckout,
    openPortal,
    cancelAtPeriodEnd,
    isProcessingCheckout,
    isProcessingPortal,
    isProcessingCancel,
  } = useSubscription();

  const isActive = subscription?.isActive;
  const currentPlan = subscription?.plan;
  const pageBackgroundClass = embedded
    ? ''
    : 'min-h-[70vh] bg-gradient-to-br from-gray-900 to-black';

  const header = (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-gray-300">Manage your plan, usage, and renewal settings.</p>
      </div>
      {!embedded && (
        <Link to="/user/dashboard" className="text-sm text-lime-400 hover:text-lime-300">
          Back to dashboard
        </Link>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={pageBackgroundClass}>
        <div className="mx-auto w-full max-w-6xl p-6">
          {header}
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-6 text-gray-300">
            Loading billing details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageBackgroundClass}>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        {header}

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {!isAuthenticated && (
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm text-blue-100">
          Sign in to view your usage, current subscription status, and manage billing.
        </div>
      )}

      {shouldShowUpgradeWarning && (
        <UpgradeBanner
          tone={isQuotaExhausted ? 'danger' : 'warning'}
          title={
            isQuotaExhausted
              ? 'Monthly proposal quota reached'
              : 'You are close to your monthly proposal limit'
          }
          description={
            isQuotaExhausted
              ? 'Upgrade your plan to continue generating more AI proposals this month.'
              : 'Upgrade now to avoid interruptions and unlock direct send with higher limits.'
          }
          onAction={() => startCheckout('pro')}
          ctaLabel="Upgrade to Pro"
        />
      )}

      {isAuthenticated && (
        <>
          <UsageBar used={proposalsUsed} limit={proposalLimit} percentage={usagePercentage} />

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm text-gray-200">
            <p>
              Current status: <span className="font-semibold text-white">{subscription?.status || 'inactive'}</span>
            </p>
            <p>
              Current plan: <span className="font-semibold text-white">{currentPlan || 'none'}</span>
            </p>
            <p>
              Next reset date:{' '}
              <span className="font-semibold text-white">
                {subscription?.nextResetDate
                  ? new Date(subscription.nextResetDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isActive && (
              <button
                type="button"
                onClick={openPortal}
                disabled={isProcessingPortal}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                {isProcessingPortal ? 'Opening...' : 'Open Stripe Portal'}
              </button>
            )}

            {isActive && !subscription?.cancelAtPeriodEnd && (
              <button
                type="button"
                onClick={cancelAtPeriodEnd}
                disabled={isProcessingCancel}
                className="rounded-lg border border-red-400 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isProcessingCancel ? 'Cancelling...' : 'Cancel at period end'}
              </button>
            )}
          </div>
        </>
      )}

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              isCurrent={currentPlan === plan.planId}
              highlighted={plan.planId === 'pro'}
              disabled={isProcessingCheckout}
              onSelect={startCheckout}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
