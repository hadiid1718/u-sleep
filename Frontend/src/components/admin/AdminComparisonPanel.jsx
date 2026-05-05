import { useState } from 'react';

const AdminComparisonPanel = ({ comparisons, loading, onFetch, onCreate, onUpdate, onDelete }) => {
  const [expandedForm, setExpandedForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ feature: '', uSleep: '', human: '', order: 0, isActive: true });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.feature || !formData.uSleep || !formData.human) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      await onUpdate(editingId, formData);
    } else {
      await onCreate(formData);
    }

    setFormData({ feature: '', uSleep: '', human: '', order: 0, isActive: true });
    setEditingId(null);
    setExpandedForm(false);
  };

  const handleEdit = item => {
    setFormData({ feature: item.feature, uSleep: item.uSleep, human: item.human, order: item.order, isActive: item.isActive });
    setEditingId(item._id);
    setExpandedForm(true);
  };

  const handleCancel = () => {
    setFormData({ feature: '', uSleep: '', human: '', order: 0, isActive: true });
    setEditingId(null);
    setExpandedForm(false);
  };

  const handleDelete = async comparisonId => {
    if (window.confirm('Are you sure you want to delete this comparison row?')) {
      await onDelete(comparisonId);
    }
  };

  return (
    <div className="admin-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="admin-title text-xl">Comparison Table</h3>
          <p className="text-xs text-slate-500">Manage feature comparison between U Sleep and Human</p>
        </div>
        <button
          type="button"
          onClick={() => {
            handleCancel();
            setExpandedForm(!expandedForm);
          }}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {expandedForm ? 'Cancel' : 'Add Row'}
        </button>
      </div>

      {expandedForm && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Feature/Metric Name</label>
                <input
                  type="text"
                  value={formData.feature}
                  onChange={e => setFormData({ ...formData, feature: e.target.value })}
                  placeholder="e.g., Response Time"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">U Sleep Value</label>
                <input
                  type="text"
                  value={formData.uSleep}
                  onChange={e => setFormData({ ...formData, uSleep: e.target.value })}
                  placeholder="e.g., < 100ms"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Human Value</label>
                <input
                  type="text"
                  value={formData.human}
                  onChange={e => setFormData({ ...formData, human: e.target.value })}
                  placeholder="e.g., > 500ms"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-xs font-semibold text-slate-600">Active</label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {editingId ? 'Update Row' : 'Add Row'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading comparisons...</div>
      ) : (
        <div className="overflow-x-auto">
          {comparisons.length === 0 ? (
            <div className="text-sm text-slate-500">No comparison rows found. Add one to get started.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Feature</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">U Sleep</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Human</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Order</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map(item => (
                  <tr key={item._id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800 font-medium">{item.feature}</td>
                    <td className="px-4 py-3 text-slate-600">{item.uSleep}</td>
                    <td className="px-4 py-3 text-slate-600">{item.human}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{item.order}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="text-rose-700 hover:text-rose-800 font-semibold text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminComparisonPanel;
