import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/Context';
import { Sidebar } from '../components/user/layout/Sidebar';
import { MobileHeader } from '../components/user/layout/MobileHeader';
import { DashboardView } from '../components/user/Dashboard/DashboardView';
import { PromptsView } from '../components/user/prompts/PromptsView';
import  NotificationsView  from '../components/user/notifications/NotificationsView';
import  SettingsView  from '../components/user/settings/SettingsView';
import SubscriptionView from '../components/user/subscription/SubscriptionView';

const Dashboard = () => {
  const { 
    user, 
    handleLogout, 
    dashboardJobs, 
    dashboardLoading, 
    fetchDashboardJobs,
    matchJob,
    rejectJob,
    setJobResults,
    fetchProposalStats,
  } = useContext(AppContext);
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // All your state management here
  const [formData, setFormData] = useState({
    feedName: 'Your feed name',
    keywords: 'react',
    // ... rest of your form data
  });

  const [formStates, setFormStates] = useState({
    profileSaved: true,
    companySaved: false,
    feedSaved: true,
    proposalsSaved: false,
    telegramSaved: false
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch dashboard jobs and proposal stats on mount
  useEffect(() => {
    if (user) {
      fetchDashboardJobs();
      fetchProposalStats();
    }
  }, [user]);

  const extractJobPrefill = (job) => {
    const minHourlyRate =
      job?.hourlyRate?.min ??
      (job?.budgetType === 'hourly' ? job?.budget?.min : null) ??
      '';
    const minFixedRate =
      job?.budgetType === 'fixed' ? (job?.budget?.amount ?? '') : '';

    return {
      minHourlyRate: minHourlyRate === null ? '' : String(minHourlyRate),
      minFixedRate: minFixedRate === null ? '' : String(minFixedRate),
      clientMinSpend:
        job?.clientInfo?.totalSpent !== null &&
        job?.clientInfo?.totalSpent !== undefined
          ? String(job.clientInfo.totalSpent)
          : '',
      clientMinRating:
        job?.clientInfo?.rating !== null &&
        job?.clientInfo?.rating !== undefined
          ? String(job.clientInfo.rating)
          : '',
    };
  };

  const handleJobAction = async (job, action = 'match') => {
    const jobId = job?._id || job?.id;
    if (!jobId) return;

    if (action === 'review') {
      setJobResults([job]);
      navigate('/job-result');
      return;
    }

    if (action === 'reject') {
      await rejectJob(jobId);
    } else {
      const result = await matchJob(jobId);
      if (result?.success) {
        setFormData(prev => ({
          ...prev,
          ...extractJobPrefill(job),
        }));
        setActiveMenu('prompts');
      }
    }

    // Refresh the job list
    await fetchDashboardJobs({ status: 'all' });
  };

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <DashboardView
            dashboardJobs={dashboardJobs}
            dashboardLoading={dashboardLoading}
            formStates={formStates}
            user={user}
            onMenuClick={handleMenuClick}
            handleJobAction={handleJobAction}
            formData={formData}
          />
        );
      case 'prompts':
        return (
          <PromptsView
            formData={formData}
            setFormData={setFormData}
            formStates={formStates}
            setFormStates={setFormStates}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            formData={formData}
            setFormData={setFormData}
            formStates={formStates}
          />
        );
      case 'settings':
        return (
          <SettingsView
            formData={formData}
            setFormData={setFormData}
            formStates={formStates}
            user={user}
          />
        );
      case 'subscription':
        return <SubscriptionView />;
      default:
        return <DashboardView {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Mobile Header */}
      {isMobile && <MobileHeader onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />}

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={user}
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        formData={formData}
      />

      {/* Main Content */}
      <div className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
        <div className="p-4 md:p-6 lg:p-8 min-h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;