const AdminSidebar = ({ activeTab, onTabChange, onLogout }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users' },
    { id: 'cases', label: 'Appeals' },
    { id: 'violations', label: 'Violations' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'review-video', label: 'Review Video' },
    { id: 'demo', label: 'Demo Requests' },
    { id: 'comparisons', label: 'Comparisons' },
  ];

  return (
    <aside className="admin-card w-full md:w-64 p-5 md:p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Control</p>
        <h2 className="admin-title text-2xl mt-2">Admin Desk</h2>
        <p className="text-xs text-slate-500 mt-2">System oversight and governance</p>
      </div>

      <nav className="space-y-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-200 hover:text-emerald-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-6 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-left text-sm font-semibold text-rose-700 hover:border-rose-300 hover:bg-rose-50"
      >
        Logout
      </button>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-600">
        Admin activity is logged. Use the dashboard to monitor module health.
      </div>
    </aside>
  );
};

export default AdminSidebar;
