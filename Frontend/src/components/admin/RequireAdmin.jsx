import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminAuthAPI } from '../../services/adminService';
import { clearAdminToken, getAdminToken } from '../../services/core/adminApiClient';

const RequireAdmin = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const token = getAdminToken();
      if (!token) {
        setAllowed(false);
        setChecking(false);
        return;
      }

      const response = await adminAuthAPI.getMe();
      if (response.success) {
        setAllowed(true);
      } else {
        clearAdminToken();
        setAllowed(false);
      }
      setChecking(false);
    };

    verify();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm tracking-wide uppercase text-slate-400">Verifying access</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default RequireAdmin;
