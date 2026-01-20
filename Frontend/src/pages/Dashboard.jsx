import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/Context';
import { Sidebar } from '../components/user/layout/Sidebar';
import { MobileHeader } from '../components/user/layout/MobileHeader';
import { DashboardView } from '../components/user/Dashboard/DashboardView';
import { PromptsView } from '../components/user/prompts/PromptsView';
import  NotificationsView  from '../components/user/notifications/NotificationsView';
import  SettingsView  from '../components/user/settings/SettingsView';

const Dashboard = () => {
  const { 
    user, 
    logOut, 
    dashboardJobs, 
    dashboardLoading, 
    fetchDashboardJobs,
    userPreferences, 
    updateUserPreferences 
  } = useContext(AppContext);

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
            handleJobAction={(id) => console.log('Job action', id)}
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
        onLogout={logOut}
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