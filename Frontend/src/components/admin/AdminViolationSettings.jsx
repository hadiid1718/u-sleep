import { useState } from 'react';

const AdminViolationSettings = ({ settings, onSave, saving }) => {
  const [violationLimit, setViolationLimit] = useState(settings?.violationLimit || 3);
  const [autoSuspendEnabled, setAutoSuspendEnabled] = useState(
    settings?.autoSuspendEnabled !== false
  );

  const handleSubmit = async event => {
    event.preventDefault();
    await onSave({
      violationLimit: Number(violationLimit),
      autoSuspendEnabled,
    });
  };

  return (
    <div className="admin-card p-6">
      <h3 className="admin-title text-xl mb-2">Violation Guardrails</h3>
      <p className="text-xs text-slate-500 mb-6">
        Configure automatic enforcement when users exceed the allowed violation threshold.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="text-xs font-semibold text-slate-600">Violation limit before suspension</label>
          <input
            type="number"
            min="1"
            value={violationLimit}
            onChange={event => setViolationLimit(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={autoSuspendEnabled}
            onChange={event => setAutoSuspendEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
          />
          <span className="text-sm text-slate-600">Automatically suspend users who cross the limit</span>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default AdminViolationSettings;
