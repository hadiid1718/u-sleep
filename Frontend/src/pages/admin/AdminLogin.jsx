import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthAPI } from '../../services/adminService';
import { setAdminToken } from '../../services/core/adminApiClient';
import './admin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async event => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide admin email and password.');
      return;
    }

    setLoading(true);
    const response = await adminAuthAPI.signIn(email.trim(), password);

    if (!response.success) {
      setError(response.error?.message || 'Failed to sign in.');
      setLoading(false);
      return;
    }

    const token = response.data?.data?.token;
    if (token) {
      setAdminToken(token);
      navigate('/admin/dashboard');
    } else {
      setError('Admin token missing from response.');
    }

    setLoading(false);
  };

  return (
    <div className="admin-shell flex items-center justify-center p-6">
      <div className="admin-layer w-full max-w-md fade-up">
        <div className="admin-card p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold">Admin Portal</p>
          <h1 className="admin-title text-3xl md:text-4xl mt-3 mb-2">Secure Admin Access</h1>
          <p className="text-sm text-slate-600 mb-6">
            This portal is reserved for the system administrator only.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="admin@jobfinder.ai"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                placeholder="Enter secure password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
          </form>

          <div className="mt-6 text-xs text-slate-500">
            Access attempts are monitored and logged.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
