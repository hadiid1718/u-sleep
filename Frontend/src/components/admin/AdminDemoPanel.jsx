import { useState } from 'react';

const AdminDemoPanel = ({ demos, loading, onUpdateStatus, onCancel }) => {
  const [expandedDemo, setExpandedDemo] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'scheduled' });

  const handleStatusUpdate = async demoItem => {
    await onUpdateStatus(demoItem._id, statusForm);
    setExpandedDemo(null);
  };

  const handleCancel = async demoId => {
    if (window.confirm('Are you sure you want to cancel this demo request?')) {
      await onCancel(demoId);
    }
  };

  const getStatusColor = status => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      noshow: 'bg-orange-100 text-orange-700',
      cancelled: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="admin-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="admin-title text-xl">Demo Requests</h3>
          <p className="text-xs text-slate-500">Manage and track demo bookings</p>
        </div>
        <div className="text-sm font-semibold text-emerald-700">
          Total: {demos.length}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading demo requests...</div>
      ) : (
        <div className="space-y-4">
          {demos.length === 0 && (
            <div className="text-sm text-slate-500">No demo requests found.</div>
          )}
          {demos.map(item => (
            <div key={item._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{item.email}</p>
                  {item.company && (
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-medium">Company:</span> {item.company}
                    </p>
                  )}
                  {item.phone && (
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Phone:</span> {item.phone}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mt-2">
                    <span className="font-medium">Scheduled:</span>{' '}
                    {item.demoDate
                      ? new Date(item.demoDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}{' '}
                    at {item.timeSlot}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusColor(item.status)}`}>
                  {item.status || 'scheduled'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExpandedDemo(item._id === expandedDemo ? null : item._id);
                  setStatusForm({ status: item.status || 'scheduled' });
                }}
                className="mt-3 text-xs font-semibold text-emerald-700"
              >
                {expandedDemo === item._id ? 'Close' : 'Manage Status'}
              </button>

              {expandedDemo === item._id && (
                <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
                  <label className="text-xs font-semibold text-slate-600">Update Status</label>
                  <select
                    value={statusForm.status}
                    onChange={event => setStatusForm({ ...statusForm, status: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="noshow">No Show</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(item)}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Save Status
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(item._id)}
                      className="flex-1 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Cancel Demo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDemoPanel;
