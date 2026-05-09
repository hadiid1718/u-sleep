import { useEffect, useState } from 'react';

const statusOptions = ['active', 'suspended', 'blocked'];

const AdminUsersPanel = ({ users, pagination, loading, onFetch, onUpdateUser, onUpdateStatus, onDeleteUser }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', violationCount: 0, accountStatus: 'active' });

  useEffect(() => {
    onFetch({ page: 1, search, status });
  }, [onFetch, search, status]);

  useEffect(() => {
    if (selectedUser) {
      setEditForm({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        violationCount: selectedUser.violationCount || 0,
        accountStatus: selectedUser.accountStatus || 'active',
      });
    }
  }, [selectedUser]);

  const handlePageChange = page => {
    onFetch({ page, search, status });
  };

  const handleEditSubmit = async event => {
    event.preventDefault();
    if (!selectedUser) return;
    await onUpdateUser(selectedUser._id, editForm);
  };

  const handleStatusAction = async (user, nextStatus) => {
    await onUpdateStatus(user._id, {
      status: nextStatus,
      reason: `${nextStatus} by admin`,
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
      <div className="admin-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="admin-title text-xl">User Directory</h3>
            <p className="text-xs text-slate-500">Search, edit, and enforce policy</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Search name or email"
            />
            <select
              value={status}
              onChange={event => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading users...</div>
        ) : (
          <div className="space-y-4">
            {users.length === 0 && (
              <div className="text-sm text-slate-500">No users found.</div>
            )}
            {users.map(user => (
              <div key={user._id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      Status: {user.accountStatus}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                      Violations: {user.violationCount}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      Jobs Matched: {user.stats?.jobsMatched || 0}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusAction(user, 'suspended')}
                    className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:border-amber-300"
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusAction(user, 'blocked')}
                    className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:border-rose-300"
                  >
                    Block
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusAction(user, 'active')}
                    className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:border-emerald-300"
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteUser(user._id)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
                  >
                    Delete
                  </button>
                </div>
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

      <div className="admin-card p-6">
        <h3 className="admin-title text-xl mb-4">Edit User</h3>
        {selectedUser ? (
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div>
              <label className="text-xs font-semibold text-slate-600">Name</label>
              <input
                value={editForm.name}
                onChange={event => setEditForm(prev => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                value={editForm.email}
                onChange={event => setEditForm(prev => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Violations</label>
              <input
                type="number"
                min="0"
                value={editForm.violationCount}
                onChange={event =>
                  setEditForm(prev => ({ ...prev, violationCount: Number(event.target.value) }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Account Status</label>
              <select
                value={editForm.accountStatus}
                onChange={event => setEditForm(prev => ({ ...prev, accountStatus: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Save Changes
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Select a user to edit details.</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPanel;
