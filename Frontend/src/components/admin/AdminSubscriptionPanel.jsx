import { useEffect, useMemo, useRef, useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'past_due', label: 'Past due' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'incomplete_expired', label: 'Incomplete expired' },
  { value: 'unpaid', label: 'Unpaid' },
];

const FALLBACK_PLAN_OPTIONS = [
  { planId: 'starter', name: 'Starter' },
  { planId: 'pro', name: 'Pro' },
  { planId: 'agency', name: 'Agency' },
];

const formatDateTime = value => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const toInputDateTime = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const getStatusBadgeClass = status => {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'bg-emerald-100 text-emerald-700';
    case 'past_due':
    case 'unpaid':
      return 'bg-amber-100 text-amber-700';
    case 'canceled':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-rose-100 text-rose-700';
  }
};

const createEmptyForm = () => ({
  plan: '',
  status: '',
  cancelAtPeriodEnd: false,
  autoSendEnabled: false,
  platformLimit: '',
  proposalLimit: '',
  currentPeriodEnd: '',
  stripeCustomerId: '',
  stripeSubscriptionId: '',
});

const AdminSubscriptionPanel = ({
  subscriptions,
  availablePlans,
  loading,
  pagination,
  onFetch,
  onUpdate,
}) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm());
  const fetchRef = useRef(onFetch);

  useEffect(() => {
    fetchRef.current = onFetch;
  }, [onFetch]);

  useEffect(() => {
    fetchRef.current({ page, search, status, plan });
  }, [page, search, status, plan]);

  const planOptions = availablePlans?.length > 0 ? availablePlans : FALLBACK_PLAN_OPTIONS;
  const totalSubscriptions = pagination?.total || subscriptions.length;
  const activeSubscriptions = subscriptions.filter(item => ['active', 'trialing'].includes(item.status)).length;
  const cancelledSubscriptions = subscriptions.filter(item => item.status === 'canceled').length;

  const sortedPlans = useMemo(
    () =>
      [...planOptions].sort((left, right) => String(left.name || left.planId).localeCompare(String(right.name || right.planId))),
    [planOptions]
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData(createEmptyForm());
  };

  const handleEdit = subscription => {
    setEditingId(subscription._id);
    setFormData({
      plan: subscription.plan || '',
      status: subscription.status || '',
      cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
      autoSendEnabled: Boolean(subscription.autoSendEnabled),
      platformLimit: subscription.platformLimit ?? '',
      proposalLimit: subscription.proposalLimit ?? '',
      currentPeriodEnd: toInputDateTime(subscription.currentPeriodEnd),
      stripeCustomerId: subscription.stripeCustomerId || '',
      stripeSubscriptionId: subscription.stripeSubscriptionId || '',
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!editingId) return;

    const payload = {
      plan: formData.plan || undefined,
      status: formData.status || undefined,
      cancelAtPeriodEnd: formData.cancelAtPeriodEnd,
      autoSendEnabled: formData.autoSendEnabled,
      platformLimit: formData.platformLimit === '' ? undefined : Number(formData.platformLimit),
      proposalLimit: formData.proposalLimit === '' ? undefined : Number(formData.proposalLimit),
      currentPeriodEnd: formData.currentPeriodEnd || null,
      stripeCustomerId: formData.stripeCustomerId.trim(),
      stripeSubscriptionId: formData.stripeSubscriptionId.trim(),
    };

    await onUpdate(editingId, payload);
    resetForm();
  };

  const canGoPrevious = (pagination?.page || page) > 1;
  const canGoNext = (pagination?.page || page) < (pagination?.pages || 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="admin-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Subscriptions</p>
          <h3 className="admin-title mt-2 text-2xl">{totalSubscriptions}</h3>
          <p className="text-xs text-slate-500 mt-1">Managed billing records</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active</p>
          <h3 className="admin-title mt-2 text-2xl">{activeSubscriptions}</h3>
          <p className="text-xs text-slate-500 mt-1">Active or trialing plans</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cancelled</p>
          <h3 className="admin-title mt-2 text-2xl">{cancelledSubscriptions}</h3>
          <p className="text-xs text-slate-500 mt-1">Ended or pending end</p>
        </div>
      </div>

      <div className="admin-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="admin-title text-xl">Subscription Control</h3>
            <p className="text-xs text-slate-500">Search subscribers, inspect plan limits, and adjust live billing settings.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:min-w-[52rem]">
            <input
              type="text"
              value={search}
              onChange={event => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search user name or email"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-emerald-400"
            />
            <select
              value={status}
              onChange={event => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-emerald-400"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value || 'all-statuses'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={plan}
              onChange={event => {
                setPage(1);
                setPlan(event.target.value);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-emerald-400"
            >
              <option value="">All plans</option>
              {sortedPlans.map(option => (
                <option key={option.planId} value={option.planId}>
                  {option.name || option.planId}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPage(1)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-sm text-slate-500">
            Loading subscription data...
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Subscriber</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Limits</th>
                    <th className="px-4 py-3">Renewal</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                        No subscriptions found for the current filters.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map(subscription => (
                      <tr key={subscription._id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{subscription.userName}</p>
                          <p className="text-xs text-slate-500">{subscription.userEmail}</p>
                          <p className="text-[11px] text-slate-400">
                            {subscription.accountStatus || 'Unknown account'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{subscription.planLabel}</p>
                          <p className="text-xs text-slate-500">{subscription.plan}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(subscription.status)}`}>
                            {subscription.status}
                          </span>
                          {subscription.cancelAtPeriodEnd && (
                            <p className="mt-2 text-[11px] font-medium text-amber-700">Cancels at period end</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <p>Proposals: {subscription.proposalLimit}</p>
                          <p>Platforms: {subscription.platformLimit}</p>
                          <p>Auto-send: {subscription.autoSendEnabled ? 'Enabled' : 'Disabled'}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{formatDateTime(subscription.currentPeriodEnd)}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEdit(subscription)}
                            className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>
                Page {pagination?.page || page} of {pagination?.pages || 1}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(value => Math.max(1, value - 1))}
                  disabled={!canGoPrevious}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(value => value + 1)}
                  disabled={!canGoNext}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {editingId && (
        <div className="admin-card p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="admin-title text-xl">Edit Subscription</h3>
              <p className="text-xs text-slate-500">Update billing state, limits, and provider identifiers.</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Plan</span>
              <select
                value={formData.plan}
                onChange={event => setFormData(current => ({ ...current, plan: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              >
                <option value="">Keep current</option>
                {sortedPlans.map(option => (
                  <option key={option.planId} value={option.planId}>
                    {option.name || option.planId}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Status</span>
              <select
                value={formData.status}
                onChange={event => setFormData(current => ({ ...current, status: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              >
                <option value="">Keep current</option>
                {STATUS_OPTIONS.filter(option => option.value).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Current period end</span>
              <input
                type="datetime-local"
                value={formData.currentPeriodEnd}
                onChange={event => setFormData(current => ({ ...current, currentPeriodEnd: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Platform limit</span>
              <input
                type="number"
                min="1"
                value={formData.platformLimit}
                onChange={event => setFormData(current => ({ ...current, platformLimit: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Proposal limit</span>
              <input
                type="number"
                min="0"
                value={formData.proposalLimit}
                onChange={event => setFormData(current => ({ ...current, proposalLimit: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Stripe customer ID</span>
              <input
                type="text"
                value={formData.stripeCustomerId}
                onChange={event => setFormData(current => ({ ...current, stripeCustomerId: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2 text-sm xl:col-span-2">
              <span className="font-semibold text-slate-700">Stripe subscription ID</span>
              <input
                type="text"
                value={formData.stripeSubscriptionId}
                onChange={event => setFormData(current => ({ ...current, stripeSubscriptionId: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-400"
              />
            </label>

            <div className="flex flex-wrap items-center gap-4 md:col-span-2 xl:col-span-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.cancelAtPeriodEnd}
                  onChange={event => setFormData(current => ({ ...current, cancelAtPeriodEnd: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                Cancel at period end
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.autoSendEnabled}
                  onChange={event => setFormData(current => ({ ...current, autoSendEnabled: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                Auto-send enabled
              </label>
            </div>

            <div className="flex gap-3 md:col-span-2 xl:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPanel;
