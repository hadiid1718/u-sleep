import React, { useState, useEffect } from 'react';
import { comparisonAPI } from '../../../utils/api';
import { Plus, Pencil, Trash2, Save, X, ArrowUpDown, Database } from 'lucide-react';

const ComparisonManagementSection = () => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState({ feature: '', uSleep: '', human: '', order: 0 });
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchComparisons = async () => {
    setLoading(true);
    setError('');
    const res = await comparisonAPI.getAllComparisons();
    if (res.success && res.data?.data) {
      setComparisons(res.data.data);
    } else {
      setError(res.error?.message || 'Failed to fetch comparisons. Is the backend running?');
    }
    setLoading(false);
  };

  useEffect(() => { fetchComparisons(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setError('');
    const res = await comparisonAPI.seedComparisons();
    if (res.success) {
      await fetchComparisons();
    } else {
      setError(res.data?.message || res.error?.message || 'Seed failed. Make sure the backend is running.');
    }
    setSeeding(false);
  };

  const handleCreate = async () => {
    if (!newRow.feature || !newRow.uSleep || !newRow.human) {
      setError('Please fill in all fields (Feature, U Sleep value, and Human value).');
      return;
    }
    setSaving(true);
    setError('');
    const res = await comparisonAPI.createComparison(newRow);
    if (res.success) {
      setComparisons(prev => [...prev, res.data.data]);
      setNewRow({ feature: '', uSleep: '', human: '', order: 0 });
      setShowAddForm(false);
    } else {
      setError(res.error?.message || 'Failed to create comparison row.');
    }
    setSaving(false);
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setEditData({ feature: row.feature, uSleep: row.uSleep, human: row.human, order: row.order, isActive: row.isActive });
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    const res = await comparisonAPI.updateComparison(editingId, editData);
    if (res.success) {
      setComparisons(prev => prev.map(c => c._id === editingId ? res.data.data : c));
      setEditingId(null);
    } else {
      setError(res.error?.message || 'Failed to update comparison row.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this comparison row?')) return;
    setError('');
    const res = await comparisonAPI.deleteComparison(id);
    if (res.success) {
      setComparisons(prev => prev.filter(c => c._id !== id));
    } else {
      setError(res.error?.message || 'Failed to delete comparison row.');
    }
  };

  const handleToggleActive = async (row) => {
    setError('');
    const res = await comparisonAPI.updateComparison(row._id, { isActive: !row.isActive });
    if (res.success) {
      setComparisons(prev => prev.map(c => c._id === row._id ? res.data.data : c));
    } else {
      setError(res.error?.message || 'Failed to toggle status.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-lime-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Comparison Table</h2>
          <p className="text-gray-400 text-sm mt-1">Manage the "U Sleep vs Human" comparison rows shown on the homepage</p>
        </div>
        <div className="flex gap-2">
          {comparisons.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              {seeding ? 'Seeding...' : 'Seed Defaults'}
            </button>
          )}
          <button
            onClick={() => { setShowAddForm(!showAddForm); setError(''); }}
            className="flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-white font-semibold mb-2">New Comparison Row</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Feature / Metric"
              value={newRow.feature}
              onChange={(e) => setNewRow(p => ({ ...p, feature: e.target.value }))}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:border-lime-400 focus:outline-none"
            />
            <input
              type="text"
              placeholder="U Sleep value"
              value={newRow.uSleep}
              onChange={(e) => setNewRow(p => ({ ...p, uSleep: e.target.value }))}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:border-lime-400 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Human value"
              value={newRow.human}
              onChange={(e) => setNewRow(p => ({ ...p, human: e.target.value }))}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:border-lime-400 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Order"
              value={newRow.order}
              onChange={(e) => setNewRow(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:border-lime-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="flex items-center gap-1 bg-lime-400 hover:bg-lime-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setShowAddForm(false); setError(''); setNewRow({ feature: '', uSleep: '', human: '', order: 0 }); }} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 bg-gray-700/50 p-4 text-sm font-semibold text-gray-300">
          <div className="col-span-1 flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> #</div>
          <div className="col-span-3">Feature</div>
          <div className="col-span-3">U Sleep</div>
          <div className="col-span-2">Human</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {comparisons.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No comparison rows yet. Click "Seed Defaults" or "Add Row" to get started.</div>
        ) : (
          comparisons.map((row) => (
            <div key={row._id} className="grid grid-cols-12 gap-2 p-4 border-t border-gray-700 items-center text-sm hover:bg-gray-700/30 transition">
              {editingId === row._id ? (
                <>
                  <div className="col-span-1">
                    <input type="number" value={editData.order} onChange={(e) => setEditData(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-gray-600 text-sm" />
                  </div>
                  <div className="col-span-3">
                    <input type="text" value={editData.feature} onChange={(e) => setEditData(p => ({ ...p, feature: e.target.value }))} className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-gray-600 text-sm" />
                  </div>
                  <div className="col-span-3">
                    <input type="text" value={editData.uSleep} onChange={(e) => setEditData(p => ({ ...p, uSleep: e.target.value }))} className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-gray-600 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <input type="text" value={editData.human} onChange={(e) => setEditData(p => ({ ...p, human: e.target.value }))} className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-gray-600 text-sm" />
                  </div>
                  <div className="col-span-1" />
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <button onClick={handleUpdate} disabled={saving} className="p-1.5 bg-lime-400 text-gray-900 rounded hover:bg-lime-300 transition disabled:opacity-50"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition"><X className="w-4 h-4" /></button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-1 text-gray-500">{row.order}</div>
                  <div className="col-span-3 text-white">{row.feature}</div>
                  <div className="col-span-3 text-lime-400 font-medium">{row.uSleep}</div>
                  <div className="col-span-2 text-gray-300">{row.human}</div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => handleToggleActive(row)}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold transition ${row.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                    >
                      {row.isActive ? 'Active' : 'Hidden'}
                    </button>
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(row._id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComparisonManagementSection;
