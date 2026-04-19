import { useState } from 'react';

const AdminCasesPanel = ({ cases, pagination, loading, onFetch, onResolve }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedCase, setExpandedCase] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({ status: 'resolved', action: 'none', resolution: '', adminNotes: '' });

  const handlePageChange = page => {
    onFetch({ page, status: statusFilter });
  };

  const handleResolve = async caseItem => {
    await onResolve(caseItem._id, resolutionForm);
    setExpandedCase(null);
  };

  return (
    <div className="admin-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="admin-title text-xl">Appeals & Reviews</h3>
          <p className="text-xs text-slate-500">Resolve user complaints and policy disputes</p>
        </div>
        <select
          value={statusFilter}
          onChange={event => {
            setStatusFilter(event.target.value);
            onFetch({ page: 1, status: event.target.value });
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading cases...</div>
      ) : (
        <div className="space-y-4">
          {cases.length === 0 && (
            <div className="text-sm text-slate-500">No appeals found.</div>
          )}
          {cases.map(item => (
            <div key={item._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.subject}</p>
                  <p className="text-xs text-slate-500">{item.userId?.email || item.userEmail}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{item.status}</span>
              </div>
              <p className="text-sm text-slate-600 mt-3">{item.description}</p>

              <button
                type="button"
                onClick={() => {
                  setExpandedCase(item._id === expandedCase ? null : item._id);
                  setResolutionForm({ status: 'resolved', action: 'none', resolution: '', adminNotes: '' });
                }}
                className="mt-3 text-xs font-semibold text-emerald-700"
              >
                {expandedCase === item._id ? 'Close Review' : 'Review & Resolve'}
              </button>

              {expandedCase === item._id && (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-600">Decision</label>
                    <select
                      value={resolutionForm.status}
                      onChange={event => setResolutionForm(prev => ({ ...prev, status: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <label className="text-xs font-semibold text-slate-600">Action</label>
                    <select
                      value={resolutionForm.action}
                      onChange={event => setResolutionForm(prev => ({ ...prev, action: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="none">No action</option>
                      <option value="suspend">Suspend</option>
                      <option value="unsuspend">Unsuspend</option>
                      <option value="block">Block</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-600">Resolution Notes (sent to user)</label>
                    <textarea
                      rows="4"
                      value={resolutionForm.resolution}
                      onChange={event => setResolutionForm(prev => ({ ...prev, resolution: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <label className="text-xs font-semibold text-slate-600">Internal Notes</label>
                    <textarea
                      rows="3"
                      value={resolutionForm.adminNotes}
                      onChange={event => setResolutionForm(prev => ({ ...prev, adminNotes: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {expandedCase === item._id && (
                <button
                  type="button"
                  onClick={() => handleResolve(item)}
                  className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Resolve Case & Notify User
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: pagination.pages }).map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  pagination.page === page
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCasesPanel;
