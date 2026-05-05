import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminDashboardOverview from '../../components/admin/AdminDashboardOverview';
import AdminUsersPanel from '../../components/admin/AdminUsersPanel';
import AdminCasesPanel from '../../components/admin/AdminCasesPanel';
import AdminViolationSettings from '../../components/admin/AdminViolationSettings';
import AdminDemoPanel from '../../components/admin/AdminDemoPanel';
import AdminComparisonPanel from '../../components/admin/AdminComparisonPanel';
import { adminAPI } from '../../services/adminService';
import { clearAdminToken } from '../../services/core/adminApiClient';
import './admin.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [casePagination, setCasePagination] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [demos, setDemos] = useState([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const [comparisons, setComparisons] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const metricsTimerRef = useRef(null);
  const metricsInFlightRef = useRef(false);

  const loadMetrics = async () => {
    if (metricsInFlightRef.current) return;
    metricsInFlightRef.current = true;
    const response = await adminAPI.getMetrics();
    if (response.success) {
      setMetrics(response.data?.data || null);
    }
    metricsInFlightRef.current = false;
  };

  const loadUsers = async ({ page = 1, search = '', status = '' } = {}) => {
    setUserLoading(true);
    const response = await adminAPI.getUsers({ page, limit: 10, search, status });
    if (response.success) {
      setUsers(response.data?.data?.items || []);
      setUserPagination(response.data?.data?.pagination || null);
    }
    setUserLoading(false);
  };

  const loadCases = async ({ page = 1, status = '' } = {}) => {
    setCaseLoading(true);
    const response = await adminAPI.getCases({ page, limit: 10, status });
    if (response.success) {
      setCases(response.data?.data?.items || []);
      setCasePagination(response.data?.data?.pagination || null);
    }
    setCaseLoading(false);
  };

  const loadSettings = async () => {
    const response = await adminAPI.getViolationSettings();
    if (response.success) {
      setSettings(response.data?.data || null);
    }
  };

  const loadDemos = async () => {
    setDemoLoading(true);
    const response = await adminAPI.getDemos();
    if (response.success) {
      setDemos(response.data?.data || []);
    }
    setDemoLoading(false);
  };

  const loadComparisons = async () => {
    setComparisonLoading(true);
    const response = await adminAPI.getComparisons();
    if (response.success) {
      setComparisons(response.data?.data || []);
    }
    setComparisonLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadMetrics();
    }
    if (activeTab === 'users') {
      loadUsers({ page: 1 });
    }
    if (activeTab === 'cases') {
      loadCases({ page: 1 });
    }
    if (activeTab === 'violations') {
      loadSettings();
    }
    if (activeTab === 'demo') {
      loadDemos();
    }
    if (activeTab === 'comparisons') {
      loadComparisons();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'dashboard') {
      if (metricsTimerRef.current) {
        clearInterval(metricsTimerRef.current);
        metricsTimerRef.current = null;
      }
      return undefined;
    }

    metricsTimerRef.current = setInterval(loadMetrics, 1000);

    return () => {
      if (metricsTimerRef.current) {
        clearInterval(metricsTimerRef.current);
        metricsTimerRef.current = null;
      }
    };
  }, [activeTab]);

  const handleUpdateUser = async (userId, payload) => {
    const response = await adminAPI.updateUser(userId, payload);
    if (response.success) {
      const updated = response.data?.data;
      setUsers(prev => prev.map(item => (item._id === userId ? updated : item)));
    }
  };

  const handleUpdateStatus = async (userId, payload) => {
    const response = await adminAPI.updateUserStatus(userId, payload);
    if (response.success) {
      const updated = response.data?.data;
      setUsers(prev => prev.map(item => (item._id === userId ? updated : item)));
    }
  };

  const handleDeleteUser = async userId => {
    const response = await adminAPI.deleteUser(userId);
    if (response.success) {
      setUsers(prev => prev.filter(item => item._id !== userId));
    }
  };

  const handleResolveCase = async (caseId, payload) => {
    const response = await adminAPI.resolveCase(caseId, payload);
    if (response.success) {
      setCases(prev => prev.map(item => (item._id === caseId ? response.data?.data : item)));
    }
  };

  const handleSaveSettings = async payload => {
    setSettingsSaving(true);
    const response = await adminAPI.updateViolationSettings(payload);
    if (response.success) {
      setSettings(response.data?.data || null);
    }
    setSettingsSaving(false);
  };

  const handleUpdateDemoStatus = async (demoId, payload) => {
    const response = await adminAPI.updateDemoStatus(demoId, payload);
    if (response.success) {
      setDemos(prev => prev.map(item => (item._id === demoId ? response.data?.data : item)));
    }
  };

  const handleCancelDemo = async demoId => {
    const response = await adminAPI.cancelDemo(demoId);
    if (response.success) {
      setDemos(prev => prev.filter(item => item._id !== demoId));
    }
  };

  const handleCreateComparison = async payload => {
    const response = await adminAPI.createComparison(payload);
    if (response.success) {
      setComparisons(prev => [...prev, response.data?.data]);
    }
  };

  const handleUpdateComparison = async (comparisonId, payload) => {
    const response = await adminAPI.updateComparison(comparisonId, payload);
    if (response.success) {
      setComparisons(prev => prev.map(item => (item._id === comparisonId ? response.data?.data : item)));
    }
  };

  const handleDeleteComparison = async comparisonId => {
    const response = await adminAPI.deleteComparison(comparisonId);
    if (response.success) {
      setComparisons(prev => prev.filter(item => item._id !== comparisonId));
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <div className="admin-layer px-4 py-6 md:px-8 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6">
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          />
          <main className="flex-1 space-y-6">
            {activeTab === 'dashboard' && <AdminDashboardOverview metrics={metrics} />}
            {activeTab === 'users' && (
              <AdminUsersPanel
                users={users}
                pagination={userPagination}
                loading={userLoading}
                onFetch={loadUsers}
                onUpdateUser={handleUpdateUser}
                onUpdateStatus={handleUpdateStatus}
                onDeleteUser={handleDeleteUser}
              />
            )}
            {activeTab === 'cases' && (
              <AdminCasesPanel
                cases={cases}
                pagination={casePagination}
                loading={caseLoading}
                onFetch={loadCases}
                onResolve={handleResolveCase}
              />
            )}
            {activeTab === 'violations' && (
              <AdminViolationSettings
                settings={settings}
                saving={settingsSaving}
                onSave={handleSaveSettings}
              />
            )}
            {activeTab === 'demo' && (
              <AdminDemoPanel
                demos={demos}
                loading={demoLoading}
                onFetch={loadDemos}
                onUpdateStatus={handleUpdateDemoStatus}
                onCancel={handleCancelDemo}
              />
            )}
            {activeTab === 'comparisons' && (
              <AdminComparisonPanel
                comparisons={comparisons}
                loading={comparisonLoading}
                onFetch={loadComparisons}
                onCreate={handleCreateComparison}
                onUpdate={handleUpdateComparison}
                onDelete={handleDeleteComparison}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
