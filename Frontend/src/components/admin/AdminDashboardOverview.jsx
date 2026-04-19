const formatNumber = value => {
  if (typeof value !== 'number') return '0';
  return value.toLocaleString();
};

const formatHealth = health => {
  switch (health) {
    case 'healthy':
      return { label: 'Healthy', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'slow':
      return { label: 'Slow', color: 'text-amber-600', bg: 'bg-amber-50' };
    case 'degraded':
      return { label: 'Degraded', color: 'text-orange-600', bg: 'bg-orange-50' };
    case 'down':
      return { label: 'Down', color: 'text-rose-600', bg: 'bg-rose-50' };
    default:
      return { label: 'Idle', color: 'text-slate-500', bg: 'bg-slate-100' };
  }
};

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

const getProgressPercent = avgResponseMs => {
  const maxTargetMs = 2000;
  const safeValue = Number(avgResponseMs) || 0;
  if (safeValue <= 0) return 8;
  const percent = Math.round((safeValue / maxTargetMs) * 100);
  return clampValue(percent, 8, 100);
};

const AdminDashboardOverview = ({ metrics }) => {
  const summary = metrics?.summary || {};
  const modules = metrics?.modules || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-card p-5 fade-up stagger-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Traffic</p>
          <h3 className="admin-title text-2xl mt-2">{formatNumber(summary.totalRequests)}</h3>
          <p className="text-xs text-slate-500 mt-1">Requests captured across modules</p>
        </div>
        <div className="admin-card p-5 fade-up stagger-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Errors</p>
          <h3 className="admin-title text-2xl mt-2">{formatNumber(summary.totalErrors)}</h3>
          <p className="text-xs text-slate-500 mt-1">Server errors reported</p>
        </div>
        <div className="admin-card p-5 fade-up stagger-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Modules Monitored</p>
          <h3 className="admin-title text-2xl mt-2">{formatNumber(summary.modulesTracked)}</h3>
          <p className="text-xs text-slate-500 mt-1">Active API surfaces</p>
        </div>
      </div>

      <div className="admin-card p-6 fade-up stagger-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="admin-title text-xl">Module Health</h3>
            <p className="text-xs text-slate-500">Live signals from the API gateway</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {modules.length === 0 && (
            <div className="text-sm text-slate-500">No traffic recorded yet.</div>
          )}
          {modules.map(module => {
            const health = formatHealth(module.health);
            const avgMs = Number(module.avgResponseMs || 0);
            const progressPercent = getProgressPercent(avgMs);
            const progressClass =
              module.health === 'healthy'
                ? 'admin-progress--good'
                : 'admin-progress--bad';
            return (
              <div key={module.name} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-800">{module.name}</p>
                    <p className="text-xs text-slate-500">Avg response: {avgMs} ms</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${health.bg} ${health.color}`}>
                    {health.label}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <span>Latency</span>
                    <span>{avgMs} ms</span>
                  </div>
                  <div className={`admin-progress ${progressClass}`}>
                    <div
                      className="admin-progress__bar"
                      style={{ "--progress-width": `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-500">
                  <div>
                    <p className="font-semibold text-slate-700">{formatNumber(module.requests)}</p>
                    <p>Requests</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{Math.round(module.errorRate * 100)}%</p>
                    <p>Error Rate</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{module.lastStatusCode || '—'}</p>
                    <p>Last Status</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
