import { useState } from 'react';

const buildDefaultMailForm = demoItem => {
  const demoDate = demoItem?.demoDate
    ? new Date(demoItem.demoDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  return {
    subject: `Demo Request Confirmation - ${demoItem?.name || demoItem?.email || 'User'}`,
    meetUrl: '',
    message: `Hello ${demoItem?.name || 'there'},\n\nThanks for requesting a demo. Here are your demo details:\n\nName: ${demoItem?.name || 'N/A'}\nEmail: ${demoItem?.email || 'N/A'}\nCompany: ${demoItem?.company || 'N/A'}\nPhone: ${demoItem?.phone || 'N/A'}\nDemo Date: ${demoDate}\nTime Slot: ${demoItem?.timeSlot || 'N/A'}\n\nPlease join the Google Meet link below at the scheduled time.\n`,
  };
};

const AdminDemoPanel = ({ demos, loading, onUpdateStatus, onSendMail, onCancel }) => {
  const [expandedDemo, setExpandedDemo] = useState(null);
  const [mailModal, setMailModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'scheduled' });
  const [mailForm, setMailForm] = useState(buildDefaultMailForm(null));
  const [mailSending, setMailSending] = useState(false);

  const handleStatusUpdate = async demoItem => {
    await onUpdateStatus(demoItem._id, statusForm);
    setExpandedDemo(null);
  };

  const handleCancel = async demoId => {
    if (window.confirm('Are you sure you want to cancel this demo request?')) {
      await onCancel(demoId);
    }
  };

  const openMailModal = demoItem => {
    setMailForm(buildDefaultMailForm(demoItem));
    setMailModal(demoItem);
  };

  const closeMailModal = () => {
    setMailModal(null);
    setMailSending(false);
  };

  const handleSendMail = async () => {
    if (!mailModal) return;
    setMailSending(true);
    try {
      const result = await onSendMail(mailModal._id, mailForm);
      if (result) {
        closeMailModal();
      }
    } finally {
      setMailSending(false);
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

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openMailModal(item)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Write Mail
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedDemo(item._id === expandedDemo ? null : item._id);
                    setStatusForm({ status: item.status || 'scheduled' });
                  }}
                  className="text-xs font-semibold text-emerald-700"
                >
                  {expandedDemo === item._id ? 'Close' : 'Manage Status'}
                </button>
              </div>

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

      {mailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">Compose Mail</p>
                <h4 className="mt-1 text-xl font-bold text-slate-900">Send demo details to {mailModal.email}</h4>
              </div>
              <button
                type="button"
                onClick={closeMailModal}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Demo summary</p>
              <p className="mt-1">
                {mailModal.name || 'Unknown'} {mailModal.company ? `• ${mailModal.company}` : ''}
              </p>
              <p>
                {mailModal.demoDate
                  ? new Date(mailModal.demoDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}{' '}
                at {mailModal.timeSlot || 'N/A'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Subject
                </label>
                <input
                  type="text"
                  value={mailForm.subject}
                  onChange={event => setMailForm({ ...mailForm, subject: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-300"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Google Meet URL
                </label>
                <input
                  type="url"
                  value={mailForm.meetUrl}
                  onChange={event => setMailForm({ ...mailForm, meetUrl: event.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-300"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Message
                </label>
                <textarea
                  rows="10"
                  value={mailForm.message}
                  onChange={event => setMailForm({ ...mailForm, message: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-300"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeMailModal}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendMail}
                  disabled={mailSending}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {mailSending ? 'Sending...' : 'Send Mail'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDemoPanel;
